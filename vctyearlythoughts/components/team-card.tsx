"use client"

import type { Team } from "@/lib/teams"
import { getUnlockStatus } from "@/lib/vct-utils"
import { cn } from "@/lib/utils"
import { Lock, Bell, BellOff } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { subscribeToTeam, unsubscribeFromTeam } from "@/app/actions"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface TeamCardProps {
  team: Team
  onClick: (team: Team) => void
  initialIsSubscribed: boolean
  isNextToUnlock?: boolean
  isPredicted?: boolean
}

export function TeamCard({ team, onClick, initialIsSubscribed, isNextToUnlock, isPredicted }: TeamCardProps) {
  const { isUnlocked, unlockDate } = getUnlockStatus(team)
  const { user } = useAuth()
  const router = useRouter()
  
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")

  const nameRef = useRef<HTMLSpanElement | null>(null)
  const [isNameWrapped, setIsNameWrapped] = useState(false)

  const formattedUnlockDate = unlockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  useEffect(() => {
    if (!isNextToUnlock || isUnlocked) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const diff = unlockDate.getTime() - now.getTime()

      if (diff <= 0) return "00:00"

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const pad = (n: number) => n.toString().padStart(2, "0")

      if (hours >= 1) {
        return `${hours}h ${minutes}m`
      } else {
        return `${minutes}m ${seconds}s`
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [isNextToUnlock, isUnlocked, unlockDate])

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

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (isSubscribed) {
      setShowUnsubscribeModal(true)
    } else {
      setShowSubscribeModal(true)
    }
  }

  const confirmSubscribe = async () => {
    await subscribeToTeam(team.id)
    setIsSubscribed(true)
    setShowSubscribeModal(false)
  }

  const confirmUnsubscribe = async () => {
    await unsubscribeFromTeam(team.id)
    setIsSubscribed(false)
    setShowUnsubscribeModal(false)
  }

  return (
    <>
      <div
        role="button"
        onClick={() => isUnlocked && onClick(team)}
        title={!isUnlocked ? `Unlocks ${formattedUnlockDate}` : undefined}
        className={cn(
          "zebra-row flex items-center justify-between w-full h-9 px-3 transition-colors text-left border-b border-border/50 last:border-0 group",
          isUnlocked ? "hover:bg-primary/5 cursor-pointer" : "bg-black/10 cursor-default",
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
               isNextToUnlock ? (
                 <span className="font-mono text-[9pt] text-muted-foreground font-medium ml-1">{timeLeft}</span>
               ) : (
                 <Lock className="w-3 h-3 text-muted-foreground/50 ml-1" />
               )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isUnlocked ? (
            <button 
              onClick={handleActionClick}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
              title={isSubscribed ? "Unsubscribe" : "Notify me"}
            >
              <Bell 
                className={cn(
                  "w-3.5 h-3.5",
                  isSubscribed 
                    ? "fill-primary text-primary" 
                    : "text-muted-foreground/40 hover:text-primary/70"
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

      <ConfirmDialog
        isOpen={showLoginModal}
        title="Authentication Required"
        description="You must be signed in to manage notifications."
        confirmText="Sign In"
        cancelText="Cancel"
        onConfirm={() => router.push("/login")}
        onCancel={() => setShowLoginModal(false)}
      />

      <ConfirmDialog
        isOpen={showSubscribeModal}
        title="Confirm Subscription"
        description={`Confirm that you want to be notified with an email to ${user?.email || "your email"} when ${team.name} unlocks.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmSubscribe}
        onCancel={() => setShowSubscribeModal(false)}
      />

      <ConfirmDialog
        isOpen={showUnsubscribeModal}
        title="Unsubscribe?"
        description={`Confirm you want to UNSUBSCRIBE from being notified when ${team.name} unlocks.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmUnsubscribe}
        onCancel={() => setShowUnsubscribeModal(false)}
      />
    </>
  )
}

