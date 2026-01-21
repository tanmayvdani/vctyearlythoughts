"use server"

import { auth } from "@/auth"
import { getDb } from "@/lib/db"
import { predictions, users, teamNotifications, regionNotifications, teams, emailChangeRequests } from "@/lib/schema"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { TEAMS } from "@/lib/teams"
import { getUnlockStatus, isRegionLocked } from "@/lib/vct-utils"
import { Resend as ResendClient } from "resend"

const predictionSchema = z.object({
  thought: z.string().min(1, "Thought cannot be empty").max(2048, "Thought is too long (max 2048 chars)"),
  teamId: z.string().regex(/^[a-z0-9-]+$/, "Invalid Team ID format"),
  teamName: z.string().min(1, "Team Name is required"),
  teamTag: z.string().optional(),
  isPublic: z.boolean().optional(),
  identity: z.string().optional(),
  kickoffPlacement: z.string().optional(),
  stage1Placement: z.string().optional(),
  stage2Placement: z.string().optional(),
  masters1Placement: z.string().optional(),
  masters2Placement: z.string().optional(),
  championsPlacement: z.string().optional(),
  rosterMoves: z.string().optional(),
})

const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username cannot exceed 32 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric (letters, numbers, underscore only)");

const emailSchema = z.string().email("Invalid email address");

const updatePredictionThoughtSchema = z.string()
  .min(1, "Thought cannot be empty")
  .max(2048, "Thought is too long (max 2048 chars)");

export async function updateUsername(username: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validatedName = usernameSchema.parse(username)
  const userId = session.user.id

  const db = getDb()
  await db.transaction(async (tx) => {
    await tx.update(users)
      .set({ name: validatedName })
      .where(eq(users.id, userId))

    await tx.update(predictions)
      .set({ userName: validatedName })
      .where(eq(predictions.userId, userId))
  })

  revalidatePath("/")
  revalidatePath("/my-feed")
  revalidatePath("/feed")
  return { success: true }
}

export async function requestEmailChange(newEmail: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const validatedEmail = emailSchema.parse(newEmail)

  const db = getDb()

  // Check if new email is already taken
  const existingUser = await db.select().from(users).where(eq(users.email, validatedEmail)).limit(1)
  if (existingUser.length > 0) {
    return { error: "This email is already in use" }
  }

  // Generate token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Store email change request
  await db.insert(emailChangeRequests).values({
    userId: session.user.id,
    newEmail: validatedEmail,
    token,
    expiresAt,
  })

  // Send magic link email
  const resend = new ResendClient(process.env.RESEND_API_KEY)
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const confirmUrl = `${baseUrl}/api/confirm-email-change?token=${token}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="background: #0f1923; margin: 0; padding: 20px; font-family: Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: #0f1923; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center" style="padding: 10px 0px; font-size: 22px; color: #ece8e1;">
        <strong>VCT Time Capsule</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0; color: #ece8e1; font-size: 16px;">
        Please confirm your email change by clicking the button below:
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="#ff4655">
              <a href="${confirmUrl}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid #ff4655; display: inline-block; font-weight: bold;">
                Confirm Email Change
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; color: #ece8e1;">
        This link will expire in 1 hour.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; color: #ece8e1;">
        If you did not request this change, you can safely ignore this email.
      </td>
    </tr>
  </table>
</body>
</html>
`

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: validatedEmail,
      subject: "Confirm Email Change - VCT Time Capsule",
      html,
      text: `Confirm Email Change\n\nPlease click the link below to confirm your email change:\n${confirmUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this change, you can safely ignore this email.`,
    })
  } catch (error) {
    console.error("Failed to send email change confirmation", error)
    return { error: "Failed to send confirmation email" }
  }

  return { success: true }
}

export async function subscribeToTeam(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Check existing
  const db = getDb()
  const existing = await db.select().from(teamNotifications).where(
    and(
      eq(teamNotifications.userId, session.user.id),
      eq(teamNotifications.teamId, teamId)
    )
  ).limit(1)

  if (existing.length === 0) {
    await db.insert(teamNotifications).values({
      userId: session.user.id,
      teamId: teamId,
    })
  }

  return { success: true }
}

export async function unsubscribeFromTeam(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const db = getDb()
  await db.delete(teamNotifications).where(
    and(
      eq(teamNotifications.userId, session.user.id),
      eq(teamNotifications.teamId, teamId)
    )
  )

  return { success: true }
}

export async function checkSubscription(teamId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  const db = getDb()
  const existing = await db.select().from(teamNotifications).where(
    and(
      eq(teamNotifications.userId, session.user.id),
      eq(teamNotifications.teamId, teamId)
    )
  ).limit(1)

  return existing.length > 0
}

