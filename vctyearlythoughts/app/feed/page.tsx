import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { db } from "@/lib/db"
import { predictions } from "@/lib/schema"
import { count, desc, eq, and, inArray, or } from "drizzle-orm"
import { FeedList } from "@/components/feed-list"
import { FeedFilters } from "@/components/feed-filters"
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
  const [dbPredictions, totalCountResult] = await Promise.all([
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

  const totalCount = totalCountResult[0]?.count ?? 0
  const hasMore = page * PAGE_SIZE < totalCount
  const nextPageSearch = new URLSearchParams()
  
  teamFilters.forEach(t => nextPageSearch.append("team", t))
  regionFilters.forEach(r => nextPageSearch.append("region", r))
  
  nextPageSearch.set("page", String(page + 1))

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
            <p className="text-muted-foreground font-mono text-sm">
              Explore shared thoughts from fans across the globe.
            </p>
          </header>

          <FeedFilters />

          <FeedList items={feedItems} currentUserId={session?.user?.id} />

          {hasMore && (
            <div className="flex justify-end">
              <Link
                href={`?${nextPageSearch.toString()}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Next Page →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

