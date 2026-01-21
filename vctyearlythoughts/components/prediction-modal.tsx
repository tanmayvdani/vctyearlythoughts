"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Team } from "@/lib/teams"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Send, Lock, Plus, Minus, Users, Repeat, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { submitPrediction, getTeamData, updatePredictionFull } from "@/app/actions"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"

interface PredictionModalProps {
  team: Team | null
  isOpen: boolean
  onClose: () => void
  existingPrediction?: {
    id: string
    thought: string
    kickoffPlacement?: string | null
    stage1Placement?: string | null
    stage2Placement?: string | null
    masters1Placement?: string | null
    masters2Placement?: string | null
    championsPlacement?: string | null
    rosterMoves?: string | null
    isPublic: boolean
  } | null
}

export function PredictionModal({ team, isOpen, onClose, existingPrediction }: PredictionModalProps) {
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

  const MAX_CHARS = 2048
  const isOverLimit = thought.length > MAX_CHARS

  const placementOptionsKickoff = ["1st", "2nd", "3rd", "4th", "5th-6th", "7th-8th", "9th-10th", "11th-12th"]
  const placementOptionsStages = ["1st", "2nd", "3rd", "4th", "5th-6th", "7th-8th", "9th-12th"]
  const placementOptions12 = ["1st", "2nd", "3rd-4th", "5th-6th", "7th-8th", "9th-10th", "11th-12th"]
  const placementOptions16 = ["1st", "2nd", "3rd", "4th", "5th-6th", "7th-8th", "9th-12th", "13th-16th"]

  const players = roster.filter((m: any) => {
    const role = m.role.toLowerCase();
    const isPlayer = role.includes("player") || role.includes("stand-in") || role.includes("igl");
    return isPlayer && (showTransactions || m.status !== "Left");
  })
  const coaches = roster.filter((m: any) => {
    const isCoach = m.role.toLowerCase().includes("coach");
    return isCoach && (showTransactions || m.status !== "Left");
  })

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
        } finally {
          setLoading(false)
        }
      }

      fetchData()

      // If editing existing prediction, use that data
      if (existingPrediction) {
        setThought(existingPrediction.thought)
        setKickoffPlacement(existingPrediction.kickoffPlacement || "")
        setStage1Placement(existingPrediction.stage1Placement || "")
        setStage2Placement(existingPrediction.stage2Placement || "")
        setMasters1Placement(existingPrediction.masters1Placement || "")
        setMasters2Placement(existingPrediction.masters2Placement || "")
        setChampionsPlacement(existingPrediction.championsPlacement || "")
        setRosterMoves(existingPrediction.rosterMoves || "")
        setIsPublic(existingPrediction.isPublic)
        setIdentity(user ? "username" : "anonymous")
      } else {
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
    }
  }, [isOpen, user, team, existingPrediction])

  if (!team || !isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (isOverLimit) {
      toast.error(`Thought is too long (max ${MAX_CHARS} characters)`)
      return
    }

    if (!user) {
      // Save draft before prompting (only for new predictions)
      if (!existingPrediction) {
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
        localStorage.setItem(`draft_${team!.id}`, draftData)
        setShowLoginDialog(true)
      }
      return
    }

    await executeSubmission()
  }

  const executeSubmission = async () => {
    setIsSubmitting(true)
    try {
      if (existingPrediction) {
        // Update existing prediction
        await updatePredictionFull(
          existingPrediction.id,
          thought,
          isPublic,
          kickoffPlacement,
          stage1Placement,
          stage2Placement,
          masters1Placement,
          masters2Placement,
          championsPlacement,
          rosterMoves
        )
        toast.success("Prediction updated!")
      } else {
        // Create new prediction
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
      }

      toast.success(existingPrediction ? "Prediction updated!" : "Prediction saved to capsule!")
      onClose()
    } catch (error: any) {
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

  const getKickoffUrl = (region: string) => {
    switch (region.toLowerCase()) {
      case "china": return "https://www.vlr.gg/event/2685/vct-2026-china-kickoff"
      case "pacific": return "https://www.vlr.gg/event/2683/vct-2026-pacific-kickoff"
      case "emea": return "https://www.vlr.gg/event/2684/vct-2026-emea-kickoff"
      case "americas": return "https://www.vlr.gg/event/2682/vct-2026-americas-kickoff"
      default: return "#"
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none animate-in fade-in duration-150">
        <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
          <div className="flex-none">
            <div className="flex items-center justify-between px-4 h-10 bg-muted border-b border-border">
              <h3 className="text-[10pt] font-black text-white uppercase tracking-tight">TEAM PREDICTION</h3>
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
                  <h3 className="text-[10pt] font-bold leading-none">{team.name}</h3>
                  <p className="text-[10pt] text-muted-foreground uppercase font-medium mt-1">
                    {team.region}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsRosterVisible(!isRosterVisible)}
                className="text-[9pt] font-black uppercase bg-secondary hover:bg-secondary/80 px-2.5 py-1 border border-border transition-colors h-6 flex items-center gap-1.5"
              >
                {isRosterVisible ? "Hide Roster" : "Show Roster"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isRosterVisible && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10pt] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    {showTransactions ? <Repeat className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    {showTransactions ? "Roster Changes" : "Current Roster"}
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowTransactions(!showTransactions)}
                    className="text-[9pt] font-black uppercase bg-secondary hover:bg-secondary/80 px-2 border border-border transition-colors h-5 flex items-center"
                  >
                    {showTransactions ? "Hide Changes" : "Show Changes"}
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12 border border-border/50 bg-muted/10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10pt] font-bold uppercase text-muted-foreground animate-pulse">Accessing Records...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pr-1">
                    <div className="space-y-1">
                      <p className="text-[10pt] font-black text-primary uppercase mb-1">Players</p>
                      {players.length > 0 ? players.map((p: any, i: number) => {
                        const joining = showTransactions && (p.status === "In" || transactions.find((t: any) => t.player === p.alias && t.action === "join"));
                        const left = showTransactions && p.status === "Left";
                        return (
                          <div key={i} className={`flex flex-col border p-1.5 ${joining ? "bg-green-500/10 border-green-500/30" : left ? "bg-red-500/10 border-red-500/30 opacity-70" : "bg-muted/30 border-border/50"}`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10pt] font-black leading-none ${joining ? "text-green-500" : left ? "text-red-500" : ""}`}>{p.alias}</span>
                              {joining && <Plus className="w-3 h-3 text-green-500" />}
                              {left && (
                                <div className="bg-red-500 px-1 py-0.5 rounded-sm flex items-center justify-center">
                                  <Minus className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[10pt] truncate ${left ? "text-red-500/70" : "text-muted-foreground"}`}>{p.name || (left ? "Departed" : "-")}</span>
                          </div>
                        );
                      }) : <p className="text-[10pt] text-muted-foreground italic">No players found</p>}
                      
                      {showTransactions && transactions.filter((t: any) => t.action === "leave" && !roster.some((r: any) => r.alias === t.player)).map((t: any, i: number) => (
                        <div key={`left-${i}`} className="flex flex-col border bg-red-500/10 border-red-500/30 p-1.5 opacity-70">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10pt] font-black leading-none text-red-500">{t.player}</span>
                            <Minus className="w-3 h-3 text-red-500" />
                          </div>
                          <span className="text-[10pt] text-red-500/70 truncate">Departed</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10pt] font-black text-primary uppercase mb-1">Staff</p>
                      {coaches.length > 0 ? coaches.map((c: any, i: number) => {
                        const joining = showTransactions && (c.status === "In" || transactions.find((t: any) => t.player === c.alias && t.action === "join"));
                        const left = showTransactions && c.status === "Left";
                        return (
                          <div key={i} className={`flex flex-col border p-1.5 ${joining ? "bg-green-500/10 border-green-500/30" : left ? "bg-red-500/10 border-red-500/30 opacity-70" : "bg-muted/30 border-border/50"}`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10pt] font-bold leading-none ${joining ? "text-green-500" : left ? "text-red-500" : ""}`}>{c.alias}</span>
                              {joining && <Plus className="w-3 h-3 text-green-500" />}
                              {left && (
                                <div className="bg-red-500 px-1 py-0.5 rounded-sm flex items-center justify-center">
                                  <Minus className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <span className={`text-[10pt] truncate ${left ? "text-red-500/70" : "text-muted-foreground"}`}>{c.role}</span>
                          </div>
                        );
                      }) : <p className="text-[10pt] text-muted-foreground italic">No staff found</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form id="prediction-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                 <div className="space-y-1.5">
                    <a 
                      href={getKickoffUrl(team.region)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10pt] font-bold uppercase text-muted-foreground hover:text-primary flex items-center gap-1 w-fit group"
                    >
                      <span className="group-hover:underline underline-offset-2 decoration-primary/50">Kickoff</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                    <Select value={kickoffPlacement} onValueChange={setKickoffPlacement}>
                      <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[10pt] font-bold uppercase">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-none">
                        {placementOptionsKickoff.map(opt => (
                           <SelectItem key={opt} value={opt} className="text-[10pt] font-bold uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10pt] font-bold uppercase text-muted-foreground">Stage 1</label>
                    <Select value={stage1Placement} onValueChange={setStage1Placement}>
                      <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[10pt] font-bold uppercase">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-none">
                        {placementOptionsStages.map(opt => (
                           <SelectItem key={opt} value={opt} className="text-[10pt] font-bold uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10pt] font-bold uppercase text-muted-foreground">Stage 2</label>
                    <Select value={stage2Placement} onValueChange={setStage2Placement}>
                      <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[10pt] font-bold uppercase">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border rounded-none">
                         {placementOptionsStages.map(opt => (
                           <SelectItem key={opt} value={opt} className="text-[10pt] font-bold uppercase">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              {(masters1Qualified || masters2Qualified || championsQualified) && (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                   {masters1Qualified ? (
                     <div className="space-y-1.5">
                        <label className="text-[10pt] font-bold uppercase text-primary flex items-center gap-1"><Image src="/logos/masters.png" alt="Masters" width={14} height={14} /> SANTIAGO:</label>
                        <Select value={masters1Placement} onValueChange={setMasters1Placement}>
                          <SelectTrigger className="h-8 bg-primary/5 border-primary/20 rounded-none text-[10pt] font-bold uppercase">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-none">
                            {placementOptions12.map(opt => (
                               <SelectItem key={opt} value={opt} className="text-[10pt] font-bold uppercase">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   ) : <div />}
                   {masters2Qualified ? (
                     <div className="space-y-1.5">
                        <label className="text-[10pt] font-bold uppercase text-primary flex items-center gap-1"><Image src="/logos/masters.png" alt="Masters" width={14} height={14} /> LONDON:</label>
                        <Select value={masters2Placement} onValueChange={setMasters2Placement}>
                          <SelectTrigger className="h-8 bg-primary/5 border-primary/20 rounded-none text-[10pt] font-bold uppercase">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-none">
                            {placementOptions12.map(opt => (
                               <SelectItem key={opt} value={opt} className="text-[10pt] font-bold uppercase">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   ) : <div />}
                   {championsQualified ? (
                     <div className="space-y-1.5">
                        <label className="text-[10pt] font-bold uppercase text-primary flex items-center gap-1"><Image src="/logos/champions.png" alt="Champions" width={14} height={14} /> SHANGHAI:</label>
                        <Select value={championsPlacement} onValueChange={setChampionsPlacement}>
                          <SelectTrigger className="h-8 bg-primary/5 border-primary/20 rounded-none text-[10pt] font-bold uppercase">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border rounded-none">
                            {placementOptions16.map(opt => (
                               <SelectItem key={opt} value={opt} className="text-[10pt] font-bold uppercase">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                   ) : <div />}
                </div>
              )}

              <div className="space-y-1.5">
                  <label className="text-[10pt] font-bold uppercase text-muted-foreground">Roster Moves?</label>
                   <div className="relative">
                      <input 
                          type="text" 
                          placeholder="e.g. They sign a new duelist..." 
                          className="w-full h-8 px-3 bg-input/50 border border-border rounded-none text-[10pt] focus:border-primary/50 outline-none"
                          value={rosterMoves}
                          onChange={(e) => setRosterMoves(e.target.value)}
                      />
                   </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10pt] font-bold uppercase text-muted-foreground">Season Thoughts</label>
                  <span className={`text-[9pt] font-mono transition-colors ${
                    isOverLimit 
                      ? "text-primary font-bold" 
                      : thought.length > MAX_CHARS * 0.9 
                        ? "text-yellow-500" 
                        : "text-muted-foreground"
                  }`}>
                    {thought.length}/{MAX_CHARS}
                  </span>
                </div>
                <Textarea
                  placeholder={`What will ${team.name} achieve in 2026?\n\nMarkdown supported: **bold**, *italic*, [links](url), etc.`}
                  className={`min-h-[200px] bg-input/50 border-border rounded-none resize-y focus:border-primary/50 text-[10pt] leading-relaxed transition-colors ${
                    isOverLimit ? "border-primary/50 focus:border-primary" : ""
                  }`}
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  required
                  style={{ fontFamily: 'inherit' }}
                />
                {isOverLimit && (
                  <p className="text-[9pt] text-primary font-mono animate-in fade-in slide-in-from-top-1 duration-200">
                    ⚠ Your thought exceeds the {MAX_CHARS} character limit by {thought.length - MAX_CHARS} characters
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10pt] font-bold uppercase text-muted-foreground">Identity</label>
                  <Select value={identity} onValueChange={setIdentity} disabled={!user}>
                    <SelectTrigger className="h-8 bg-input/50 border-border rounded-none text-[10pt] font-bold uppercase">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-none">
                      <SelectItem value="username" disabled={!user} className="text-[10pt] font-bold uppercase">
                        <span className="flex items-center justify-between w-full gap-2">
                          Username {!user && <Lock className="w-3 h-3 opacity-50" />}
                        </span>
                      </SelectItem>
                      <SelectItem value="email" disabled={!user} className="text-[10pt] font-bold uppercase">
                        <span className="flex items-center justify-between w-full gap-2">
                          Email {!user && <Lock className="w-3 h-3 opacity-50" />}
                        </span>
                      </SelectItem>
                      <SelectItem value="anonymous" className="text-[10pt] font-bold uppercase">
                        Anonymous
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {!user && (
                     <p className="text-[10pt] text-muted-foreground font-mono mt-1">
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
                      className="text-[10pt] font-bold uppercase text-muted-foreground cursor-pointer"
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
              disabled={isSubmitting || isOverLimit}
              className="w-full h-10 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent font-bold text-[10pt] uppercase transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {isOverLimit ? "CHARACTER LIMIT EXCEEDED" : "SAVE TO CAPSULE"}
                </>
              )}
            </button>

            <p className="text-[10pt] text-center text-muted-foreground font-medium uppercase tracking-tight mt-2">
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