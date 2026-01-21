"use server"

import { getDb } from "@/lib/db"
import { predictions, comments, votes } from "@/lib/schema"
import { auth } from "@/auth"
import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function voteOnPrediction(predictionId: string, value: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const db = getDb()

  const prediction = await db.query.predictions.findFirst({
    where: eq(predictions.id, predictionId)
  })

  if (!prediction) {
    throw new Error("Prediction not found")
  }

  // Find existing vote
  const existing = await db.query.votes.findFirst({
    where: and(eq(votes.userId, userId), eq(votes.predictionId, predictionId))
  })

  if (existing) {
    if (value === 0) {
      await db.delete(votes).where(eq(votes.id, existing.id))
    } else {
      await db.update(votes).set({ value }).where(eq(votes.id, existing.id))
    }
  } else if (value !== 0) {
    await db.insert(votes).values({ userId, predictionId, value })
  }

  // Update prediction score
  const totalScore = await db.select({
    sum: sql<number>`sum(value)`
  }).from(votes).where(eq(votes.predictionId, predictionId))

  await db.update(predictions)
    .set({ voteScore: totalScore[0]?.sum || 0 })
    .where(eq(predictions.id, predictionId))

  revalidatePath("/feed")
  revalidatePath(`/feed/post/${prediction.slug}`)
}

export async function voteOnComment(commentId: string, value: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const db = getDb()

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId)
  })

  if (!comment) {
    throw new Error("Comment not found")
  }

  const existing = await db.query.votes.findFirst({
    where: and(eq(votes.userId, userId), eq(votes.commentId, commentId))
  })

  if (existing) {
    if (value === 0) {
      await db.delete(votes).where(eq(votes.id, existing.id))
    } else {
      await db.update(votes).set({ value }).where(eq(votes.id, existing.id))
    }
  } else if (value !== 0) {
    await db.insert(votes).values({ userId, commentId, value })
  }

  const totalScore = await db.select({
    sum: sql<number>`sum(value)`
  }).from(votes).where(eq(votes.commentId, commentId))

  await db.update(comments)
    .set({ voteScore: totalScore[0]?.sum || 0 })
    .where(eq(comments.id, commentId))

  const prediction = await db.query.predictions.findFirst({
    where: eq(predictions.id, comment.predictionId)
  })

  if (prediction) {
    revalidatePath("/feed")
    revalidatePath(`/feed/post/${prediction.slug}`)
  }
}

export async function addComment(predictionId: string, content: string, parentId?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const db = getDb()

  try {
    const prediction = await db.query.predictions.findFirst({
      where: eq(predictions.id, predictionId)
    })

    if (!prediction) {
      throw new Error("Prediction not found")
    }

    await db.insert(comments).values({
      userId: session.user.id,
      userName: session.user.name || "Anonymous",
      userImage: session.user.image,
      predictionId,
      content,
      parentId
    })

    // Increment comment count on prediction
    await db.update(predictions)
      .set({ commentCount: sql`coalesce(commentCount, 0) + 1` })
      .where(eq(predictions.id, predictionId))

    revalidatePath("/feed")
    revalidatePath(`/feed/post/${prediction.slug}`)
  } catch (error) {
    console.error("Failed to add comment:", error)
    throw new Error("Failed to add comment")
  }
}
