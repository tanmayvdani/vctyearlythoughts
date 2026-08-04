"use client"

import type { Team } from "@/lib/teams"
import Image from "next/image"
import { Lock, Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TeaserCardProps {
  teams: Team[]
  initialSubscribedTeamIds: string[]
  onNotificationClick: (team: Team) => void
}

export function TeaserCard({ teams, initialSubscribedTeamIds, onNotificationClick }: TeaserCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  
  // Rotate teams
  useEffect(() => {
    if (teams.length <= 1 || isHovering) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % teams.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [teams.length, isHovering])

  const currentTeam = teams[currentIndex]
  const isSubscribed = initialSubscribedTeamIds.includes(currentTeam.id)

  return (
    <div 
      className="bg-muted/30 border border-dashed border-border p-6 flex flex-col items-center gap-4 relative overflow-hidden h-full min-h-[180px] justify-center opacity-70 hover:opacity-100 transition-opacity group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onNotificationClick(currentTeam)
          }}
          className={cn(
            "absolute top-2 right-2 text-[10pt] font-black px-1.5 py-0.5 uppercase tracking-wide z-20 shadow-sm flex items-center gap-1 transition-colors border",
            isSubscribed 
              ? "bg-primary text-white border-primary" 
              : "bg-muted text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          )}
        >
          <Bell className={cn("w-3 h-3", isSubscribed && "fill-current")} />
          {isSubscribed ? "Notified" : "Notify"}
        </button>

        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center border border-border z-10 relative overflow-hidden">
            <div className="relative w-10 h-10 transition-all duration-300">
              <Image 
                key={currentTeam.id}
                src={`/logos/${currentTeam.id}.png`}
                alt="Coming Soon"
                fill
                className="object-contain grayscale brightness-0 opacity-20 group-hover:opacity-40 animate-in fade-in zoom-in-50 duration-300"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <Lock className="w-5 h-5 text-muted-foreground/40" />
            </div>
        </div>

        <div className="text-center space-y-1 z-10">
            <h3 className="font-black text-lg uppercase tracking-tight text-muted-foreground">Unlocking Tomorrow</h3>
            <p className="text-[10pt] text-muted-foreground/60 font-mono uppercase transition-all duration-300" key={currentTeam.region}>
              {currentTeam.region}
            </p>
        </div>
    </div>
  )
}
