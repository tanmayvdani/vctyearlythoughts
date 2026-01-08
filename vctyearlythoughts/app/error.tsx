'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-4 text-center">
      <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 text-[10pt] font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
