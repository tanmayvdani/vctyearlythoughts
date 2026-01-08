import { getDb } from "@/lib/db"
import { teamNotifications, users, emailOutbox } from "@/lib/schema"
import { TEAMS } from "@/lib/teams"
import { getUnlockStatus } from "@/lib/vct-utils"
import { getBaseUrl } from "@/lib/utils"
import { eq, and, inArray, or, isNull, lte, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { Resend } from "resend"


const resend = new Resend(process.env.RESEND_API_KEY)


async function sendTeamNotificationEmail(payload: {
  email: string
  teamId: string
}) {
  const team = TEAMS.find(t => t.id === payload.teamId)
  if (!team) {
    throw new Error(`Team ${payload.teamId} not found`)
  }

  const predictUrl = new URL("/", getBaseUrl()).toString()

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "VCT Capsule <notifications@resend.dev>",
      to: payload.email,
      subject: `Unlocked: ${team.name}`,
      html: `<p>The team <strong>${team.name}</strong> is now unlocked in the Time Capsule.</p>
             <p><a href="${predictUrl}">Predict Now</a></p>`,
    })
  } else {
    console.log(
      `[MOCK EMAIL] To: ${payload.email} | Subject: Unlocked: ${team.name}`
    )
  }
}


export async function GET(request: Request) {
  // ---- auth guard (unchanged logic) ----
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
  }

  const now = new Date()
  const db = getDb()

  // ---- STEP 1: find unlocked teams ----
  const unlockedTeamIds = TEAMS
    .filter(team => getUnlockStatus(team, now).isUnlocked)
    .map(team => team.id)

  if (unlockedTeamIds.length === 0) {
    return NextResponse.json({ message: "No teams unlocked" })
  }

  // ---- STEP 2: discover subscriptions that need notifications ----
  const subscriptions = await db
    .select({
      teamNotificationId: teamNotifications.id,
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

  if (subscriptions.length === 0) {
    return NextResponse.json({ message: "No pending notifications" })
  }

  // ---- STEP 3: insert outbox rows (transactional) ----
  await db.transaction(async (tx) => {
    for (const sub of subscriptions) {
      await tx.insert(emailOutbox).values({
        type: "team_notification",
        payload: JSON.stringify({
          email: sub.email,
          teamId: sub.teamId,
          teamNotificationId: sub.teamNotificationId,
        }),
        status: "pending",
      })
    }
  })

  // ---- STEP 4: process pending outbox items ----
  const pendingOutbox = await db
    .select()
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.status, "pending"),
        or(
          isNull(emailOutbox.nextRetryAt),
          lte(emailOutbox.nextRetryAt, now)
        )
      )
    )

  let sentCount = 0
  let failedCount = 0

  for (const item of pendingOutbox) {
    // idempotency guard
    if (item.status === "sent") continue
    if (item.attempts >= 5) continue

    const payload = JSON.parse(item.payload) as {
      email: string
      teamId: string
      teamNotificationId: string
    }

    const nextDelayMs = Math.min(
      24 * 60 * 60 * 1000,
      Math.pow(2, item.attempts) * 60 * 60 * 1000
    )

    // ---- STEP 4a: increment attempts BEFORE send ----
    await db.transaction(async (tx) => {
      await tx
        .update(emailOutbox)
        .set({
          attempts: sql`${emailOutbox.attempts} + 1`,
          updatedAt: new Date(),
          nextRetryAt: new Date(Date.now() + nextDelayMs),
        })
        .where(eq(emailOutbox.id, item.id))
    })

    try {
      // ---- STEP 4b: send email (outside transaction) ----
      await sendTeamNotificationEmail({
        email: payload.email,
        teamId: payload.teamId,
      })

      // ---- STEP 4c: mark outbox + subscription as sent ----
      await db.transaction(async (tx) => {
        await tx
          .update(emailOutbox)
          .set({
            status: "sent",
            sentAt: new Date(),
            updatedAt: new Date(),
            nextRetryAt: null,
          })
          .where(eq(emailOutbox.id, item.id))

        await tx
          .update(teamNotifications)
          .set({ sent: true })
          .where(eq(teamNotifications.id, payload.teamNotificationId))
      })

      sentCount++
    } catch (err) {
      failedCount++

      console.error(
        `Outbox send failed (id=${item.id}, attempt=${item.attempts + 1})`,
        err
      )

      await db.transaction(async (tx) => {
        await tx
          .update(emailOutbox)
          .set({
            status: item.attempts + 1 >= 5 ? "failed" : "pending",
            lastError: String(err),
            updatedAt: new Date(),
          })
          .where(eq(emailOutbox.id, item.id))
      })
    }
  }

  return NextResponse.json({
    success: true,
    queued: subscriptions.length,
    sentCount,
    failedCount,
  })
}
