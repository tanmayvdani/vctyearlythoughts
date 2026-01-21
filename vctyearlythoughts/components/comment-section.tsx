"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addComment, voteOnComment } from "@/app/feed/actions"
import { cn } from "@/lib/utils"
import { ArrowBigUp, ArrowBigDown, Reply, MessageCircle } from "lucide-react"
import { toast } from "sonner"

interface Comment {
  id: string
  userId: string
  userName: string
  content: string
  voteScore: number
  createdAt: Date
  parentId: string | null
  replies?: Comment[]
  userVote?: number
}

interface CommentSectionProps {
  predictionId: string
  comments: Comment[]
  currentUserId?: string
}

export function CommentSection({ predictionId, comments, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setIsSubmitting(true)
    try {
      await addComment(predictionId, newComment)
      setNewComment("")
      toast.success("Comment added")
    } catch (error) {
      toast.error("Failed to add comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build comment tree
  const commentMap = new Map()
  comments.forEach(c => commentMap.set(c.id, { ...c, replies: [] }))
  const rootComments: any[] = []
  
  commentMap.forEach(c => {
    if (c.parentId) {
      const parent = commentMap.get(c.parentId)
      if (parent) parent.replies.push(c)
    } else {
      rootComments.push(c)
    }
  })

  return (
    <div className="space-y-6 mt-8">
      <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-tighter">
        <MessageCircle className="h-5 w-5 text-primary" />
        Discussion
      </h3>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea 
            placeholder="Add a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-black/20 border-border focus:border-primary/50 min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-muted/50 p-4 border border-dashed border-border text-center text-sm text-muted-foreground">
          Please sign in to join the conversation.
        </div>
      )}

      <div className="space-y-4">
        {rootComments.length > 0 ? (
          rootComments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              predictionId={predictionId} 
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, predictionId, currentUserId, depth = 0 }: { comment: any, predictionId: string, currentUserId?: string, depth?: number }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [vote, setVote] = useState(comment.userVote || 0)
  const [score, setScore] = useState(comment.voteScore)

  const handleVote = async (value: number) => {
    if (!currentUserId) {
      toast.error("Sign in to vote")
      return
    }
    const newValue = vote === value ? 0 : value
    const diff = newValue - vote
    setVote(newValue)
    setScore(score + diff)
    try {
      await voteOnComment(comment.id, newValue)
    } catch {
      setVote(vote)
      setScore(score)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return
    try {
      await addComment(predictionId, replyContent, comment.id)
      setReplyContent("")
      setIsReplying(false)
      toast.success("Reply posted")
    } catch {
      toast.error("Failed to post reply")
    }
  }

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-4 pl-4 border-l border-border")}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleVote(1)}>
            <ArrowBigUp className={cn("h-6 w-6", vote === 1 && "text-primary fill-current")} />
          </Button>
          <span className="text-[10px] font-bold my-0.5">{score}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleVote(-1)}>
            <ArrowBigDown className={cn("h-6 w-6", vote === -1 && "text-blue-500 fill-current")} />
          </Button>
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">{comment.userName}</span>
            <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm text-foreground/90">{comment.content}</p>
          
          <div className="flex items-center gap-4 pt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-[10px] text-muted-foreground hover:text-primary"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>

          {isReplying && (
            <div className="pt-2 space-y-2">
              <Textarea 
                placeholder="Write a reply..." 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="bg-black/20 text-sm min-h-[80px]"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>Post Reply</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply: any) => (
        <CommentItem 
          key={reply.id} 
          comment={reply} 
          predictionId={predictionId} 
          currentUserId={currentUserId}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
