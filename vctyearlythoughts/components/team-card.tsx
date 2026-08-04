"use client"

import type { Team } from "@/lib/teams"
import { getUnlockStatus, isRegionLocked } from "@/lib/vct-utils"
import { cn } from "@/lib/utils"
import { Lock, Bell } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

interface TeamCardProps {
  team: Team
  onClick: (team: Team) => void
  onNotificationClick: (team: Team) => void
  initialIsSubscribed: boolean
  isNextToUnlock?: boolean
  isPredicted?: boolean
  timeLeft?: string
}

export function TeamCard({ 
  team, 
  onClick, 
  onNotificationClick,
  initialIsSubscribed, 
  isNextToUnlock, 
  isPredicted,
  timeLeft 
}: TeamCardProps) {
  const { isUnlocked } = getUnlockStatus(team)
  const regionLocked = isRegionLocked(team.region)
  
  const nameRef = useRef<HTMLSpanElement | null>(null)
  const [isNameWrapped, setIsNameWrapped] = useState(false)

  const unlockStatus = getUnlockStatus(team)
  const formattedUnlockDate = unlockStatus.unlockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  useEffect(() => {
    const element = nameRef.current
    if (!element) return

    const update = () => {
      const rects = element.getClientRects()
      setIsNameWrapped(rects.length > 1)
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(element)
    return () => ro.disconnect()
  }, [team.name])

  return (
    <div
      role="button"
      onClick={() => {
        if (regionLocked) return
        if (isUnlocked) {
          onClick(team)
        } else {
          onNotificationClick(team)
        }
      }}
      title={
        regionLocked 
          ? `${team.region} region is locked` 
          : !isUnlocked 
            ? `Unlocks ${formattedUnlockDate}` 
            : undefined
      }
      className={cn(
        "zebra-row flex items-center justify-between w-full h-9 px-3 transition-colors text-left border-b border-border/50 last:border-0 group",
        regionLocked 
          ? "bg-black/20 cursor-not-allowed opacity-60"
          : isUnlocked 
            ? "hover:bg-primary/5 cursor-pointer" 
            : "bg-black/10 cursor-pointer hover:bg-primary/5",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[9pt] text-muted-foreground/60 w-4 tabular-nums">
          {team.index.toString().padStart(2, "0")}
        </span>
        <div className={cn("flex items-center gap-2", isNameWrapped && "items-start")}>
          <Image 
            src={`/logos/${team.id}.png`}
            alt={team.name} 
            width={20} 
            height={20} 
            className="object-contain" 
          />
          <div className={cn("flex items-center gap-2", isNameWrapped && "flex-col items-start gap-0")}> 
            <span ref={nameRef} className="font-bold text-[9pt] text-foreground/90 leading-tight">{team.name}</span>
            <span className="text-[9pt] text-muted-foreground font-medium uppercase">{team.tag}</span>
          </div>
          {!isUnlocked && (
             isNextToUnlock && timeLeft ? (
               <span className="font-mono text-[9pt] text-muted-foreground font-medium ml-1">{timeLeft}</span>
             ) : (
               <Lock className="w-3 h-3 text-muted-foreground/50 ml-1" />
             )
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {regionLocked ? (
          <span className="text-[9pt] font-bold uppercase text-red-500/70 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Locked
          </span>
        ) : !isUnlocked ? (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onNotificationClick(team)
            }}
            className="p-1 transition-transform focus:outline-none h-full flex items-center"
            title={initialIsSubscribed ? "Unsubscribe" : "Notify me"}
          >
            <Bell 
              className={cn(
                "w-3.5 h-3.5 transition-all duration-300",
                initialIsSubscribed 
                  ? "fill-primary text-primary" 
                  : "text-muted-foreground/40 group-hover:text-primary group-hover:scale-110"
              )} 
            />
          </button>
        ) : (
          <span className={cn(
            "text-[9pt] font-bold uppercase border px-2 py-0.5 rounded-sm transition-colors",
            isPredicted 
              ? "bg-primary text-white border-primary hover:bg-primary/90" 
              : "text-primary border-primary/20 hover:bg-primary hover:text-white"
          )}>
            {isPredicted ? "Edit" : "Predict"}
          </span>
        )}
      </div>
    </div>
  )
}
