"use client"

import type { Region, Team } from "@/lib/teams"
import { TeamCard } from "./team-card"
import { getRegionUnlockCount } from "@/lib/vct-utils"
import Image from "next/image"
import { Bell, BellOff } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { subscribeToRegion, unsubscribeFromRegion } from "@/app/actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface RegionColumnProps {
  region: Region
  teams: Team[]
  onTeamClick: (team: Team) => void
  subscribedTeams: string[]
  initialIsRegionSubscribed: boolean
  startDate: string
}

const REGION_LOGOS: Record<Region, string> = {
  Americas: "/logos/amer.png",
  EMEA: "/logos/emea.png",
  Pacific: "/logos/pac.png",
  China: "/logos/cn.png",
}

export function RegionColumn({ region, teams, onTeamClick, subscribedTeams, initialIsRegionSubscribed, startDate }: RegionColumnProps) {
  const unlockedCount = getRegionUnlockCount(region, teams)
  const { user } = useAuth()
  const router = useRouter()
  
  const [isSubscribed, setIsSubscribed] = useState(initialIsRegionSubscribed)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false)

  const formattedDate = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

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
    await subscribeToRegion(region)
    setIsSubscribed(true)
    setShowSubscribeModal(false)
  }

  const confirmUnsubscribe = async () => {
    await unsubscribeFromRegion(region)
    setIsSubscribed(false)
    setShowUnsubscribeModal(false)
  }

  return (
    <>
      <div className="flex flex-col bg-card h-full">
        <div className="h-14 px-4 flex items-center justify-between bg-muted border-b border-border">
          <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                  <Image 
                      src={REGION_LOGOS[region]} 
                      alt={region}
                      fill
                      className="object-contain"
                  />
              </div>
              <div className="flex flex-col">
                  <h2 className="text-[10pt] font-black text-white uppercase tracking-wider leading-none">{region}</h2>
                  <span className="text-[10pt] font-bold text-muted-foreground uppercase mt-0.5">Starts {formattedDate}</span>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                  onClick={handleActionClick}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  title={isSubscribed ? `Unsubscribe from ${region}` : `Notify me for ${region}`}
              >
                  <Bell 
                      className={cn(
                          "w-4 h-4",
                          isSubscribed 
                              ? "fill-primary text-primary" 
                              : "text-muted-foreground/40 hover:text-primary/70"
                      )} 
                  />
              </button>
              <span className="text-[10pt] font-bold text-muted-foreground tabular-nums bg-black/20 px-2 py-1 rounded-sm">
                  {unlockedCount}/12
              </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {teams
            .filter((t) => t.region === region)
            .sort((a, b) => a.index - b.index)
            .map((team) => (
              <TeamCard 
                key={team.id} 
                team={team} 
                onClick={onTeamClick} 
                initialIsSubscribed={subscribedTeams.includes(team.id)}
              />
            ))}
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
        description={`Confirm that you want to be notified with an email to ${user?.email || "your email"} when any team in ${region} unlocks.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmSubscribe}
        onCancel={() => setShowSubscribeModal(false)}
      />

      <ConfirmDialog
        isOpen={showUnsubscribeModal}
        title="Unsubscribe?"
        description={`Confirm you want to UNSUBSCRIBE from being notified about ${region} teams.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmUnsubscribe}
        onCancel={() => setShowUnsubscribeModal(false)}
      />
    </>
  )
}


