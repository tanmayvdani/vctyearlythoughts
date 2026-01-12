"use client"

import { useState } from "react"
import Image from "next/image"
import { Clock, Eye, Pencil, Trash2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { deletePrediction } from "@/app/actions"
import { toast } from "sonner"
import { PredictionModal } from "@/components/prediction-modal"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TEAMS } from "@/lib/teams"

interface FeedItem {
  id: string
  teamId: string
  teamTag: string
  teamName: string
  userName: string
  thought: string
  timestamp: string
  isPublic: boolean
  kickoffPlacement?: string | null
  stage1Placement?: string | null
  stage2Placement?: string | null
  masters1Placement?: string | null
  masters2Placement?: string | null
  championsPlacement?: string | null
  rosterMoves?: string | null
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

export function MyFeedList({ items }: { items: FeedItem[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleReveal = (id: string) => {
    if (editingItem?.id === id) return
    setRevealed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const startEditing = (e: React.MouseEvent, item: FeedItem) => {
    e.stopPropagation()
    setEditingItem(item)
    setRevealed(prev => ({ ...prev, [item.id]: true })) // Reveal when editing
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteId(id)
  }

  const executeDelete = async () => {
    if (!deleteId) return

    setLoading(true)
    try {
      await deletePrediction(deleteId)
      toast.success("Prediction deleted")
      setDeleteId(null)
    } catch (error) {
      toast.error("Failed to delete prediction")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-8 border border-white/10 bg-card/30 text-center text-muted-foreground font-mono text-[10pt]">
        NO PREDICTIONS RECORDED YET.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((post) => {
        const isRevealed = revealed[post.id]
        const isEditing = editingItem?.id === post.id

        return (
          <div
            key={post.id}
            onClick={() => toggleReveal(post.id)}
            className={cn(
              "bg-card/30 border border-white/10 p-5 group hover:border-primary/30 transition-colors relative overflow-hidden",
              "cursor-pointer"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10pt] uppercase tracking-tighter">
                  <Image 
                    src={`/logos/${post.teamId}.png`}
                    alt={post.teamTag} 
                    width={14} 
                    height={14} 
                    className="object-contain" 
                  />
                  {post.teamTag}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-2">
                      <span className="font-mono text-[10pt] font-bold text-muted-foreground">
                          {post.isPublic ? "PUBLIC" : "PRIVATE"}
                      </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={(e) => startEditing(e, post)}
                      className="p-1 hover:text-primary text-muted-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, post.id)}
                      className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[10pt] uppercase ml-2">
                  <Clock className="w-3 h-3" />
                  {timeAgo(post.timestamp)}
                </div>
              </div>
            </div>

            <div className="relative">
                <p className={cn(
                    "text-[10pt] leading-relaxed mb-4 text-foreground/90 italic transition-all duration-300",
                    !isRevealed && "blur-sm select-none opacity-50",
                    !expanded[post.id] && "line-clamp-3"
                )}>
                    &quot;{post.thought}&quot;
                </p>
                
                {isRevealed && post.thought.split('\n').length > 3 && !expanded[post.id] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded(prev => ({ ...prev, [post.id]: true }))
                    }}
                    className="text-primary hover:underline text-[10pt] font-mono mb-4 flex items-center gap-1"
                  >
                    READ MORE
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}

                <div className={cn("grid grid-cols-2 gap-x-4 gap-y-2 text-[10pt] font-mono text-muted-foreground border-t border-white/5 pt-3 transition-all duration-300", !isRevealed && "blur-sm select-none opacity-50")}>
                    {(post.kickoffPlacement || post.stage1Placement || post.stage2Placement) && (
                        <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1">
                            {post.kickoffPlacement && <div><span className="text-primary/70 font-bold">KICKOFF:</span> {post.kickoffPlacement}</div>}
                            {post.stage1Placement && <div><span className="text-primary/70 font-bold">STAGE 1:</span> {post.stage1Placement}</div>}
                            {post.stage2Placement && <div><span className="text-primary/70 font-bold">STAGE 2:</span> {post.stage2Placement}</div>}
                        </div>
                    )}
                    {(post.masters1Placement || post.masters2Placement || post.championsPlacement) && (
                        <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 pt-1">
                            {post.masters1Placement && <div className="flex items-center gap-1.5"><span className="text-red-500/80 font-bold inline-flex items-center"><Image src="/logos/masters.png" alt="Masters" width={14} height={14} className="mr-1" /> SANTIAGO:</span>{post.masters1Placement}</div>}
                            {post.masters2Placement && <div className="flex items-center gap-1.5"><span className="text-red-500/80 font-bold inline-flex items-center"><Image src="/logos/masters.png" alt="Masters" width={14} height={14} className="mr-1" /> LONDON:</span>{post.masters2Placement}</div>}
                            {post.championsPlacement && <div className="flex items-center gap-1.5"><span className="text-red-500/80 font-bold inline-flex items-center"><Image src="/logos/champions.png" alt="Champions" width={14} height={14} className="mr-1" /> SHANGHAI:</span>{post.championsPlacement}</div>}
                        </div>
                    )}
                    {post.rosterMoves && (
                        <div className="col-span-2 border-t border-white/5 pt-1">
                            <span className="text-primary/70 font-bold">ROSTER:</span> {post.rosterMoves}
                        </div>
                    )}
                </div>

                {!isRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-[10pt] font-bold text-primary bg-background/80 px-3 py-1 border border-primary/20 rounded-full">
                            <Eye className="w-3 h-3" />
                            CLICK TO REVEAL
                        </div>
                    </div>
                )}
            </div>
          </div>
        )
      })}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Prediction"
        description="Are you sure you want to delete this prediction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

      {editingItem && (
        <PredictionModal
          team={TEAMS.find(t => t.id === editingItem.teamId) || null}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          existingPrediction={{
            id: editingItem.id,
            thought: editingItem.thought,
            kickoffPlacement: editingItem.kickoffPlacement,
            stage1Placement: editingItem.stage1Placement,
            stage2Placement: editingItem.stage2Placement,
            masters1Placement: editingItem.masters1Placement,
            masters2Placement: editingItem.masters2Placement,
            championsPlacement: editingItem.championsPlacement,
            rosterMoves: editingItem.rosterMoves,
            isPublic: editingItem.isPublic,
          }}
        />
      )}
    </div>
  )
}
