"use client"

import { useState } from "react"
import Image from "next/image"
import { MessageSquare, ArrowBigUp, ArrowBigDown, Share2, Reply, Shield, Clock, Eye, Pencil, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { voteOnPrediction } from "@/app/feed/actions"
import { toast } from "sonner"
import { MarkdownContent } from "@/components/markdown-content"

interface PredictionCardProps {
  prediction: any
  currentUserId?: string
  initialVote?: number
  isOwnPost?: boolean
  onEdit?: () => void
  onDelete?: () => void
  isLocked?: boolean
}

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function PredictionCard({
  prediction,
  currentUserId,
  initialVote = 0,
  isOwnPost,
  onEdit,
  onDelete,
  isLocked
}: PredictionCardProps) {
  const [vote, setVote] = useState(initialVote)
  const [score, setScore] = useState(prediction.voteScore)
  const [expanded, setExpanded] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const isHidden = isOwnPost && !revealed

  const handleVote = async (e: React.MouseEvent, value: number) => {
    e.stopPropagation()
    e.preventDefault()
    if (!currentUserId) {
      toast.error("Please sign in to vote")
      return
    }

    const newValue = vote === value ? 0 : value
    const diff = newValue - vote
    
    setVote(newValue)
    setScore(score + diff)

    try {
      await voteOnPrediction(prediction.id, newValue)
    } catch (error) {
      setVote(vote)
      setScore(score)
      toast.error("Failed to save vote")
    }
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    e.preventDefault()
    action()
  }

  return (
    <div
      onClick={() => isOwnPost && setRevealed(!revealed)}
      className={cn(
        "bg-card/30 border border-white/10 p-5 group hover:border-primary/30 transition-colors relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isOwnPost && "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Voting Sidebar */}
        <div className="flex flex-col items-center z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-10 w-10", vote === 1 && "text-primary")}
            onClick={(e) => handleVote(e, 1)}
          >
            <ArrowBigUp className={cn("h-8 w-8", vote === 1 && "fill-current")} />
          </Button>
          <span className="text-xs font-bold font-mono my-0.5">{score}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-10 w-10", vote === -1 && "text-blue-500")}
            onClick={(e) => handleVote(e, -1)}
          >
            <ArrowBigDown className={cn("h-8 w-8", vote === -1 && "fill-current")} />
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10pt] uppercase tracking-tighter">
                <Image 
                  src={`/logos/${prediction.teamId}.png`}
                  alt={prediction.teamTag} 
                  width={14} 
                  height={14} 
                  className="object-contain" 
                />
                {prediction.teamTag}
              </div>
              <span className="font-mono text-[10pt] font-bold truncate">
                {prediction.userName} {isOwnPost && "(YOU)"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isOwnPost && !isLocked && onEdit && onDelete && (
                <>
                  <button
                    onClick={(e) => handleAction(e, onEdit)}
                    className="p-1 hover:text-primary text-muted-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleAction(e, onDelete)}
                    className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[10pt] uppercase ml-2 whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {timeAgo(prediction.timestamp)}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className={cn(
              "text-[10pt] leading-relaxed mb-4 text-foreground/90 transition-all duration-300",
              isHidden && "blur-sm select-none opacity-50",
              !expanded && "line-clamp-3"
            )}>
              <MarkdownContent content={prediction.thought} />
            </div>
            
            {!isHidden && prediction.thought.split('\n').length > 3 && !expanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(true)
                }}
                className="text-primary hover:underline text-[10pt] font-mono mb-4 flex items-center gap-1"
              >
                READ MORE
                <ChevronDown className="w-3 h-3" />
              </button>
            )}

            <div className={cn("grid grid-cols-2 gap-x-4 gap-y-2 text-[10pt] font-mono text-muted-foreground border-t border-white/5 pt-3 transition-all duration-300", isHidden && "blur-sm select-none opacity-50")}>
                {(prediction.kickoffPlacement || prediction.stage1Placement || prediction.stage2Placement) && (
                    <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1">
                        {prediction.kickoffPlacement && <div><span className="text-primary/70 font-bold">KICKOFF:</span> {prediction.kickoffPlacement}</div>}
                        {prediction.stage1Placement && <div><span className="text-primary/70 font-bold">STAGE 1:</span> {prediction.stage1Placement}</div>}
                        {prediction.stage2Placement && <div><span className="text-primary/70 font-bold">STAGE 2:</span> {prediction.stage2Placement}</div>}
                    </div>
                )}
                {(prediction.masters1Placement || prediction.masters2Placement || prediction.championsPlacement) && (
                    <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 pt-1">
                        {prediction.masters1Placement && <div className="flex items-center gap-1.5"><span className="text-red-500/80 font-bold inline-flex items-center"><Image src="/logos/masters.png" alt="Masters" width={14} height={14} className="mr-1" /> SANTIAGO:</span>{prediction.masters1Placement}</div>}
                        {prediction.masters2Placement && <div className="flex items-center gap-1.5"><span className="text-red-500/80 font-bold inline-flex items-center"><Image src="/logos/masters.png" alt="Masters" width={14} height={14} className="mr-1" /> LONDON:</span>{prediction.masters2Placement}</div>}
                        {prediction.championsPlacement && <div className="flex items-center gap-1.5"><span className="text-red-500/80 font-bold inline-flex items-center"><Image src="/logos/champions.png" alt="Champions" width={14} height={14} className="mr-1" /> SHANGHAI:</span>{prediction.championsPlacement}</div>}
                    </div>
                )}
                {prediction.rosterMoves && (
                    <div className="col-span-2 border-t border-white/5 pt-1">
                         <span className="text-primary/70 font-bold">ROSTER:</span> {prediction.rosterMoves}
                    </div>
                )}
            </div>

            {isHidden && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 text-[10pt] font-bold text-primary bg-background/80 px-3 py-1 border border-primary/20 rounded-full">
                  <Eye className="w-3 h-3" />
                  CLICK TO REVEAL
                </div>
              </div>
            )}
          </div>

                    <div className="flex items-center gap-4 pt-4 mt-2 border-t border-white/5 z-10">
                      <Link 
                        href={`/feed/post/${prediction.slug}`} 
                        className="flex items-center gap-1.5 text-[10pt] font-mono text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{prediction.commentCount} COMMENTS</span>
                      </Link>
                      <Link 
                        href={`/feed/post/${prediction.slug}`} 
                        className="flex items-center gap-1.5 text-[10pt] font-mono text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        <span>REPLY</span>
                      </Link>
                      {!isOwnPost && (              <button 
                className="flex items-center gap-1 text-[10pt] font-mono text-muted-foreground hover:text-destructive transition-colors ml-auto"
                onClick={(e) => { e.stopPropagation(); toast.info("Report feature coming soon") }}
              >
                <Shield className="w-3.5 h-3.5" />
                REPORT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}