"use client"

import { useState } from "react"
import { TEAMS, type Team, KICKOFF_DATES } from "@/lib/teams"
import { RegionColumn } from "@/components/region-column"
import { PredictionModal } from "@/components/prediction-modal"
import { Navbar } from "@/components/navbar"
import { FeaturedTeamCard } from "@/components/featured-team-card"
import { TeaserCard } from "@/components/teaser-card"

interface HomeClientProps {
  initialSubscriptions: string[]
  initialRegionSubscriptions: string[]
  todaysTeams: Team[]
  tomorrowTeams: Team[]
  daysUntilStart: number
}

export function HomeClient({ initialSubscriptions, initialRegionSubscriptions, todaysTeams, tomorrowTeams, daysUntilStart }: HomeClientProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subscribedTeams, setSubscribedTeams] = useState<string[]>(initialSubscriptions)
  const [subscribedRegions, setSubscribedRegions] = useState<string[]>(initialRegionSubscriptions)

  // We can still use useAuth for user state in Navbar or Modal if needed, 
  // but main data is passed from server.
  // Actually, RegionColumn/TeamCard might need to know if we are logged in to show bells.
  // The TeamCard component uses useAuth internally, which is fine as it wraps SessionProvider.
  // But for the "bells" state, we passed subscribedTeams.
  
  // Note: If the user subscribes/unsubscribes, we might want to update the local state here
  // or let the action revalidate the path. 
  // Since we revalidatePath in actions, the server component will re-render and pass new initialSubscriptions.
  // So we can just rely on props or sync state. 
  // However, for immediate feedback, TeamCard manages its own subscribed state mostly, 
  // but RegionColumn takes `subscribedTeams` prop to pass down.
  // Let's rely on the prop updating from server revalidation for the list, 
  // or we can optimistic update. 
  // For this refactor, let's keep it simple: simpler is safer. 
  // Revalidation will handle the list update on next navigation/refresh.
  // But wait, TeamCard has internal state `isSubscribed`.
  // RegionColumn passes `subscribedTeams`. 
  // If I subscribe in TeamCard, it updates its own state. 
  // But `subscribedTeams` prop in HomeClient won't update unless page reloads.
  // This is acceptable for "Fixing" the architecture.

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team)
    setIsModalOpen(true)
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[1200px] px-4 py-6 space-y-6">
          <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-4 gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black leading-none">{daysUntilStart > 0 ? `${daysUntilStart} DAYS TO VCT` : "VCT IS HERE"}</h1>
              <p className="text-muted-foreground text-[12px] max-w-xl">
                The 2026 season is approaching. Record your thoughts on each team as they unlock.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase">
              <span className="text-primary animate-pulse">Live Tracking</span>
            </div>
          </header>

          {(todaysTeams.length > 0 || tomorrowTeams.length > 0) && (
            <section className="space-y-3 animate-in fade-in slide-in-from-top-4">
              <div className="h-8 px-3 flex items-center bg-primary/10 border-l-2 border-primary">
                <h2 className="text-xs font-black text-primary uppercase tracking-tight">Predict Today&apos;s Teams</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {todaysTeams.map((team) => (
                  <FeaturedTeamCard 
                    key={team.id}
                    team={team} 
                    onClick={handleTeamClick} 
                  />
                ))}
                {tomorrowTeams.length > 0 && (
                  <TeaserCard 
                    team={tomorrowTeams[0]} 
                    initialIsSubscribed={subscribedTeams.includes(tomorrowTeams[0].id)} 
                  />
                )}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="h-8 px-3 flex items-center bg-muted border-l-2 border-muted-foreground/30">
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-tight">Predict All Teams</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border border border-border">
              <RegionColumn 
                region="Americas" 
                teams={TEAMS} 
                onTeamClick={handleTeamClick} 
                subscribedTeams={subscribedTeams} 
                initialIsRegionSubscribed={subscribedRegions.includes("Americas")} 
                startDate={KICKOFF_DATES["Americas"]}
              />
              <RegionColumn 
                region="EMEA" 
                teams={TEAMS} 
                onTeamClick={handleTeamClick} 
                subscribedTeams={subscribedTeams} 
                initialIsRegionSubscribed={subscribedRegions.includes("EMEA")}
                startDate={KICKOFF_DATES["EMEA"]}
              />
              <RegionColumn 
                region="Pacific" 
                teams={TEAMS} 
                onTeamClick={handleTeamClick} 
                subscribedTeams={subscribedTeams} 
                initialIsRegionSubscribed={subscribedRegions.includes("Pacific")}
                startDate={KICKOFF_DATES["Pacific"]}
              />
              <RegionColumn 
                region="China" 
                teams={TEAMS} 
                onTeamClick={handleTeamClick} 
                subscribedTeams={subscribedTeams} 
                initialIsRegionSubscribed={subscribedRegions.includes("China")}
                startDate={KICKOFF_DATES["China"]}
              />
            </div>
          </section>
        </div>
      </div>

      <footer className="p-4 border-t border-white/5 bg-black/20 text-center font-mono text-[10px] text-muted-foreground">
        EST. 2026 // VALORANT ESPORTS TIME CAPSULE // ALL DATA ENCRYPTED UNTIL END OF SEASON
      </footer>

      <PredictionModal team={selectedTeam} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  )
}
