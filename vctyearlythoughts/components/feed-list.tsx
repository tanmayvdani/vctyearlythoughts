"use client"

import { useState } from "react"
import Image from "next/image"
import { Clock, MessageSquare, Shield, Eye, Pencil, Trash2, X, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ReportModal } from "@/components/report-modal"
import { predictions } from "@/lib/schema"
import { updatePrediction, deletePrediction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/confirm-dialog"

type Prediction = typeof predictions.$inferSelect;

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

export function FeedList({ items, currentUserId }: { items: Prediction[], currentUserId?: string }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [reportData, setReportData] = useState<{ postId: string, username: string } | null>(null)
  
  // Edit/Delete State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editThought, setEditThought] = useState("")
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReport = (e: React.MouseEvent, post: Prediction) => {
    e.stopPropagation()
    setReportData({ postId: post.id, username: post.userName })
  }

  const toggleReveal = (id: string) => {
    if (editingId === id) return
    setRevealed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Edit/Delete Actions
  const startEditing = (e: React.MouseEvent, post: Prediction) => {
    e.stopPropagation()
    setEditingId(post.id)
    setEditThought(post.thought)
    setEditIsPublic(post.isPublic ?? true)
    setRevealed(prev => ({ ...prev, [post.id]: true })) // Reveal when editing
  }

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditThought("")
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editingId) return

    setLoading(true)
    try {
      await updatePrediction(editingId, editThought, editIsPublic)
      toast.success("Prediction updated")
      setEditingId(null)
    } catch (error) {
      toast.error("Failed to update prediction")
    } finally {
      setLoading(false)
    }
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
      <div className="p-8 border border-white/10 bg-card/30 text-center text-muted-foreground font-mono text-sm">
        NO PUBLIC PREDICTIONS YET.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((post) => {
        const isOwnPost = currentUserId && post.userId === currentUserId
        const isHidden = isOwnPost && !revealed[post.id]
        const isEditing = editingId === post.id

        return (
          <div
            key={post.id}
            role={isOwnPost && !isEditing ? "button" : undefined}
            tabIndex={isOwnPost && !isEditing ? 0 : undefined}
            onKeyDown={(e) => {
              if (isOwnPost && !isEditing && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                toggleReveal(post.id)
              }
            }}
            onClick={() => isOwnPost && !isEditing && toggleReveal(post.id)}
            className={cn(
              "bg-card/30 border border-white/10 p-5 group hover:border-primary/30 transition-colors relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isOwnPost && !isEditing ? "cursor-pointer" : "cursor-default"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs uppercase tracking-tighter">
                  <Image 
                    src={`/logos/${post.teamId}.png`}
                    alt={post.teamTag} 
                    width={14} 
                    height={14} 
                    className="object-contain" 
                  />
                  {post.teamTag}
                </div>
                <span className="font-mono text-xs font-bold">{post.userName} {isOwnPost && "(YOU)"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {isOwnPost && !isEditing && (
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
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[10px] uppercase ml-2">
                  <Clock className="w-3 h-3" />
                  {timeAgo(post.timestamp)}
                </div>
              </div>
            </div>

            <div className="relative">
              {isEditing ? (
                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    value={editThought}
                    onChange={(e) => setEditThought(e.target.value)}
                    className="min-h-[100px] bg-background/50 border-white/10 focus:border-primary/50"
                    disabled={loading}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`public-${post.id}`} 
                        checked={editIsPublic}
                        onCheckedChange={(c) => setEditIsPublic(!!c)}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`public-${post.id}`}
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Public
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                        disabled={loading}
                      >
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className={cn(
                    "text-sm leading-relaxed mb-4 text-foreground/90 italic transition-all duration-300",
                    isHidden && "blur-sm select-none opacity-50"
                  )}>
                    &quot;{post.thought}&quot;
                  </p>

                  {isHidden && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary bg-background/80 px-3 py-1 border border-primary/20 rounded-full">
                        <Eye className="w-3 h-3" />
                        CLICK TO REVEAL
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!isEditing && !isOwnPost && (
              <div className="flex items-center justify-end gap-4 text-muted-foreground font-mono text-[10px] uppercase">
                <button 
                  onClick={(e) => handleReport(e, post)}
                  className="flex items-center gap-1 hover:text-destructive transition-colors z-10"
                >
                  <Shield className="w-3 h-3" />
                  REPORT
                </button>
              </div>
            )}
          </div>
        )
      })}

      {reportData && (
        <ReportModal
          isOpen={!!reportData}
          username={reportData.username}
          postId={reportData.postId}
          onClose={() => setReportData(null)}
        />
      )}

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
    </div>
  )
}
