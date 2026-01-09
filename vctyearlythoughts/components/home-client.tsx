"use client"

import { useState } from "react"
import { TEAMS, type Team, KICKOFF_DATES } from "@/lib/teams"
import { RegionColumn } from "@/components/region-column"
import { PredictionModal } from "@/components/prediction-modal"
import { Navbar } from "@/components/navbar"
import { FeaturedTeamCard } from "@/components/featured-team-card"
import { TeaserCard } from "@/components/teaser-card"
import { CalendarDays, ChevronDown, Lock, Trophy, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)

  const availableTodayCount = todaysTeams.length
  const seasonSummary = daysUntilStart > 0
    ? `Season starts in ${daysUntilStart} day${daysUntilStart === 1 ? "" : "s"}.`
    : "Season is live."
  const availabilitySummary = availableTodayCount > 0
    ? `${availableTodayCount} new team${availableTodayCount === 1 ? "" : "s"} available for prediction today.`
    : (tomorrowTeams.length > 0 ? "Next team unlocks tomorrow." : "No new teams available today.")
  const collapsedInfo = `${seasonSummary} ${availabilitySummary}`


  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team)
    setIsModalOpen(true)
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[1380px] px-4 py-6 space-y-6">
          <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black leading-none">
                  {daysUntilStart > 0 ? `${daysUntilStart} DAYS TO VCT` : "VCT IS HERE"}
                </h1>
                <button
                  onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                  className="p-1 hover:bg-white/5 rounded-full transition-colors focus:outline-none"
                  aria-expanded={isInfoExpanded}
                  aria-label="Toggle info"
                >
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      isInfoExpanded && "rotate-180",
                    )}
                  />
                </button>
              </div>

              <div className="max-w-[44rem]">
                {!isInfoExpanded && (
                  <p className="text-[10pt] leading-relaxed text-muted-foreground/80">
                    {collapsedInfo}
                  </p>
                )}

                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out overflow-hidden",
                    isInfoExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="min-h-0 pt-2">
                    <ul className="space-y-2 text-[10pt] leading-relaxed text-muted-foreground/80">
                      <li className="flex gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                        <span>
                          <span className="font-semibold text-foreground/90">12 Days Out:</span> First teams unlock.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Unlock className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                        <span>
                          <span className="font-semibold text-foreground/90">Daily Unlocks:</span> One new team per region, each day until kickoff.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Trophy className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                        <span>
                          <span className="font-semibold text-foreground/90">Predict:</span> Log your thoughts now, then revisit at season’s end.
                          <span className="mt-1 flex items-start gap-2">
                            <Lock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                            <span>The day kickoff starts for each region, the predictions lock.</span>
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10pt] font-bold text-muted-foreground uppercase">
              <span className="text-primary animate-pulse">Live Tracking</span>
            </div>
          </header>

          {(todaysTeams.length > 0 || tomorrowTeams.length > 0) && (
            <section className="space-y-3 animate-in fade-in slide-in-from-top-4">
              <div className="h-8 px-3 flex items-center bg-primary/10 border-l-2 border-primary">
                <h2 className="text-[10pt] font-black text-primary uppercase tracking-tight">Predict Today&apos;s Teams</h2>
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
                    teams={tomorrowTeams}
                    initialSubscribedTeamIds={subscribedTeams}
                  />
                )}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="h-8 px-3 flex items-center bg-muted border-l-2 border-muted-foreground/30">
              <h2 className="text-[10pt] font-black text-muted-foreground uppercase tracking-tight">Predict All Teams</h2>
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

      <footer className="p-4 border-t border-white/5 bg-black/20 text-center font-mono text-[10pt] text-muted-foreground">
        EST. 2026 // VALORANT ESPORTS TIME CAPSULE // ALL DATA ENCRYPTED UNTIL END OF SEASON
      </footer>

      <PredictionModal team={selectedTeam} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  )
}
