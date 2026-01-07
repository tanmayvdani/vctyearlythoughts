"use client"

import { X, AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  alternativeText?: string
  onConfirm: () => void
  onCancel: () => void
  onAlternative?: () => void
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  alternativeText,
  onConfirm,
  onCancel,
  onAlternative,
  variant = "default",
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 h-10 bg-muted border-b border-border">
          <h3 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-primary" />
            {title}
          </h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col gap-3">
             <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-10 bg-muted text-white hover:bg-muted/80 border border-border font-bold text-[11px] uppercase transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 h-10 ${
                  variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                } text-white font-bold text-[11px] uppercase transition-colors`}
              >
                {confirmText}
              </button>
            </div>
            {onAlternative && alternativeText && (
               <button
                  onClick={onAlternative}
                  className="w-full h-10 bg-transparent text-muted-foreground hover:text-white border border-dashed border-border hover:border-white/50 font-bold text-[10px] uppercase transition-colors"
               >
                  {alternativeText}
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