export async function getUserSubscriptions() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const db = getDb()
  const results = await db.select({ teamId: teamNotifications.teamId })
    .from(teamNotifications)
    .where(eq(teamNotifications.userId, session.user.id))

  return results.map(r => r.teamId)
}

// Region Subscriptions
export async function subscribeToRegion(regionName: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const db = getDb()
  const existing = await db.select().from(regionNotifications).where(
    and(
      eq(regionNotifications.userId, session.user.id),
      eq(regionNotifications.regionName, regionName)
    )
  ).limit(1)

  if (existing.length === 0) {
    await db.insert(regionNotifications).values({
      userId: session.user.id,
      regionName: regionName,
    })
  }

  return { success: true }
}

export async function unsubscribeFromRegion(regionName: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const db = getDb()
  await db.delete(regionNotifications).where(
    and(
      eq(regionNotifications.userId, session.user.id),
      eq(regionNotifications.regionName, regionName)
    )
  )

  return { success: true }
}

export async function getUserRegionSubscriptions() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const db = getDb()
  const results = await db.select({ regionName: regionNotifications.regionName })
    .from(regionNotifications)
    .where(eq(regionNotifications.userId, session.user.id))

  return results.map(r => r.regionName)
}

export async function getUserPredictions() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const db = getDb()
  const results = await db.select()
    .from(predictions)
    .where(eq(predictions.userId, session.user.id))

  return results.map(p => ({
    ...p,
    isPublic: p.isPublic || false
  }))
}



function generateSlug(username: string, teamTag: string) {
  const cleanUser = username.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const cleanTeam = teamTag.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const random = Math.random().toString(36).substring(2, 6)
  return `${cleanUser}-predicts-${cleanTeam}-${random}`
}

export async function submitPrediction(formData: FormData) {
  const session = await auth()
  const cookieStore = await cookies()
  
  const rawData = {
    teamId: formData.get("teamId"),
    teamName: formData.get("teamName"),
    teamTag: formData.get("teamTag"),
    thought: formData.get("thought"),
    isPublic: formData.get("isPublic") === "true",
    identity: formData.get("identity"),
    kickoffPlacement: formData.get("kickoffPlacement"),
    stage1Placement: formData.get("stage1Placement"),
    stage2Placement: formData.get("stage2Placement"),
    masters1Placement: formData.get("masters1Placement"),
    masters2Placement: formData.get("masters2Placement"),
    championsPlacement: formData.get("championsPlacement"),
    rosterMoves: formData.get("rosterMoves"),
  }

  const validatedFields = predictionSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error.flatten())
    throw new Error(validatedFields.error.issues[0].message)
  }

  const { teamId, teamName, teamTag, thought, isPublic, identity, kickoffPlacement, stage1Placement, stage2Placement, masters1Placement, masters2Placement, championsPlacement, rosterMoves } = validatedFields.data

  // 1. Server-Side Unlock Check
  const team = TEAMS.find(t => t.id === teamId)
  if (!team) {
    throw new Error("Invalid Team ID")
  }
  
  // 2. Check if region is locked
  if (isRegionLocked(team.region)) {
    throw new Error(`The ${team.region} region is locked. New predictions and edits are no longer allowed.`)
  }
  
  const { isUnlocked } = getUnlockStatus(team)
  if (!isUnlocked) {
    throw new Error("This team is locked. You cannot submit a prediction yet.")
  }

  let userId = "guest"
  let userName = "Anonymous"

  if (session?.user) {
    userId = session.user.id || session.user.email || "user"
    if (identity === "username") userName = session.user.name || "User"
    if (identity === "email") userName = session.user.email || "User"
    if (identity === "anonymous") userName = "Anonymous"
  } else {
    // Guest flow with persistent cookie
    const existingGuestId = cookieStore.get("vct_guest_id")
    
    if (existingGuestId) {
      userId = existingGuestId.value
    } else {
      userId = "guest_" + crypto.randomUUID()
      cookieStore.set("vct_guest_id", userId, { 
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        path: '/'
      })
    }
    userName = "Guest"
  }

  const slug = generateSlug(userName, teamTag || "team")

  const db = getDb()
  await db.insert(predictions).values({
    teamId,
    teamName,
    teamTag: teamTag || "", // Provide fallback if optional
    thought,
    userId,
    userName,
    timestamp: new Date().toISOString(),
    isPublic,
    kickoffPlacement: kickoffPlacement || null,
    stage1Placement: stage1Placement || null,
    stage2Placement: stage2Placement || null,
    masters1Placement: masters1Placement || null,
    masters2Placement: masters2Placement || null,
    championsPlacement: championsPlacement || null,
    rosterMoves: rosterMoves || null,
    slug,
  })

  revalidatePath("/")
  revalidatePath("/feed")
  return { success: true }
}

