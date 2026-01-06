"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Team } from "@/lib/teams"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Send, Lock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { submitPrediction } from "@/app/actions"
import Image from "next/image"

interface PredictionModalProps {
  team: Team | null
  isOpen: boolean
  onClose: () => void
}

export function PredictionModal({ team, isOpen, onClose }: PredictionModalProps) {
  const [thought, setThought] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [identity, setIdentity] = useState("username")
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setThought("")
      setIsPublic(true)
      // Default to anonymous if not logged in, otherwise username
      setIdentity(user ? "username" : "anonymous")
    }
  }, [isOpen, user])

  if (!team || !isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData()
    formData.append("teamId", team.id)
    formData.append("teamName", team.name)
    formData.append("teamTag", team.tag)
    formData.append("thought", thought)
    formData.append("isPublic", String(isPublic))
    formData.append("identity", identity)

    await submitPrediction(formData)
    
    // In a real app, we might show a toast here
    console.log("Prediction saved")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 h-10 bg-muted border-b border-border">
          <h3 className="text-xs font-black text-white uppercase tracking-tight">TEAM PREDICTION</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-8 h-8 bg-secondary flex items-center justify-center border border-border p-1">
              <Image 
                src={`/logos/${team.id}.png`}
                alt={team.tag} 
                width={24} 
                height={24} 
                className="object-contain" 
              />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none">{team.name}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">
                {team.region} • TEAM #{team.index}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Season Predictions</label>
              <Textarea
                placeholder={`What will ${team.name} achieve in 2026?`}
                className="min-h-[120px] bg-input/50 border-border rounded-none resize-none focus:border-primary/50 text-xs"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Identity</label>
                <Select value={identity} onValueChange={setIdentity} disabled={!user}>
                  <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[11px] font-bold uppercase">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-none">
                    <SelectItem value="username" disabled={!user} className="text-[11px] font-bold uppercase">
                      <span className="flex items-center justify-between w-full gap-2">
                        Username {!user && <Lock className="w-3 h-3 opacity-50" />}
                      </span>
                    </SelectItem>
                    <SelectItem value="email" disabled={!user} className="text-[11px] font-bold uppercase">
                      <span className="flex items-center justify-between w-full gap-2">
                        Email {!user && <Lock className="w-3 h-3 opacity-50" />}
                      </span>
                    </SelectItem>
                    <SelectItem value="anonymous" className="text-[11px] font-bold uppercase">
                      Anonymous
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!user && (
                   <p className="text-[9px] text-muted-foreground font-mono mt-1">
                     * Sign in to reveal identity
                   </p>
                )}
              </div>

              <div className="flex flex-col justify-end pb-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="public"
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(!!checked)}
                    className="w-4 h-4 rounded-none border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="public"
                    className="text-[10px] font-bold uppercase text-muted-foreground cursor-pointer"
                  >
                    Public Feed
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full h-10 bg-primary text-white hover:bg-primary/90 border border-transparent font-bold text-[11px] uppercase transition-colors flex items-center justify-center gap-2">
              <Send className="w-3.5 h-3.5" />
              SAVE TO CAPSULE
            </button>

            <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-tight">
              COPIES EMAILED AT THE END OF THE SEASON.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
