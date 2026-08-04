"use client"

import type { Region, Team } from "@/lib/teams"
import { TeamCard } from "./team-card"
import { getRegionUnlockCount, getUnlockStatus, getRegionLockStatus } from "@/lib/vct-utils"
import Image from "next/image"
import { Bell, Lock } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { subscribeToRegion, unsubscribeFromRegion, subscribeToTeam, unsubscribeFromTeam } from "@/app/actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface RegionColumnProps {
  region: Region
  teams: Team[]
  onTeamClick: (team: Team) => void
  subscribedTeams: string[]
  initialIsRegionSubscribed: boolean
  startDate: string
  predictedTeamIds: string[]
}

const REGION_LOGOS: Record<Region, string> = {
  Americas: "/logos/amer.png",
  EMEA: "/logos/emea.png",
  Pacific: "/logos/pac.png",
  China: "/logos/cn.png",
}

function calculateTimeLeft(unlockDate: Date): string {
  const now = new Date()
  const diff = unlockDate.getTime() - now.getTime()

  if (diff <= 0) return "00:00"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours >= 1) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m ${seconds}s`
  }
}

export function RegionColumn({ region, teams, onTeamClick, subscribedTeams: initialSubscribedTeams, initialIsRegionSubscribed, startDate, predictedTeamIds }: RegionColumnProps) {
  const unlockedCount = getRegionUnlockCount(region, teams)
  const { isLocked } = getRegionLockStatus(region)
  const { user } = useAuth()
  const router = useRouter()
  
  const [isRegionSubscribed, setIsRegionSubscribed] = useState(initialIsRegionSubscribed)
  const [subscribedTeams, setSubscribedTeams] = useState<string[]>(initialSubscribedTeams)
  
  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegionSubscribeModal, setShowRegionSubscribeModal] = useState(false)
  const [showRegionUnsubscribeModal, setShowRegionUnsubscribeModal] = useState(false)
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showTeamSubscribeModal, setShowTeamSubscribeModal] = useState(false)
  const [showTeamUnsubscribeModal, setShowTeamUnsubscribeModal] = useState(false)

  const sortedTeams = teams
    .filter((t) => t.region === region)
    .sort((a, b) => a.index - b.index)

  const nextLockedTeam = sortedTeams.find((t) => !getUnlockStatus(t).isUnlocked)

  // Timer state — lazily initialized so the first paint shows the right value
  const [timeLeft, setTimeLeft] = useState<string>(() =>
    nextLockedTeam ? calculateTimeLeft(getUnlockStatus(nextLockedTeam).unlockDate) : ""
  )

  const formattedDate = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Centralized Timer
  useEffect(() => {
    if (!nextLockedTeam) return

    const { unlockDate } = getUnlockStatus(nextLockedTeam)

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(unlockDate)), 1000)
    return () => clearInterval(timer)
  }, [nextLockedTeam])

  const handleRegionNotifyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (isRegionSubscribed) {
      setShowRegionUnsubscribeModal(true)
    } else {
      setShowRegionSubscribeModal(true)
    }
  }

  const handleTeamNotifyClick = (team: Team) => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setSelectedTeam(team)
    if (subscribedTeams.includes(team.id)) {
      setShowTeamUnsubscribeModal(true)
    } else {
      setShowTeamSubscribeModal(true)
    }
  }

  const confirmRegionSubscribe = async () => {
    await subscribeToRegion(region)
    setIsRegionSubscribed(true)
    setShowRegionSubscribeModal(false)
    toast.success(`Subscribed to ${region} updates`)
  }

  const confirmRegionUnsubscribe = async () => {
    await unsubscribeFromRegion(region)
    setIsRegionSubscribed(false)
    setShowRegionUnsubscribeModal(false)
    toast.success(`Unsubscribed from ${region} updates`)
  }

  const confirmTeamSubscribe = async () => {
    if (!selectedTeam) return
    await subscribeToTeam(selectedTeam.id)
    setSubscribedTeams(prev => [...prev, selectedTeam.id])
    setShowTeamSubscribeModal(false)
    toast.success(`Subscribed to ${selectedTeam.name} updates`)
  }

  const confirmTeamUnsubscribe = async () => {
    if (!selectedTeam) return
    await unsubscribeFromTeam(selectedTeam.id)
    setSubscribedTeams(prev => prev.filter(id => id !== selectedTeam.id))
    setShowTeamUnsubscribeModal(false)
    toast.success(`Unsubscribed from ${selectedTeam.name} updates`)
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
                      priority
                  />
              </div>
              <div className="flex flex-col">
                  <h2 className="text-[10pt] font-black text-white uppercase tracking-wider leading-none">{region}</h2>
                  {isLocked ? (
                    <span className="text-[9pt] font-bold text-red-500 uppercase mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  ) : (
                    <span className="text-[10pt] font-bold text-muted-foreground uppercase mt-0.5">Starts {formattedDate}</span>
                  )}
              </div>
          </div>
          <div className="flex items-center gap-3">
              <button 
                  onClick={handleRegionNotifyClick}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  title={isRegionSubscribed ? `Unsubscribe from ${region}` : `Notify me for ${region}`}
              >
                  <Bell 
                      className={cn(
                          "w-4 h-4",
                          isRegionSubscribed 
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
          {sortedTeams.map((team) => (
              <TeamCard 
                key={team.id} 
                team={team} 
                onClick={onTeamClick} 
                onNotificationClick={handleTeamNotifyClick}
                initialIsSubscribed={subscribedTeams.includes(team.id)}
                isNextToUnlock={team.id === nextLockedTeam?.id}
                isPredicted={predictedTeamIds.includes(team.id)}
                timeLeft={team.id === nextLockedTeam?.id ? timeLeft : undefined}
              />
            ))}
        </div>
      </div>

      {/* Shared Modals */}
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
        isOpen={showRegionSubscribeModal}
        title="Confirm Subscription"
        description={`Confirm that you want to be notified with an email to ${user?.email || "your email"} when any team in ${region} unlocks.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmRegionSubscribe}
        onCancel={() => setShowRegionSubscribeModal(false)}
      />

      <ConfirmDialog
        isOpen={showRegionUnsubscribeModal}
        title="Unsubscribe?"
        description={`Confirm you want to UNSUBSCRIBE from being notified about ${region} teams.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmRegionUnsubscribe}
        onCancel={() => setShowRegionUnsubscribeModal(false)}
      />

      {selectedTeam && (
        <>
          <ConfirmDialog
            isOpen={showTeamSubscribeModal}
            title="Confirm Subscription"
            description={`Confirm that you want to be notified with an email to ${user?.email || "your email"} when ${selectedTeam.name} unlocks.`}
            confirmText="Yes"
            cancelText="Cancel"
            onConfirm={confirmTeamSubscribe}
            onCancel={() => setShowTeamSubscribeModal(false)}
          />

          <ConfirmDialog
            isOpen={showTeamUnsubscribeModal}
            title="Unsubscribe?"
            description={`Confirm you want to UNSUBSCRIBE from being notified when ${selectedTeam.name} unlocks.`}
            confirmText="Yes"
            cancelText="Cancel"
            onConfirm={confirmTeamUnsubscribe}
            onCancel={() => setShowTeamUnsubscribeModal(false)}
          />
        </>
      )}
    </>
  )
}
