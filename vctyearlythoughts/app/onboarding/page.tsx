"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { updateUsername } from "@/app/actions"
import { useSession } from "next-auth/react"

export default function OnboardingPage() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const handleSubmit = async () => {
    if (!username.trim()) return
    setIsLoading(true)
    await updateUsername(username)
    await update() // Refresh session to get the new name
    router.push("/") // Redirect to dashboard after saving
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-white/10 p-8 space-y-8 animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tighter uppercase">IDENTITY PROTOCOL</h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
              Establish your handle for the time capsule
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                Choose Username
              </label>
              <Input
                type="text"
                placeholder="VALORANT_FAN_2026"
                className="bg-input border-white/10 rounded-none font-mono text-sm h-12 uppercase"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                maxLength={20}
              />
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest h-12"
              onClick={handleSubmit}
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? "INITIALIZING..." : "CONFIRM IDENTITY"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
