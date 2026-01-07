"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Team } from "@/lib/teams"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Send, Lock, Plus, Minus, Users, Repeat } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { submitPrediction, getTeamData } from "@/app/actions"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"

interface PredictionModalProps {
  team: Team | null
  isOpen: boolean
  onClose: () => void
}

export function PredictionModal({ team, isOpen, onClose }: PredictionModalProps) {
  const [thought, setThought] = useState("")
  const [kickoffPlacement, setKickoffPlacement] = useState("")
  const [stage1Placement, setStage1Placement] = useState("")
  const [stage2Placement, setStage2Placement] = useState("")
  const [masters1Placement, setMasters1Placement] = useState("")
  const [masters2Placement, setMasters2Placement] = useState("")
  const [championsPlacement, setChampionsPlacement] = useState("")
  const [rosterMoves, setRosterMoves] = useState("")
  
  const [isPublic, setIsPublic] = useState(true)
  const [identity, setIdentity] = useState("username")
  const { user } = useAuth()
  const router = useRouter()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [isRosterVisible, setIsRosterVisible] = useState(true)
  const [roster, setRoster] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const placementOptionsKickoff = ["1st", "2nd", "3rd", "4th", "5th-6th", "7th-8th", "9th-10th", "11th-12th"]
  const placementOptionsStages = ["1st", "2nd", "3rd", "4th", "5th-6th", "7th-8th", "9th-12th"]
  const placementOptions12 = ["1st", "2nd", "3rd-4th", "5th-6th", "7th-8th", "9th-10th", "11th-12th"]
  const placementOptions16 = ["1st", "2nd", "3rd", "4th", "5th-6th", "7th-8th", "9th-12th", "13th-16th"]

  const players = roster.filter((m: any) => m.role.toLowerCase().includes("player") || m.role.toLowerCase().includes("stand-in"))
  const coaches = roster.filter((m: any) => m.role.toLowerCase().includes("coach"))

  const masters1Qualified = ["1st", "2nd", "3rd"].includes(kickoffPlacement)
  const masters2Qualified = ["1st", "2nd", "3rd"].includes(stage1Placement)
  const championsQualified = ["1st", "2nd", "3rd", "4th"].includes(stage2Placement)

  // Clear international placements if no longer qualified
  useEffect(() => {
    if (!masters1Qualified) setMasters1Placement("")
  }, [masters1Qualified])

  useEffect(() => {
    if (!masters2Qualified) setMasters2Placement("")
  }, [masters2Qualified])

  useEffect(() => {
    if (!championsQualified) setChampionsPlacement("")
  }, [championsQualified])

  useEffect(() => {
    if (isOpen && team) {
      // Fetch roster and transactions from database
      const fetchData = async () => {
        setLoading(true)
        try {
          const data = await getTeamData(team.id)
          if (data) {
            setRoster(data.roster || [])
            setTransactions(data.transactions || [])
          }
        } catch (error) {
          console.error("Failed to fetch team data:", error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchData()

      // Check for saved draft
      const savedDraft = localStorage.getItem(`draft_${team.id}`)
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          setThought(parsed.thought || "")
          setKickoffPlacement(parsed.kickoffPlacement || "")
          setStage1Placement(parsed.stage1Placement || "")
          setStage2Placement(parsed.stage2Placement || "")
          setMasters1Placement(parsed.masters1Placement || "")
          setMasters2Placement(parsed.masters2Placement || "")
          setChampionsPlacement(parsed.championsPlacement || "")
          setRosterMoves(parsed.rosterMoves || "")
        } catch (e) {
            // Legacy text-only draft fallback
            setThought(savedDraft)
            setKickoffPlacement("")
            setStage1Placement("")
            setStage2Placement("")
            setMasters1Placement("")
            setMasters2Placement("")
            setChampionsPlacement("")
            setRosterMoves("")
        }
      } else {
        setThought("")
        setKickoffPlacement("")
        setStage1Placement("")
        setStage2Placement("")
        setMasters1Placement("")
        setMasters2Placement("")
        setChampionsPlacement("")
        setRosterMoves("")
      }
      
      setIsPublic(true)
      // Default to anonymous if not logged in, otherwise username
      setIdentity(user ? "username" : "anonymous")
    }
  }, [isOpen, user, team])

  if (!team || !isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      // Save draft before prompting
      const draftData = JSON.stringify({ 
        thought, 
        kickoffPlacement, 
        stage1Placement, 
        stage2Placement, 
        masters1Placement,
        masters2Placement,
        championsPlacement,
        rosterMoves 
      })
      localStorage.setItem(`draft_${team.id}`, draftData)
      setShowLoginDialog(true)
      return
    }

    await executeSubmission()
  }

  const executeSubmission = async () => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("teamId", team!.id)
      formData.append("teamName", team!.name)
      formData.append("teamTag", team!.tag)
      formData.append("thought", thought)
      formData.append("isPublic", String(isPublic))
      formData.append("identity", identity)
      
      // New fields
      formData.append("kickoffPlacement", kickoffPlacement)
      formData.append("stage1Placement", stage1Placement)
      formData.append("stage2Placement", stage2Placement)
      formData.append("masters1Placement", masters1Placement)
      formData.append("masters2Placement", masters2Placement)
      formData.append("championsPlacement", championsPlacement)
      formData.append("rosterMoves", rosterMoves)

      await submitPrediction(formData)
      
      // Clear draft after successful submission
      localStorage.removeItem(`draft_${team!.id}`)
      
      toast.success("Prediction saved to capsule!")
      onClose()
    } catch (error: any) {
      console.error("Submission error:", error)
      toast.error(error.message || "Failed to save prediction")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnonymousSubmit = async () => {
     // Set identity to anonymous for guest submission
     setIdentity("anonymous")
     setShowLoginDialog(false)
     await executeSubmission()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-in fade-in duration-150">
        <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
          <div className="flex-none">
            <div className="flex items-center justify-between px-4 h-10 bg-muted border-b border-border">
              <h3 className="text-xs font-black text-white uppercase tracking-tight">TEAM PREDICTION</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
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
                    {team.region}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsRosterVisible(!isRosterVisible)}
                className="text-[9px] font-black uppercase bg-secondary hover:bg-secondary/80 px-2.5 py-1 border border-border transition-colors h-6 flex items-center gap-1.5"
              >
                {isRosterVisible ? "Hide Roster" : "Show Roster"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isRosterVisible && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    {showTransactions ? <Repeat className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    {showTransactions ? "Roster Changes" : "Current Roster"}
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowTransactions(!showTransactions)}
                    className="text-[9px] font-black uppercase bg-secondary hover:bg-secondary/80 px-2 py-0.5 border border-border transition-colors h-5"
                  >
                    {showTransactions ? "Hide Changes" : "Show Changes"}
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12 border border-border/50 bg-muted/10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground animate-pulse">Accessing Records...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pr-1">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-primary uppercase mb-1 sticky top-0 bg-card py-0.5">Players</p>
                      {players.length > 0 ? players.map((p: any, i: number) => {
                        const joining = showTransactions && transactions.find((t: any) => t.player === p.alias && t.action === "join");
                        return (
                          <div key={i} className={`flex flex-col border p-1.5 ${joining ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 border-border/50"}`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[11px] font-black leading-none ${joining ? "text-green-500" : ""}`}>{p.alias}</span>
                              {joining && <Plus className="w-3 h-3 text-green-500" />}
                            </div>
                            <span className="text-[9px] text-muted-foreground truncate">{p.name || "-"}</span>
                          </div>
                        );
                      }) : <p className="text-[10px] text-muted-foreground italic">No players found</p>}
                      
                      {showTransactions && transactions.filter((t: any) => t.action === "leave" && !roster.some((r: any) => r.alias === t.player)).map((t: any, i: number) => (
                        <div key={`left-${i}`} className="flex flex-col border bg-red-500/10 border-red-500/30 p-1.5 opacity-70">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-black leading-none text-red-500">{t.player}</span>
                            <Minus className="w-3 h-3 text-red-500" />
                          </div>
                          <span className="text-[9px] text-red-500/70 truncate">Departed</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-primary uppercase mb-1 sticky top-0 bg-card py-0.5">Staff</p>
                      {coaches.length > 0 ? coaches.map((c: any, i: number) => {
                        const joining = showTransactions && transactions.find((t: any) => t.player === c.alias && t.action === "join");
                        return (
                          <div key={i} className={`flex flex-col border p-1.5 ${joining ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 border-border/50"}`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[11px] font-bold leading-none ${joining ? "text-green-500" : ""}`}>{c.alias}</span>
                              {joining && <Plus className="w-3 h-3 text-green-500" />}
                            </div>
                            <span className="text-[9px] text-muted-foreground truncate">{c.role}</span>
                          </div>
                        );
                      }) : <p className="text-[10px] text-muted-foreground italic">No staff found</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form id="prediction-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Kickoff</label>
                    <Select value={kickoffPlacement} onValueChange={setKickoffPlacement}>
                      <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[11px] font-bold uppercase">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-none">
                        {placementOptionsKickoff.map(opt => (
                           <SelectItem key={opt} value={opt} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Stage 1</label>
                    <Select value={stage1Placement} onValueChange={setStage1Placement}>
                      <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[11px] font-bold uppercase">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-none">
                        {placementOptionsStages.map(opt => (
                           <SelectItem key={opt} value={opt} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Stage 2</label>
                    <Select value={stage2Placement} onValueChange={setStage2Placement}>
                      <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[11px] font-bold uppercase">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-none">
                         {placementOptionsStages.map(opt => (
                           <SelectItem key={opt} value={opt} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              {(masters1Qualified || masters2Qualified || championsQualified) && (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                   {masters1Qualified ? (
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-primary">Masters Santiago</label>
                        <Select value={masters1Placement} onValueChange={setMasters1Placement}>
                          <SelectTrigger className="h-8 bg-primary/5 border-primary/20 rounded-none text-[11px] font-bold uppercase">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-none">
                            {placementOptions12.map(opt => (
                               <SelectItem key={opt} value={opt} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   ) : <div />}
                   {masters2Qualified ? (
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-primary">Masters London</label>
                        <Select value={masters2Placement} onValueChange={setMasters2Placement}>
                          <SelectTrigger className="h-8 bg-primary/5 border-primary/20 rounded-none text-[11px] font-bold uppercase">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-none">
                            {placementOptions12.map(opt => (
                               <SelectItem key={opt} value={opt} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   ) : <div />}
                   {championsQualified ? (
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-primary">Champions Shanghai</label>
                        <Select value={championsPlacement} onValueChange={setChampionsPlacement}>
                          <SelectTrigger className="h-8 bg-primary/5 border-primary/20 rounded-none text-[11px] font-bold uppercase">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-none">
                            {placementOptions16.map(opt => (
                               <SelectItem key={opt} value={opt} className="text-[11px] font-bold uppercase">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   ) : <div />}
                </div>
              )}

              <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Roster Moves?</label>
                   <div className="relative">
                      <input 
                          type="text" 
                          placeholder="e.g. They sign a new duelist..." 
                          className="w-full h-8 px-3 bg-input/50 border border-border rounded-none text-xs focus:border-primary/50 outline-none"
                          value={rosterMoves}
                          onChange={(e) => setRosterMoves(e.target.value)}
                      />
                   </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Season Thoughts</label>
                <Textarea
                  placeholder={`What will ${team.name} achieve in 2026?`}
                  className="min-h-[100px] bg-input/50 border-border rounded-none resize-none focus:border-primary/50 text-xs"
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
            </form>
          </div>

          <div className="flex-none p-4 border-t border-border bg-card">
            <button 
              type="submit" 
              form="prediction-form"
              disabled={isSubmitting}
              className="w-full h-10 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent font-bold text-[11px] uppercase transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  SAVE TO CAPSULE
                </>
              )}
            </button>

            <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-tight mt-2">
              COPIES EMAILED AT THE END OF THE SEASON.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={showLoginDialog}
        title="Sign In / Guest"
        description="You are not signed in. Sign in to save this prediction to your permanent profile, or continue as a guest (stored on this device)."
        confirmText="Sign In"
        cancelText="Cancel"
        alternativeText="Post Anonymously (Guest)"
        onConfirm={() => router.push("/login")}
        onCancel={() => setShowLoginDialog(false)}
        onAlternative={handleAnonymousSubmit}
      />
    </>
  )
}
