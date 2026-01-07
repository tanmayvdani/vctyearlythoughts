"use client"

import type { Team } from "@/lib/teams"
import Image from "next/image"
import { Lock, Bell } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { subscribeToTeam, unsubscribeFromTeam } from "@/app/actions"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { cn } from "@/lib/utils"

interface TeaserCardProps {
  team: Team
  initialIsSubscribed: boolean
}

export function TeaserCard({ team, initialIsSubscribed }: TeaserCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false)

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
      <div className="bg-muted/30 border border-dashed border-border p-6 flex flex-col items-center gap-4 relative overflow-hidden h-full min-h-[180px] justify-center opacity-70 hover:opacity-100 transition-opacity group">
          <button 
            onClick={handleActionClick}
            className={cn(
              "absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide z-20 shadow-sm flex items-center gap-1 transition-colors border",
              isSubscribed 
                ? "bg-primary text-white border-primary" 
                : "bg-muted text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            )}
          >
            <Bell className={cn("w-3 h-3", isSubscribed && "fill-current")} />
            {isSubscribed ? "Notified" : "Notify"}
          </button>

          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center border border-border z-10 relative overflow-hidden">
              <Image 
                src={`/logos/${team.id}.png`}
                alt="Coming Soon"
                width={40}
                height={40}
                className="object-contain grayscale brightness-0 opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Lock className="w-5 h-5 text-muted-foreground/40" />
              </div>
          </div>

          <div className="text-center space-y-1 z-10">
              <h3 className="font-black text-lg uppercase tracking-tight text-muted-foreground">Unlocking Tomorrow</h3>
              <p className="text-xs text-muted-foreground/60 font-mono uppercase">{team.region}</p>
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
        description={`Confirm that you want to be notified with an email to ${user?.email || "your email"} when this team unlocks.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmSubscribe}
        onCancel={() => setShowSubscribeModal(false)}
      />

      <ConfirmDialog
        isOpen={showUnsubscribeModal}
        title="Unsubscribe?"
        description={`Confirm you want to UNSUBSCRIBE from being notified when this team unlocks.`}
        confirmText="Yes"
        cancelText="Cancel"
        onConfirm={confirmUnsubscribe}
        onCancel={() => setShowUnsubscribeModal(false)}
      />
    </>
  )
}
