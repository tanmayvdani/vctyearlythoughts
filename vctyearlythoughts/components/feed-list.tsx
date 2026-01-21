"use client"

import { useState } from "react"
import { toast } from "sonner"
import { predictions } from "@/lib/schema"
import { deletePrediction } from "@/app/actions"
import { PredictionModal } from "@/components/prediction-modal"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TEAMS } from "@/lib/teams"
import { isRegionLocked } from "@/lib/vct-utils"
import { PredictionCard } from "@/components/prediction-card"

type Prediction = typeof predictions.$inferSelect;

interface FeedListProps {
  items: Prediction[]
  currentUserId?: string
  userVotes?: Record<string, number>
}

export function FeedList({ items, currentUserId, userVotes = {} }: FeedListProps) {
  // Edit/Delete State
  const [editingPost, setEditingPost] = useState<Prediction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
        NO PUBLIC PREDICTIONS YET.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((post) => {
        const isOwnPost = !!(currentUserId && post.userId === currentUserId)
        const team = TEAMS.find(t => t.id === post.teamId)
        const isLocked = team ? isRegionLocked(team.region) : true

        return (
          <PredictionCard
            key={post.id}
            prediction={post}
            currentUserId={currentUserId}
            initialVote={userVotes[post.id] || 0}
            isOwnPost={isOwnPost}
            isLocked={isLocked}
            onEdit={() => setEditingPost(post)}
            onDelete={() => setDeleteId(post.id)}
          />
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

      {editingPost && (
        <PredictionModal
          team={TEAMS.find(t => t.id === editingPost.teamId) || null}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          existingPrediction={{
            id: editingPost.id,
            thought: editingPost.thought,
            kickoffPlacement: editingPost.kickoffPlacement,
            stage1Placement: editingPost.stage1Placement,
            stage2Placement: editingPost.stage2Placement,
            masters1Placement: editingPost.masters1Placement,
            masters2Placement: editingPost.masters2Placement,
            championsPlacement: editingPost.championsPlacement,
            rosterMoves: editingPost.rosterMoves,
            isPublic: editingPost.isPublic ?? true,
          }}
        />
      )}
    </div>
  )
}