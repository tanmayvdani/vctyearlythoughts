import { db } from "@/lib/db"
import { teamNotifications, users } from "@/lib/schema"
import { TEAMS } from "@/lib/teams"
import { getUnlockStatus } from "@/lib/vct-utils"
import { eq, and, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Check for secret to preventing public abuse (simple protection)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // allowing bypass for dev if no secret set, or return 401
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const now = new Date()
  
  // 1. Identify teams that JUST unlocked or are unlocked (but we only want to notify once)
  // For simplicity, we check all unlocked teams, and rely on 'sent=false' in DB to avoid spam.
  
  const unlockedTeamIds = TEAMS
    .filter(team => getUnlockStatus(team, now).isUnlocked)
    .map(team => team.id)

  if (unlockedTeamIds.length === 0) {
    return NextResponse.json({ message: "No teams unlocked" })
  }

  // 2. Find pending notifications for these teams
  const pending = await db
    .select({
      id: teamNotifications.id,
      userId: teamNotifications.userId,
      teamId: teamNotifications.teamId,
      email: users.email,
    })
    .from(teamNotifications)
    .innerJoin(users, eq(teamNotifications.userId, users.id))
    .where(
      and(
        inArray(teamNotifications.teamId, unlockedTeamIds),
        eq(teamNotifications.sent, false)
      )
    )

  if (pending.length === 0) {
    return NextResponse.json({ message: "No pending notifications" })
  }

  // 3. Send Emails
  const results = await Promise.all(pending.map(async (record) => {
    const team = TEAMS.find(t => t.id === record.teamId)
    if (!team) return null

    try {
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'VCT Capsule <notifications@resend.dev>',
                to: record.email,
                subject: `Unlocked: ${team.name}`,
                html: `<p>The team <strong>${team.name}</strong> is now unlocked in the Time Capsule.</p><p><a href="http://localhost:3000">Predict Now</a></p>`
            })
        } else {
            console.log(`[MOCK EMAIL] To: ${record.email} | Subject: Unlocked: ${team.name}`)
        }

        // Mark as sent
        await db
            .update(teamNotifications)
            .set({ sent: true })
            .where(eq(teamNotifications.id, record.id))
        
        return record.id
    } catch (error) {
        console.error("Failed to send email", error)
        return null
    }
  }))

  return NextResponse.json({ 
    success: true, 
    sentCount: results.filter(Boolean).length 
  })
}
