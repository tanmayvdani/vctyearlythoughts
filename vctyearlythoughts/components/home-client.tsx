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

import { SpecialEventCTA } from "@/components/special-event-cta"
import { isGlobalUnlockActive } from "@/lib/vct-utils"
import { useSearchParams } from "next/navigation"
import { ArrowDown } from "lucide-react"

interface HomeClientProps {
  initialSubscriptions: string[]
  initialRegionSubscriptions: string[]
  initialPredictions: any[]
  todaysTeams: Team[]
  tomorrowTeams: Team[]
  daysUntilStart: number
  isLoggedIn?: boolean
}

export function HomeClient({ 
  initialSubscriptions, 
  initialRegionSubscriptions, 
  initialPredictions,
  todaysTeams, 
  tomorrowTeams, 
  daysUntilStart,
  isLoggedIn = false
}: HomeClientProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subscribedTeams, setSubscribedTeams] = useState<string[]>(initialSubscriptions)
  const [subscribedRegions, setSubscribedRegions] = useState<string[]>(initialRegionSubscriptions)
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  
  const searchParams = useSearchParams()
  const isFocusMode = searchParams.get("action") === "predict-any" && !isLoggedIn

  const showSpecialEvent = isGlobalUnlockActive() && !isLoggedIn
  const isAfterJan22 = new Date() >= new Date("2026-01-22T00:00:00.000Z")

  const availableTodayCount = todaysTeams.length
  const seasonSummary = daysUntilStart > 0
    ? `Season starts in ${daysUntilStart} day${daysUntilStart === 1 ? "" : "s"}.`
    : "Season is live."
  const availabilitySummary = availableTodayCount > 0
    ? `${availableTodayCount} new team${availableTodayCount === 1 ? "" : "s"} available for prediction today.`
    : (tomorrowTeams.length > 0 ? "Next team unlocks tomorrow." : "No new teams available today.")
  const collapsedInfo = `${seasonSummary} ${availabilitySummary}`


  const handleTeamClick = (team: Team) => {
    const existingPrediction = initialPredictions.find(p => p.teamId === team.id)
    setSelectedTeam(team)
    setSelectedPrediction(existingPrediction || null)
    setIsModalOpen(true)
  }

  const predictedTeamIds = initialPredictions.map(p => p.teamId)

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className={cn("transition-opacity duration-500", isFocusMode ? "opacity-20 pointer-events-none" : "opacity-100")}>
        <Navbar />
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[1380px] px-4 py-6 space-y-6">
          {showSpecialEvent && !isFocusMode && <SpecialEventCTA />}
          
          <header className={cn("flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-4 gap-4 transition-opacity duration-500", isFocusMode ? "opacity-20 pointer-events-none" : "opacity-100")}>
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

          {(!showSpecialEvent && !isFocusMode && !isAfterJan22 && (todaysTeams.length > 0 || tomorrowTeams.length > 0)) && (
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
                    isPredicted={predictedTeamIds.includes(team.id)}
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

          <section className="space-y-3 relative">
             {isFocusMode && (
                <div className="absolute -top-12 left-0 w-full flex items-center justify-center animate-bounce z-10">
                   <div className="flex items-center gap-2 text-primary font-black uppercase text-sm bg-background/80 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-sm shadow-[0_0_20px_rgba(253,83,96,0.3)]">
                      <span>Predict your favorite teams</span>
                      <ArrowDown className="h-4 w-4" />
                   </div>
                </div>
             )}
            <div className={cn("h-8 px-3 flex items-center bg-muted border-l-2 border-muted-foreground/30 transition-opacity duration-500", isFocusMode ? "opacity-100" : "opacity-100")}>
              <h2 className="text-[10pt] font-black text-muted-foreground uppercase tracking-tight">Predict All Teams</h2>
            </div>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border border border-border transition-all duration-500", isFocusMode && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_50px_-10px_rgba(253,83,96,0.2)]")}>
              <RegionColumn
                region="Americas"
                teams={TEAMS}
                onTeamClick={handleTeamClick}
                subscribedTeams={subscribedTeams}
                initialIsRegionSubscribed={subscribedRegions.includes("Americas")}
                startDate={KICKOFF_DATES["Americas"]}
                predictedTeamIds={predictedTeamIds}
              />
              <RegionColumn
                region="EMEA"
                teams={TEAMS}
                onTeamClick={handleTeamClick}
                subscribedTeams={subscribedTeams}
                initialIsRegionSubscribed={subscribedRegions.includes("EMEA")}
                startDate={KICKOFF_DATES["EMEA"]}
                predictedTeamIds={predictedTeamIds}
              />
              <RegionColumn
                region="Pacific"
                teams={TEAMS}
                onTeamClick={handleTeamClick}
                subscribedTeams={subscribedTeams}
                initialIsRegionSubscribed={subscribedRegions.includes("Pacific")}
                startDate={KICKOFF_DATES["Pacific"]}
                predictedTeamIds={predictedTeamIds}
              />
              <RegionColumn
                region="China"
                teams={TEAMS}
                onTeamClick={handleTeamClick}
                subscribedTeams={subscribedTeams}
                initialIsRegionSubscribed={subscribedRegions.includes("China")}
                startDate={KICKOFF_DATES["China"]}
                predictedTeamIds={predictedTeamIds}
              />
            </div>
          </section>
        </div>
      </div>

      <footer className={cn("p-4 border-t border-white/5 bg-black/20 text-center font-mono text-[10pt] text-muted-foreground transition-opacity duration-500", isFocusMode ? "opacity-20" : "opacity-100")}>
        EST. 2026 // VALORANT ESPORTS TIME CAPSULE // ALL DATA ENCRYPTED UNTIL END OF SEASON
      </footer>

      <PredictionModal 
        team={selectedTeam} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        existingPrediction={selectedPrediction}
      />
    </main>
  )
}