export async function updatePrediction(predictionId: string, thought: string, isPublic: boolean) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedThought = updatePredictionThoughtSchema.parse(thought)

  // Verify ownership
  const db = getDb()
  const [prediction] = await db.select()
    .from(predictions)
    .where(and(
      eq(predictions.id, predictionId),
      eq(predictions.userId, session.user.id)
    ))
    .limit(1)

  if (!prediction) {
    throw new Error("Prediction not found or unauthorized")
  }

  // Check if region is locked
  const team = TEAMS.find(t => t.id === prediction.teamId)
  if (team && isRegionLocked(team.region)) {
    throw new Error(`The ${team.region} region is locked. Edits are no longer allowed.`)
  }

  await db.update(predictions)
    .set({
      thought: validatedThought,
      isPublic,
      // optionally update timestamp? maybe add an updatedAt column later.
      // For now let's keep original timestamp or update it.
      // Let's NOT update timestamp to preserve "time capsule" feel,
      // but maybe we should mark it as edited?
      // For simplicity in this task, just update thought/visibility.
    })
    .where(eq(predictions.id, predictionId))

  revalidatePath("/")
  revalidatePath("/my-feed")
  revalidatePath("/feed")
  return { success: true }
}

export async function updatePredictionFull(
  predictionId: string,
  thought: string,
  isPublic: boolean,
  kickoffPlacement?: string,
  stage1Placement?: string,
  stage2Placement?: string,
  masters1Placement?: string,
  masters2Placement?: string,
  championsPlacement?: string,
  rosterMoves?: string
) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validatedThought = updatePredictionThoughtSchema.parse(thought)

  // Verify ownership
  const db = getDb()
  const [prediction] = await db.select()
    .from(predictions)
    .where(and(
      eq(predictions.id, predictionId),
      eq(predictions.userId, session.user.id)
    ))
    .limit(1)

  if (!prediction) {
    throw new Error("Prediction not found or unauthorized")
  }

  // Check if region is locked
  const team = TEAMS.find(t => t.id === prediction.teamId)
  if (team && isRegionLocked(team.region)) {
    throw new Error(`The ${team.region} region is locked. Edits are no longer allowed.`)
  }

  await db.update(predictions)
    .set({
      thought: validatedThought,
      isPublic,
      kickoffPlacement: kickoffPlacement || null,
      stage1Placement: stage1Placement || null,
      stage2Placement: stage2Placement || null,
      masters1Placement: masters1Placement || null,
      masters2Placement: masters2Placement || null,
      championsPlacement: championsPlacement || null,
      rosterMoves: rosterMoves || null,
    })
    .where(eq(predictions.id, predictionId))

  revalidatePath("/")
  revalidatePath("/my-feed")
  revalidatePath("/feed")
  return { success: true }
}

export async function deletePrediction(predictionId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const db = getDb()
  
  // 1. Fetch prediction to check ownership and team
  const [prediction] = await db.select()
    .from(predictions)
    .where(and(
      eq(predictions.id, predictionId),
      eq(predictions.userId, session.user.id)
    ))
    .limit(1)

  if (!prediction) {
    // Prediction doesn't exist or doesn't belong to user
    // We can just return success or throw error. 
    // Usually idempotent delete is fine, but here we want to ensure ownership.
    return { success: true }
  }

  // 2. Check if region is locked
  const team = TEAMS.find(t => t.id === prediction.teamId)
  if (team && isRegionLocked(team.region)) {
    throw new Error(`The ${team.region} region is locked. Deletions are no longer allowed.`)
  }

  // 3. Verify ownership and delete (we already verified ownership above, but using where clause again is safe)
  await db.delete(predictions)
    .where(and(
      eq(predictions.id, predictionId),
      eq(predictions.userId, session.user.id)
    ))

  revalidatePath("/")
  revalidatePath("/my-feed")
  revalidatePath("/feed")
  return { success: true }
}

export async function getTeamData(teamId: string) {
  const db = getDb()
  const result = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
  if (result.length === 0) return null
  
  const team = result[0]
  return {
    ...team,
    roster: team.roster ? JSON.parse(team.roster) : [],
    transactions: team.transactions ? JSON.parse(team.transactions) : []
  }
}
