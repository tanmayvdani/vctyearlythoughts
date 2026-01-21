import { getDb } from "@/lib/db"
import { predictions, comments, votes } from "@/lib/schema"
import { eq, and, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PredictionCard } from "@/components/prediction-card"
import { CommentSection } from "@/components/comment-section"
import { auth } from "@/auth"
import { Navbar } from "@/components/navbar"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params
  const db = getDb()

  const [prediction] = await db.select().from(predictions).where(eq(predictions.slug, slug)).limit(1)

  if (!prediction) {
    notFound()
  }

  const session = await auth()

  // Get user's vote on this prediction
  let userVoteValue = 0
  if (session?.user?.id) {
    const userVote = await db.query.votes.findFirst({
      where: and(eq(votes.userId, session.user.id), eq(votes.predictionId, prediction.id))
    })
    userVoteValue = userVote?.value || 0
  }

  // Get all comments for this prediction
  const allComments = await db.query.comments.findMany({
    where: eq(comments.predictionId, prediction.id),
    orderBy: (comments, { desc }) => [desc(comments.createdAt)]
  })

  // Get user's votes on comments
  const commentVotesMap = new Map()
  if (session?.user?.id) {
    const userCommentVotesFull = await db.select().from(votes).where(
      and(
        eq(votes.userId, session.user.id), 
        sql`commentId IS NOT NULL`
      )
    )
    userCommentVotesFull.forEach(v => {
      if (v.commentId) commentVotesMap.set(v.commentId, v.value)
    })
  }

  const formattedComments = allComments.map(c => ({
    ...c,
    createdAt: c.createdAt || new Date(),
    userVote: commentVotesMap.get(c.id) || 0
  }))

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-2xl px-4 py-8 space-y-8">
          <Link href="/feed" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 w-fit">
            ← Back to Feed
          </Link>
          
          <PredictionCard 
            prediction={prediction} 
            currentUserId={session?.user?.id}
            initialVote={userVoteValue}
          />

          <CommentSection 
            predictionId={prediction.id} 
            comments={formattedComments} 
            currentUserId={session?.user?.id}
          />
        </div>
      </div>
    </main>
  )
}
