"use client"

import { useState } from "react"
import { X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface ReportModalProps {
  isOpen: boolean
  username: string
  postId: string
  onClose: () => void
}

export function ReportModal({ isOpen, username, postId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success("Report submitted successfully.")
    setIsSubmitting(false)
    onClose()
    setReason("")
    setDetails("")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 h-10 bg-muted border-b border-border">
          <h3 className="text-[10pt] font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-destructive" />
            Report {username}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10pt] font-bold uppercase text-muted-foreground">Reason</label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam or unwanted commercial content</SelectItem>
                <SelectItem value="harassment">Harassment or bullying</SelectItem>
                <SelectItem value="hate_speech">Hate speech</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10pt] font-bold uppercase text-muted-foreground">Details</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide more information..."
              className="min-h-[100px] bg-background/50 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                size="sm" 
                variant="destructive"
                disabled={!reason || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
