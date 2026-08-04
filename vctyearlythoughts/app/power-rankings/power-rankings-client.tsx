"use client"

import { PlatChatPowerRankings } from "@/components/plat-chat-power-rankings"
import { Trophy } from "lucide-react"

export function PowerRankingsClient() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">VCT Power Rankings</h1>
            <p className="text-sm text-muted-foreground">
              Rank your <strong>Top 10, 12, 16 or a custom grid</strong> for all regions, a single
              league, or your own custom tournament list. Reorder with drag &amp; drop, export the
              broadcast card as PNG, and publish to the public feed.
            </p>
          </div>
        </div>
      </div>

      <PlatChatPowerRankings />
    </div>
  )
}
