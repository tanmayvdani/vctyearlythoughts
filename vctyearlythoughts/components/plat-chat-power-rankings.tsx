"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { TEAMS, Team, Region } from "@/lib/teams"
import { toPng } from "html-to-image"
import { toast } from "sonner"
import {
  Download,
  Globe,
  ListChecks,
  Maximize,
  Minimize,
  MousePointerClick,
  RotateCcw,
  Search,
  Settings,
  Shuffle,
  Sparkles,
  Trophy,
} from "lucide-react"
import { submitPowerRanking } from "@/app/actions"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Scope = "ALL" | Region | "CUSTOM"

// The board is laid out as rows × columns. Total cells are capped at the number of teams.
const MAX_CELLS = TEAMS.length
const GRID_MAX_ROWS = 6
const GRID_MAX_COLS = 12

const PRESETS: { label: string; rows: number; cols: number }[] = [
  { label: "Top 10", rows: 2, cols: 5 },
  { label: "Top 12", rows: 3, cols: 4 },
  { label: "Top 16", rows: 4, cols: 4 },
]
const SCOPES: { id: Scope; label: string }[] = [
  { id: "ALL", label: "All Regions" },
  { id: "Americas", label: "Americas" },
  { id: "EMEA", label: "EMEA" },
  { id: "Pacific", label: "Pacific" },
  { id: "China", label: "China" },
  { id: "CUSTOM", label: "Custom List" },
]

const SCOPE_LABEL: Record<Scope, string> = {
  ALL: "All Regions",
  Americas: "Americas",
  EMEA: "EMEA",
  Pacific: "Pacific",
  China: "China",
  CUSTOM: "Custom List",
}

// Region accent colors used for cell borders and glows
const REGION_COLORS: Record<Region, string> = {
  Americas: "#ff8a1e", // Orange
  EMEA: "#41ff5f", // Neon green
  Pacific: "#3db6ff", // Sky blue
  China: "#ff4655", // Red
}

// A sensible starting pool for the Custom List scope
const DEFAULT_CUSTOM_LIST = [
  "prx", "g2", "fnc", "nrg", "rrq", "th", "sen", "t1",
  "tl", "blg", "edg", "drx", "gia", "kc", "dfm", "mibr",
]

const TEAM_MAP = new Map(TEAMS.map((t) => [t.id, t]))

function initialRowsCols(
  initialRankings?: { rank: number; teamId: string }[]
): { rows: number; cols: number } {
  if (!initialRankings || initialRankings.length === 0) return { rows: 4, cols: 4 }
  const n = initialRankings.length
  if (n <= 10) return { rows: 2, cols: 5 }
  if (n <= 12) return { rows: 3, cols: 4 }
  return { rows: 4, cols: 4 }
}

/**
 * Place `team` at 1-based `rank`, removing it from any previous slot first.
 * If the target slot is occupied, the whole chain is pushed down one spot.
 * If the board is full, the last team falls off the board (returns to the pool).
 */
function placeAt(slots: (Team | null)[], team: Team, rank: number): (Team | null)[] {
  const size = slots.length
  const next = slots.map((s) => (s?.id === team.id ? null : s))
  const i = rank - 1
  if (!next[i]) {
    next[i] = team
    return next
  }
  let j = i
  while (j < size && next[j]) j++
  for (let k = j - 1; k >= i; k--) next[k + 1] = next[k]
  next[i] = team
  return next
}

/** Settings panel rendered inside the cog popover: a Google-Docs-style rows × cols grid
 *  picker plus a fullscreen scaling slider. */
