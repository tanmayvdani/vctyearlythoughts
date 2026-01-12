import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { getDb } from "@/lib/db"
import { predictions } from "@/lib/schema"
import { count, desc, eq, and, inArray, or } from "drizzle-orm"
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

  // Combine explicitly selected teams + teams from selected regions
  let allowedTeamIds: string[] = []
  
  // 1. Add explicitly selected teams
  if (teamFilters.length > 0 && !teamFilters.includes("all")) {
    allowedTeamIds.push(...teamFilters)
  }

  // 2. Add teams from selected regions
  if (regionFilters.length > 0 && !regionFilters.includes("all")) {
    const regionTeams = TEAMS.filter((t) => regionFilters.includes(t.region)).map((t) => t.id)
    allowedTeamIds.push(...regionTeams)
  }

  // Deduplicate
  allowedTeamIds = Array.from(new Set(allowedTeamIds))

  // Apply Filter if we have any constraints
  // If "all" was selected or no filters provided, allowedTeamIds might be empty but we only filter if filters exist
  const hasFilters = (teamFilters.length > 0 && !teamFilters.includes("all")) || (regionFilters.length > 0 && !regionFilters.includes("all"))

  if (hasFilters) {
     if (allowedTeamIds.length > 0) {
        conditions.push(inArray(predictions.teamId, allowedTeamIds))
     } else {
        // User selected a filter combo yielding no teams (e.g. empty region?) - unlikely given static data
        conditions.push(eq(predictions.id, "impossible_id"))
     }
  }

  const filters = and(...conditions)
  const offset = (page - 1) * PAGE_SIZE

  // Fetch real public predictions from DB with pagination and total count for navigation
  const db = getDb()
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

          <FeedList items={feedItems} currentUserId={session?.user?.id} />

          <PaginationControls 
            currentPage={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </main>
  )
}

