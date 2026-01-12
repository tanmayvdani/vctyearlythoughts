"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
}

export function PaginationControls({ currentPage, totalPages }: PaginationControlsProps) {
  const searchParams = useSearchParams()
  
  if (totalPages <= 1) return null

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    return `?${params.toString()}`
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  
  return (
    <div className="flex items-center justify-center gap-2 font-mono text-[10pt]">
      {/* First Page */}
      <Link
        href={buildUrl(1)}
        className={cn(
          "p-2 border border-white/10 hover:border-primary/30 transition-colors",
          currentPage === 1 && "opacity-50 pointer-events-none"
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronsLeft className="w-4 h-4" />
      </Link>

      {/* Previous Page */}
      <Link
        href={buildUrl(Math.max(1, currentPage - 1))}
        className={cn(
          "p-2 border border-white/10 hover:border-primary/30 transition-colors",
          currentPage === 1 && "opacity-50 pointer-events-none"
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {/* Page Dropdown */}
      <Select 
        value={String(currentPage)} 
        onValueChange={(value) => {
          window.location.href = buildUrl(Number(value))
        }}
      >
        <SelectTrigger className="w-[120px] h-9 bg-card/30 border-white/10 rounded-none text-[10pt] font-bold uppercase">
          <SelectValue placeholder={`Page ${currentPage}`} />
        </SelectTrigger>
        <SelectContent className="bg-card border-white/10 rounded-none">
          {pages.map((page) => (
            <SelectItem 
              key={page} 
              value={String(page)} 
              className="text-[10pt] font-bold uppercase"
            >
              Page {page}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Next Page */}
      <Link
        href={buildUrl(Math.min(totalPages, currentPage + 1))}
        className={cn(
          "p-2 border border-white/10 hover:border-primary/30 transition-colors",
          currentPage === totalPages && "opacity-50 pointer-events-none"
        )}
        aria-disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Link>

      {/* Last Page */}
      <Link
        href={buildUrl(totalPages)}
        className={cn(
          "p-2 border border-white/10 hover:border-primary/30 transition-colors",
          currentPage === totalPages && "opacity-50 pointer-events-none"
        )}
        aria-disabled={currentPage === totalPages}
      >
        <ChevronsRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