function SettingsPanel({
  rows,
  cols,
  hoverCell,
  setHoverCell,
  applyGrid,
  presentScale,
  setPresentScale,
}: {
  rows: number
  cols: number
  hoverCell: { r: number; c: number } | null
  setHoverCell: (v: { r: number; c: number } | null) => void
  applyGrid: (r: number, c: number) => void
  presentScale: number
  setPresentScale: (v: number) => void
}) {
  const dr = hoverCell?.r ?? rows
  const dc = hoverCell?.c ?? cols
  const dn = dr * dc
  return (
    <div className="space-y-4">
      {/* Grid size picker (insert-table style) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Grid size
          </p>
          <span className="text-[10px] font-mono text-foreground">
            {dr} × {dc} · {dn} cells
          </span>
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${GRID_MAX_COLS}, minmax(0, 1fr))` }}
          onMouseLeave={() => setHoverCell(null)}
        >
          {Array.from({ length: GRID_MAX_ROWS * GRID_MAX_COLS }).map((_, idx) => {
            const r = Math.floor(idx / GRID_MAX_COLS) + 1
            const c = (idx % GRID_MAX_COLS) + 1
            const enabled = r * c <= MAX_CELLS
            const inHover = !!hoverCell && r <= hoverCell.r && c <= hoverCell.c
            const inSelected = !hoverCell && r <= rows && c <= cols
            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => enabled && setHoverCell({ r, c })}
                onClick={() => enabled && applyGrid(r, c)}
                className={cn(
                  "aspect-square border transition-colors",
                  enabled ? "cursor-pointer" : "opacity-20 cursor-default",
                  inHover
                    ? "bg-primary border-primary"
                    : inSelected
                      ? "bg-primary/30 border-primary/60"
                      : "border-border hover:border-primary/50"
                )}
              />
            )
          })}
        </div>
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Hover and click to set rows × columns. Up to {MAX_CELLS} cells (all teams).
        </p>
      </div>

      <div className="h-px bg-border" />

      {/* Fullscreen scaling slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Fullscreen scale
          </p>
          <span className="text-[10px] font-mono text-foreground">
            {presentScale.toFixed(2)}×
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={presentScale}
          onChange={(e) => setPresentScale(parseFloat(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex items-center justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
          <span>Smaller</span>
          <span>Larger</span>
        </div>
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          Tune so the board and the team pool fill your screen in fullscreen mode.
        </p>
      </div>
    </div>
  )
}

export function PlatChatPowerRankings({
  initialRankings,
  onSaved,
}: {
  initialRankings?: { rank: number; teamId: string }[]
  onSaved?: () => void
}) {
  const [title, setTitle] = useState("VCT 2026 Power Rankings")
  const [scope, setScope] = useState<Scope>("ALL")
  const [grid, setGrid] = useState(() => initialRowsCols(initialRankings))
  const rows = grid.rows
  const cols = grid.cols
  const boardSize = rows * cols
  const [slots, setSlots] = useState<(Team | null)[]>(() => {
    const init = initialRowsCols(initialRankings)
    const size = init.rows * init.cols
    const arr: (Team | null)[] = Array(size).fill(null)
    initialRankings?.forEach((r) => {
      const team = TEAM_MAP.get(r.teamId)
      if (team && r.rank >= 1 && r.rank <= size) arr[r.rank - 1] = team
    })
    return arr
  })
  const [customIds, setCustomIds] = useState<string[]>(DEFAULT_CUSTOM_LIST)
  const [customListName, setCustomListName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [listSearch, setListSearch] = useState("")
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [pickedRank, setPickedRank] = useState<number | null>(null)
  const [dragOverRank, setDragOverRank] = useState<number | null>(null)
  const dragPayload = useRef<{ teamId: string; fromRank: number | null } | null>(null)
  const [thought, setThought] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [isPresenting, setIsPresenting] = useState(false)
  const [presentScale, setPresentScale] = useState(1)
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null)

  // Keep the presentation layout in sync with browser fullscreen (e.g. Esc exits)
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setIsPresenting(false)
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const handleTogglePresent = async () => {
    if (isPresenting) {
      await document.exitFullscreen().catch(() => {})
      setIsPresenting(false)
      return
    }
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Fullscreen API unavailable — still show the presentation layout
    }
    setIsPresenting(true)
  }

  const placedById = useMemo(() => {
    const m = new Map<string, number>()
    slots.forEach((s, i) => {
      if (s) m.set(s.id, i + 1)
    })
    return m
  }, [slots])

  const filledCount = placedById.size

  const scopeTeams = useMemo(() => {
    if (scope === "ALL") return TEAMS
    if (scope === "CUSTOM") return customIds.map((id) => TEAM_MAP.get(id)).filter(Boolean) as Team[]
    return TEAMS.filter((t) => t.region === scope)
  }, [scope, customIds])

  const pool = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    // Mutual exclusivity: teams already on the board leave the pool, so dragging a cell
    // MOVES it to the board instead of creating a copy that stays behind.
    const available = scopeTeams.filter((t) => !placedById.has(t.id))
    if (!q) return available
    return available.filter(
      (t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)
    )
  }, [scopeTeams, placedById, searchQuery])

  // Escape cancels a picked-up cell
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickedRank(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const applyGrid = (r: number, c: number) => {
    if (r === rows && c === cols) return
    const newSize = r * c
    setGrid({ rows: r, cols: c })
    setPickedRank(null)
    setSlots((prev) => {
      if (newSize > prev.length) {
        return [...prev, ...Array(newSize - prev.length).fill(null)]
      }
      const removed = prev.slice(newSize).filter(Boolean)
      if (removed.length) {
        toast.info(`${removed.length} team${removed.length > 1 ? "s" : ""} removed from the bottom`)
      }
      return prev.slice(0, newSize)
    })
  }

  const setScopeAndReset = (s: Scope) => {
    setScope(s)
    setSearchQuery("")
    setPickedRank(null)
  }

  /** Quick place: click a pool cell → first empty slot. (Placed teams are no longer in the pool.) */
  const togglePlaceFromPool = (team: Team) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s === null)
      if (idx === -1) {
        toast.error("Board is full. Remove a team or swap it in first")
        return prev
      }
      const next = [...prev]
      next[idx] = team
      return next
    })
  }

  const handleCellClick = (rank: number) => {
    const team = slots[rank - 1]
    if (pickedRank !== null) {
      if (pickedRank === rank) {
        setPickedRank(null) // tap again to cancel
        return
      }
      // Swap picked cell with this cell (empty or occupied)
      setSlots((prev) => {
        const next = [...prev]
        next[rank - 1] = prev[pickedRank - 1]
        next[pickedRank - 1] = prev[rank - 1]
        return next
      })
      setPickedRank(null)
      return
    }
    if (team) setPickedRank(rank)
  }

  const removeAt = (rank: number) => {
    setSlots((prev) => prev.map((s, i) => (i === rank - 1 ? null : s)))
    if (pickedRank === rank) setPickedRank(null)
  }

  /** If a drag ends without landing on a valid cell, the team was dragged out of bounds — remove it from the board. */
  const removeDraggedIfPlaced = (teamId: string) => {
    const rank = slots.findIndex((s) => s?.id === teamId)
    if (rank !== -1) removeAt(rank + 1)
  }

  const handleDrop = (rank: number) => {
    const payload = dragPayload.current
    dragPayload.current = null
    setDragOverRank(null)
    if (!payload) return
    const team = TEAM_MAP.get(payload.teamId)
    if (!team) return
    setSlots((prev) => placeAt(prev, team, rank))
    setPickedRank(null)
  }

  const handleAutoFill = () => {
    setSlots((prev) => {
      const used = new Set(prev.map((s) => s?.id).filter(Boolean))
      const candidates = scopeTeams.filter((t) => !used.has(t.id))
      if (candidates.length === 0) return prev
      // Randomize which teams fill the empty slots
      const shuffled = [...candidates].sort(() => Math.random() - 0.5)
      const next = [...prev]
      let ci = 0
      for (let i = 0; i < next.length && ci < shuffled.length; i++) {
        if (!next[i]) next[i] = shuffled[ci++]
      }
      return next
    })
    toast.success(
      scope === "CUSTOM"
        ? "Filled empty slots from your custom list"
        : `Filled empty slots with ${SCOPE_LABEL[scope]} teams`
    )
  }

  const handleShuffle = () => {
    setPickedRank(null)
    setSlots((prev) => {
      const teams = prev.filter(Boolean) as Team[]
      if (teams.length === 0) return prev
      const shuffled = [...teams].sort(() => Math.random() - 0.5)
      const next: (Team | null)[] = Array(prev.length).fill(null)
      shuffled.forEach((t, i) => (next[i] = t))
      return next
    })
    toast.info("Shuffled the current placements")
  }

  const handleReset = () => {
    setPickedRank(null)
    setSlots(Array(boardSize).fill(null))
    toast.info("Board cleared")
  }

  const handleExportPNG = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
      })
      const link = document.createElement("a")
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-top-${boardSize}.png`
      link.href = dataUrl
      link.click()
      toast.success("Power ranking card exported as PNG!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export image.")
    } finally {
      setExporting(false)
    }
  }

  const handlePublish = async () => {
    if (filledCount !== boardSize) {
      toast.error(`Fill all ${boardSize} slots before publishing (${filledCount}/${boardSize} done)`)
      return
    }
    const validRankings = slots
      .map((team, i) => ({ team, rank: i + 1 }))
      .filter((x): x is { team: Team; rank: number } => x.team !== null)
      .map(({ team, rank }) => ({
        rank,
        teamId: team.id,
        teamTag: team.tag,
        teamName: team.name,
      }))

    setIsSubmitting(true)
    try {
      await submitPowerRanking({
        title: title.trim() || "VCT Power Rankings",
        powerRanking: JSON.stringify(validRankings),
        thought,
        isPublic,
        identity: "username",
      })
      toast.success("Power Ranking published to Public Feed!")
      if (onSaved) onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish power ranking.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleInCustomList = (teamId: string) => {
    setCustomIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  const scopeChip =
    scope === "ALL"
      ? "ALL REGIONS"
      : scope === "CUSTOM"
        ? customListName.trim() || "CUSTOM"
        : scope.toUpperCase()

  const listDialogTeams = TEAMS.filter((t) => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return true
    return t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)
  })

  return (
    <div
      className={cn(
        "space-y-6",
        isPresenting && "fixed inset-0 z-50 overflow-y-auto text-white"
      )}
      style={
        isPresenting
          ? {
              backgroundImage:
                "radial-gradient(ellipse at top, rgba(253, 83, 96, 0.12) 0%, rgba(0, 0, 0, 0.7) 80%), linear-gradient(to bottom, #1c2024, #23282d, #14171a)",
            }
          : undefined
      }
    >
      {isPresenting && (
        <>
          {/* Subtle dot texture */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />
          {/* Top-right controls: settings cog + exit */}
          <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  title="Grid & fullscreen settings"
                  className="px-2.5 py-1.5 text-[11px] font-bold uppercase bg-black/60 text-white border border-white/20 transition-colors flex items-center gap-1.5 hover:bg-black/80"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-80">
                <SettingsPanel
                  rows={rows}
                  cols={cols}
                  hoverCell={hoverCell}
                  setHoverCell={setHoverCell}
                  applyGrid={applyGrid}
                  presentScale={presentScale}
                  setPresentScale={setPresentScale}
                />
              </PopoverContent>
            </Popover>
            <button
              onClick={handleTogglePresent}
              className="px-3 py-1.5 text-[11px] font-bold uppercase bg-black/60 text-white border border-white/20 transition-colors flex items-center gap-1.5 hover:bg-black/80"
            >
              <Minimize className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </>
      )}

      {/* ================= Toolbar ================= */}
      {!isPresenting && (
      <div className="bg-card border border-border p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Scope */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
              Scope
            </p>
            <div className="flex flex-wrap gap-1 bg-muted p-1 border border-border">
              {SCOPES.map((s) => {
                const active = scope === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setScopeAndReset(s.id)}
                    className={cn(
                      "px-2.5 py-1.5 text-[11px] font-bold uppercase rounded-none transition-colors flex items-center gap-1.5",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    {s.id === "CUSTOM" && <ListChecks className="w-3.5 h-3.5" />}
                    {s.label}
                    {s.id === "CUSTOM" && (
                      <span className={cn("font-mono", active ? "text-white/80" : "text-primary")}>
                        {customIds.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Board size */}
          <div className="flex items-end gap-4 shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                Board Size
              </p>
              <div className="flex gap-1 bg-muted p-1 border border-border">
                {PRESETS.map((p) => {
                  const active = rows === p.rows && cols === p.cols
                  return (
                    <button
                      key={p.label}
                      onClick={() => applyGrid(p.rows, p.cols)}
                      className={cn(
                        "px-3 py-1.5 text-[11px] font-bold uppercase rounded-none transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={handleTogglePresent}
              className="w-[38px] h-[38px] flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
              title="Fullscreen preview"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  title="Grid & fullscreen settings"
                  className="w-[38px] h-[38px] flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <SettingsPanel
                  rows={rows}
                  cols={cols}
                  hoverCell={hoverCell}
                  setHoverCell={setHoverCell}
                  applyGrid={applyGrid}
                  presentScale={presentScale}
                  setPresentScale={setPresentScale}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <button
            onClick={handleAutoFill}
            className="px-3 py-1.5 text-[11px] font-bold uppercase bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-fill
          </button>
          <button
            onClick={handleShuffle}
            className="px-3 py-1.5 text-[11px] font-bold uppercase bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-[11px] font-bold uppercase bg-primary text-primary-foreground border border-primary transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex-1" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase hidden sm:block">
            {scopeChip} • Top {boardSize}
          </span>
        </div>
      </div>
      )}

      {/* ================= Ranking board (editor = export card) ================= */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6 items-start",
          !isPresenting && "lg:grid-cols-5",
          isPresenting && "mx-auto w-full px-4 sm:px-8 py-8"
        )}
        style={isPresenting ? { maxWidth: `${80 * presentScale}rem` } : undefined}
      >
        <div className={cn("space-y-2", !isPresenting && "lg:col-span-3")}>
          {!isPresenting && (
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Your ranking is the image you share
            </p>
          )}

          <div
            ref={cardRef}
            className={cn(
              "w-full relative overflow-hidden text-white",
              isPresenting
                ? "border-0 p-0 shadow-none"
                : "border border-white/10 p-4 sm:p-6 shadow-2xl"
            )}
            style={{
              backgroundImage:
                "radial-gradient(ellipse at top, rgba(253, 83, 96, 0.12) 0%, rgba(0, 0, 0, 0.7) 80%), linear-gradient(to bottom, #1c2024, #23282d, #14171a)",
            }}
          >
            {/* Subtle dot texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />

            {/* Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Power Rankings
                </p>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full sm:max-w-[560px] bg-transparent text-2xl sm:text-3xl font-black uppercase tracking-tight text-white focus:outline-none border-b-2 border-transparent focus:border-primary/60 transition-colors placeholder:text-white/30"
                  placeholder="Ranking title"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2 py-1">
                  Top {boardSize}
                </span>
              </div>
            </div>

            {/* Grid of rank cells */}
            <div
              className={cn(
                "relative z-10 grid",
                isPresenting ? "gap-2 sm:gap-2.5" : "gap-2.5"
              )}
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {slots.map((team, i) => {
                const rank = i + 1
                const isPicked = pickedRank === rank
                const isDropTarget = dragOverRank === rank
                const color = team ? REGION_COLORS[team.region] : null
                return (
                  <div
                    key={rank}
                    draggable={!!team && pickedRank === null}
                    onDragStart={(e) => {
                      if (!team) return
                      dragPayload.current = { teamId: team.id, fromRank: rank }
                      e.dataTransfer.effectAllowed = "move"
                      e.dataTransfer.setData("text/plain", team.id)
                    }}
                    onDragEnd={() => {
                      const payload = dragPayload.current
                      dragPayload.current = null
                      setDragOverRank(null)
                      // No cell received the drop → dragged out of bounds → remove
                      if (payload) removeDraggedIfPlaced(payload.teamId)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      setDragOverRank(rank)
                    }}
                    onDragLeave={() => setDragOverRank((r) => (r === rank ? null : r))}
                    onDrop={() => handleDrop(rank)}
                    onClick={() => handleCellClick(rank)}
                    className={cn(
                      "group relative aspect-[16/10] border-2 cursor-pointer select-none transition-all",
                      isPicked && "ring-2 ring-white scale-[1.03] z-10",
                      isDropTarget && "ring-2 ring-white/70 brightness-125"
                    )}
                    style={{ borderColor: color ?? "rgba(255,255,255,0.15)" }}
                  >
                    {/* Interior (clipped so the badge can straddle the border) */}
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Blurred region glow interior */}
                      {color && (
                        <div
                          className="absolute -inset-8 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 50% 45%, ${color}55 0%, transparent 65%)`,
                            filter: "blur(16px)",
                          }}
                        />
                      )}
                      {/* Frosted glass layer */}
                      <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-sm pointer-events-none" />

                      {/* Team logo (no name) */}
                      {team && (
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                          <Image
                            src={`/logos/${team.id}.png`}
                            alt={team.name}
                            width={90}
                            height={90}
                            className="object-contain max-h-full max-w-full drop-shadow-sm"
                            draggable={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* Rank badge — straddles the bottom border, white number, region border */}
                    <div
                      className={cn(
                        "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 flex items-center justify-center border-2 bg-black/70 px-2 py-0.5 font-black italic text-white leading-none",
                        isPresenting && "px-1.5 py-0 text-[10px]"
                      )}
                      style={{ borderColor: color ?? "rgba(255,255,255,0.2)" }}
                    >
                      {rank}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Ticker footer */}
            <div className="relative z-10 mt-5 border-t border-white/10 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-black/50 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src="/valoranttimecapsule.png"
                  alt="VCT Capsule"
                  width={20}
                  height={20}
                  className="object-contain shrink-0"
                />
                <span className="text-[11px] font-black uppercase tracking-wide text-white/90 truncate">
                  vctyearlythoughts.in
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70 font-black text-[10px] uppercase tracking-widest shrink-0">
                <Trophy className="w-3.5 h-3.5 text-primary" />
                {scopeChip}
              </div>
            </div>
          </div>

          {pickedRank !== null && !isPresenting && (
            <p className="text-[11px] text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              Cell {pickedRank} picked up. Click another cell to swap, or press Esc to cancel
            </p>
          )}
        </div>

        {/* ---- Team pool ---- */}
        <div
          className={cn(
            "self-start",
            !isPresenting && "lg:col-span-2 bg-card border border-border p-4 sm:p-5 space-y-3",
            isPresenting && "w-full"
          )}
        >
          {!isPresenting && (
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Team Pool
              <span className="text-[10px] font-mono text-muted-foreground normal-case tracking-normal">
                ({pool.length})
              </span>
            </h3>

            {scope === "CUSTOM" && (
              <button
                onClick={() => setListDialogOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 border border-primary/30 bg-primary/10 px-2 py-1 transition-colors"
              >
                Edit list
              </button>
            )}
          </div>
          )}

          {!isPresenting && (
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={scope === "CUSTOM" ? "Search tournament teams..." : "Search teams..."}
              className="w-full bg-background border border-border pl-8 pr-3 py-1.5 text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          )}

          {!isPresenting && scope === "CUSTOM" && customIds.length === 0 && !searchQuery ? (
            <div className="border border-dashed border-border/60 p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Your tournament list is empty. Add teams to define which teams can be ranked.
              </p>
              <button
                onClick={() => setListDialogOpen(true)}
                className="text-[11px] font-black uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-3 py-1.5 hover:bg-primary/20 transition-colors"
              >
                Build tournament list
              </button>
            </div>
          ) : pool.length === 0 ? (
            <div className="border border-dashed border-border/60 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                {scope === "CUSTOM"
                  ? "All teams in your list are ranked. Drag a cell off the board to bring it back to the pool."
                  : searchQuery
                    ? "No teams match your search."
                    : "All teams are ranked. Drag a cell off the board to return it to the pool."}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-2",
                isPresenting
                  ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
                  : "grid-cols-2 sm:grid-cols-3"
              )}
            >
              {pool.map((t) => {
                const color = REGION_COLORS[t.region]
                return (
                  <button
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      dragPayload.current = { teamId: t.id, fromRank: null }
                      e.dataTransfer.effectAllowed = "move"
                      e.dataTransfer.setData("text/plain", t.id)
                    }}
                    onDragEnd={() => {
                      const payload = dragPayload.current
                      dragPayload.current = null
                      setDragOverRank(null)
                      // No cell received the drop → dragged out of bounds → remove from board
                      if (payload) removeDraggedIfPlaced(payload.teamId)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                    }}
                    onDrop={() => {
                      // Dropping a ranked cell back here returns it to the pool
                      const payload = dragPayload.current
                      dragPayload.current = null
                      setDragOverRank(null)
                      if (!payload) return
                      const rank = placedById.get(payload.teamId)
                      if (rank) removeAt(rank)
                    }}
                    onClick={() => togglePlaceFromPool(t)}
                    title="Drag onto a rank, or click to place in the first empty slot"
                    className="relative aspect-[16/10] border-2 transition-all opacity-80 hover:opacity-100 hover:brightness-125"
                    style={{ borderColor: color }}
                  >
                    {/* Interior (clipped so the badge can straddle the border) */}
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Blurred region glow interior */}
                      <div
                        className="absolute -inset-8 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 45%, ${color}33 0%, transparent 65%)`,
                          filter: "blur(16px)",
                        }}
                      />
                      <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-sm pointer-events-none" />

                      <div className="absolute inset-0 flex items-center justify-center p-1.5">
                        <Image
                          src={`/logos/${t.id}.png`}
                          alt={t.name}
                          width={48}
                          height={48}
                          className="object-contain max-h-full max-w-full"
                          draggable={false}
                        />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {!isPresenting && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Click a team to place it in the first empty slot, or drag it onto a specific rank.
              Teams on the board leave the pool — drag a ranked cell back here (or off the board)
              to return it. Cell borders follow each team&apos;s region.
            </p>
          )}
        </div>
      </div>

      {/* ================= Share & Publish ================= */}
      {!isPresenting && (
      <div className="bg-card border border-border p-4 sm:p-5 space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Share & Publish
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground">
            {filledCount}/{boardSize} filled
          </span>
          <div className="w-28 h-1.5 bg-muted overflow-hidden rounded-full">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(filledCount / boardSize) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
            Your thoughts / rationale (Markdown supported)
          </label>
          <textarea
            rows={5}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Explain your placements. Why is team X at #1?"
            className="w-full bg-background border border-border p-2.5 text-sm focus:border-primary focus:outline-none resize-none placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <label className="text-[11px] font-bold uppercase text-foreground flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
            />
            Make public
          </label>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-black text-[11px] uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {exporting ? "Generating..." : "Export PNG"}
          </button>
          <button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[11px] uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            {isSubmitting ? "Publishing..." : `Publish Top ${boardSize}`}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Publishing requires all {boardSize} slots to be filled. Your ranking appears in the
          Public Feed with the broadcast card preview.
        </p>
      </div>
      )}

      {/* ================= Custom list dialog ================= */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tournament / Custom Team List</DialogTitle>
            <DialogDescription>
              Pick the teams that can appear in this ranking. Only teams in this list show up in
              the pool. {customIds.length} selected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                List name
              </label>
              <input
                type="text"
                value={customListName}
                onChange={(e) => setCustomListName(e.target.value)}
                placeholder="e.g. Champions 2026 Field"
                className="w-full bg-background border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search all 48 teams..."
                className="w-full bg-background border border-border pl-8 pr-3 py-1.5 text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {listDialogTeams.map((t) => {
              const inList = customIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => toggleInCustomList(t.id)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 border text-left transition-all",
                    inList
                      ? "bg-primary/10 border-primary/50"
                      : "bg-muted/40 border-border hover:border-primary/40"
                  )}
                >
                  <div className="w-7 h-7 shrink-0 bg-white rounded-sm p-0.5 border border-border flex items-center justify-center">
                    <Image
                      src={`/logos/${t.id}.png`}
                      alt={t.tag}
                      width={22}
                      height={22}
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold leading-tight truncate">{t.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase leading-tight">
                      {t.tag} • {t.region}
                    </p>
                  </div>
                  {inList && (
                    <span className="text-[9px] font-black bg-primary text-primary-foreground px-1">
                      IN
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
