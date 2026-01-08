import { Navbar } from "@/components/navbar"
import { getDb } from "@/lib/db"
import { predictions } from "@/lib/schema"
import { desc, eq, and, inArray } from "drizzle-orm"
import { auth } from "@/auth"
import { MyFeedList } from "@/components/my-feed-list"
import { FeedFilters } from "@/components/feed-filters"
import { TEAMS } from "@/lib/teams"

function ensureArray(param: string | string[] | undefined): string[] {
  if (!param) return []
  return Array.isArray(param) ? param : [param]
}

export default async function MyFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-white/10 p-12 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter uppercase">Private Feed</h2>
              <p className="text-[10pt] text-muted-foreground font-mono uppercase tracking-widest leading-relaxed">
                To access your personal time capsule and view your predictions, you must sign in.
              </p>
            </div>
            <div className="pt-4">
              <a 
                href="/login" 
                className="inline-flex h-12 items-center justify-center px-8 bg-primary hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest text-[10pt] text-primary-foreground transition-colors w-full"
              >
                Sign In to Continue
              </a>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const params = await searchParams
  const teamFilters = ensureArray(params.team)
  const regionFilters = ensureArray(params.region)

  const conditions = [eq(predictions.userId, session.user.id)]

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
  const hasFilters = (teamFilters.length > 0 && !teamFilters.includes("all")) || (regionFilters.length > 0 && !regionFilters.includes("all"))

  if (hasFilters) {
     if (allowedTeamIds.length > 0) {
        conditions.push(inArray(predictions.teamId, allowedTeamIds))
     } else {
        conditions.push(eq(predictions.id, "impossible_id")) 
     }
  }

  const db = getDb()
  const myPredictions = await db
    .select()
    .from(predictions)
    .where(and(...conditions))
    .orderBy(desc(predictions.timestamp))

  const feedItems = myPredictions.map(p => ({
    ...p,
    isPublic: p.isPublic || false
  }))

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-[800px] mx-auto space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">My Predictions</h1>
            <p className="text-muted-foreground font-mono text-[10pt]">
              Your personal time capsule. Click a card to reveal your prediction.
            </p>
          </header>

          <FeedFilters />

          <MyFeedList items={feedItems} />
        </div>
      </div>
    </main>
  )
}
