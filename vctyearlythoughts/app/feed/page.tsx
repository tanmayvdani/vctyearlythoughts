import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { getDb } from "@/lib/db"
import { predictions, votes } from "@/lib/schema"
import { count, desc, eq, and, inArray, or, sql } from "drizzle-orm"
import { FeedList } from "@/components/feed-list"
import { FeedFilters } from "@/components/feed-filters"
import { PaginationControls } from "@/components/pagination-controls"
import { auth } from "@/auth"
import { TEAMS } from "@/lib/teams"

const PAGE_SIZE = 50

function ensureArray(param: string | string[] | undefined): string[] {
  if (!param) return []
  return Array.isArray(param) ? param : [param]
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  const params = await searchParams
  
  const teamFilters = ensureArray(params.team)
  const regionFilters = ensureArray(params.region)
  const pageParam = params.page as string | undefined
  const page = Math.max(1, Number(pageParam) || 1)

  const conditions = [eq(predictions.isPublic, true)]

  // ... rest of filters logic ...
  // Combine explicitly selected teams + teams from selected regions
  let allowedTeamIds: string[] = []
  
  if (teamFilters.length > 0 && !teamFilters.includes("all")) {
    allowedTeamIds.push(...teamFilters)
  }

  if (regionFilters.length > 0 && !regionFilters.includes("all")) {
    const regionTeams = TEAMS.filter((t) => regionFilters.includes(t.region)).map((t) => t.id)
    allowedTeamIds.push(...regionTeams)
  }

  allowedTeamIds = Array.from(new Set(allowedTeamIds))

  const hasFilters = (teamFilters.length > 0 && !teamFilters.includes("all")) || (regionFilters.length > 0 && !regionFilters.includes("all"))

  if (hasFilters) {
     if (allowedTeamIds.length > 0) {
        conditions.push(inArray(predictions.teamId, allowedTeamIds))
     } else {
        conditions.push(eq(predictions.id, "impossible_id"))
     }
  }

  const filters = and(...conditions)
  const offset = (page - 1) * PAGE_SIZE

  const db = getDb()
  
  // Fetch user votes if logged in
  const userVotes: Record<string, number> = {}
  if (session?.user?.id) {
    const votesData = await db.select()
      .from(votes)
      .where(and(eq(votes.userId, session.user.id), sql`predictionId IS NOT NULL`))
    
    votesData.forEach(v => {
      if (v.predictionId) userVotes[v.predictionId] = v.value
    })
  }

  const results = await Promise.allSettled([
    db
      .select()
      .from(predictions)
      .where(filters)
      .orderBy(desc(predictions.timestamp))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(predictions)
      .where(filters),
  ])

  const dbPredictions = results[0].status === 'fulfilled' ? (results[0].value as any[]) : []
  const totalCountResult = results[1].status === 'fulfilled' ? (results[1].value as any[]) : []

  if (results.some(r => r.status === 'rejected')) {
    console.error("Failed to fetch feed data:", results.filter(r => r.status === 'rejected'))
  }

  const totalCount = totalCountResult[0]?.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const feedItems = dbPredictions.map(p => ({
    ...p
  }))

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-[800px] mx-auto space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">Community Predictions</h1>
            <p className="text-muted-foreground font-mono text-[10pt]">
              Explore shared thoughts from fans across the globe.
            </p>
          </header>

          <FeedFilters />

          <FeedList items={feedItems} currentUserId={session?.user?.id} userVotes={userVotes} />

          <PaginationControls 
            currentPage={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </main>
  )
}

