"use client"

import type { Team } from "@/lib/teams"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

interface FeaturedTeamCardProps {
  team: Team
  onClick: (team: Team) => void
  isSubscribed?: boolean 
  isPredicted?: boolean
}

export function FeaturedTeamCard({ team, onClick, isPredicted }: FeaturedTeamCardProps) {
  return (
    <div className="bg-card border border-border p-6 flex flex-col items-center gap-4 group hover:border-primary/50 transition-colors relative overflow-hidden">
      <div className="absolute top-2 right-2 bg-primary text-white text-[10pt] font-black px-1.5 py-0.5 uppercase tracking-wide z-20 shadow-sm">
        New Unlock
      </div>

      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors z-10">
        <Image 
          src={`/logos/${team.id}.png`}
          alt={team.name} 
          width={40} 
          height={40} 
          className="object-contain" 
        />
      </div>

      <div className="text-center space-y-1 z-10">
        <h3 className="font-black text-xl uppercase tracking-tight">{team.name}</h3>
        <p className="text-[10pt] text-muted-foreground font-mono uppercase">{team.region}</p>
      </div>

      <button 
        onClick={() => onClick(team)}
        className={cn(
          "w-full mt-2 h-10 font-bold text-[10pt] uppercase tracking-widest transition-all flex items-center justify-center gap-2 z-10",
          isPredicted 
            ? "bg-primary text-white border border-primary hover:bg-primary/90" 
            : "bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary"
        )}
      >
        {isPredicted ? "Edit Prediction" : "Predict Now"}
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}
