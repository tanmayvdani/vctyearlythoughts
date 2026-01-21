"use client"

import React, { useEffect, useState } from "react"
import { ArrowRight, Globe, Timer, Unlock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const LOGOS = [
  { id: 'sen', x: 15, y: 15, size: 'w-16 h-16', delay: '0s' },
  { id: 'fnc', x: 85, y: 25, size: 'w-20 h-20', delay: '2s' },
  { id: 'prx', x: 10, y: 75, size: 'w-14 h-14', delay: '4s' },
  { id: 'edg', x: 80, y: 70, size: 'w-18 h-18', delay: '1s' },
  { id: 'loud', x: 25, y: 40, size: 'w-12 h-12', delay: '3s' },
  { id: 'kc', x: 70, y: 35, size: 'w-24 h-24', delay: '5s' },
  { id: 'drx', x: 60, y: 80, size: 'w-16 h-16', delay: '2.5s' },
  { id: 'fpx', x: 30, y: 65, size: 'w-14 h-14', delay: '0.5s' },
  // New Logos
  { id: 'g2', x: 45, y: 10, size: 'w-16 h-16', delay: '1.5s' },
  { id: 'navi', x: 5, y: 50, size: 'w-18 h-18', delay: '3.5s' },
  { id: 'gen', x: 90, y: 50, size: 'w-14 h-14', delay: '4.5s' },
  { id: 'blg', x: 55, y: 90, size: 'w-16 h-16', delay: '2s' },
  { id: '100t', x: 40, y: 85, size: 'w-12 h-12', delay: '0.8s' },
]

const SUBHEADINGS = [
  <>All teams from all regions are unlocked for 24 hours. Do you want bragging rights to show you predicted the <img src="/logos/champions.png" className="inline h-[26px] w-[26px] mx-1 align-middle" alt="Champions" /> winner at the start? Predict now. Any team, any region.</>,
  <>Do you want to prove you're better than <img src="/logos/egg.png" className="inline h-[26px] w-[26px] mx-1 align-middle" alt="Sideshow" /> at predicting which team is F tier? Predict <img src="/logos/xlg.png" className="inline h-[26px] w-[26px] mx-1 align-middle" alt="XLG" />'s placement now.</>,
  <>Will <img src="/logos/g2.png" className="inline h-[26px] w-[26px] mx-1 align-middle" alt="G2" /> win an international this time? Should babybay go back to overwatch? Share your thoughts on your favorite team, or your hate-watch.</>,
  <>Will mini save <img src="/logos/zeta.png" className="inline h-[26px] w-[26px] mx-1 align-middle" alt="ZETA" /> or will they have an 11th-12th finish with dep gone? Share now and look back at the end of the year.</>,
  <>Wanna show you're better at predicting the <img src="/logos/masters.png" className="inline h-[26px] w-[26px] mx-1 align-middle" alt="Masters" /> London winner? This is your chance. All predictions lock in 24 hours.</>
]

import { isGlobalUnlockActive } from "@/lib/vct-utils"

const GLOBAL_UNLOCK_END = new Date("2026-01-23T00:00:00.000Z")

export function SpecialEventCTA() {
  const [timeLeft, setTimeLeft] = useState<string>("24:00:00")
  const [glitchIndex, setGlitchIndex] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [subheading, setSubheading] = useState<React.ReactNode>(SUBHEADINGS[0])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.max(0, GLOBAL_UNLOCK_END.getTime() - now.getTime())

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (diff === 0) {
        setTimeLeft("00:00:00")
        return
      }

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Random "glitch" effect trigger
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchIndex(prev => (prev + 1) % 4) // Cycle through 4 states
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Set random subheading on mount
  useEffect(() => {
    setSubheading(SUBHEADINGS[Math.floor(Math.random() * SUBHEADINGS.length)])
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e
    const { left, top, width, height } = currentTarget.getBoundingClientRect()
    const x = (clientX - left) / width - 0.5
    const y = (clientY - top) / height - 0.5
    setMousePosition({ x, y })
  }

  return (
    <div 
      className="relative w-full overflow-hidden rounded-xl border border-primary/20 bg-background shadow-[0_0_40px_-10px_rgba(253,83,96,0.3)] transition-transform duration-500 group/container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
    >
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-50%] left-[-10%] h-[200%] w-[200%] animate-[spin_20s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(253,83,96,0.1)_60deg,transparent_120deg)]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Floating Interactive Logos */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {LOGOS.map((logo, i) => (
          <div
            key={logo.id}
            className={cn(
              "absolute transition-all duration-500 ease-out bg-contain bg-no-repeat pointer-events-auto cursor-crosshair opacity-30 hover:opacity-100 hover:scale-125 hover:z-50 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]",
              logo.size
            )}
            style={{
              top: `${logo.y}%`,
              left: `${logo.x}%`,
              backgroundImage: `url('/logos/${logo.id}.png')`,
              transform: `translate(${mousePosition.x * (i % 2 === 0 ? -60 : 80)}px, ${mousePosition.y * (i % 2 === 0 ? -60 : 80)}px)`,
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-12 text-center md:py-20">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-[0_0_10px_rgba(253,83,96,0.4)] animate-pulse">
          <Zap className="h-3 w-3 fill-primary" />
          <span>System Override Active</span>
        </div>

        {/* Main Title with Glitch Effect */}
        <div className="relative">
          <h1 className="text-5xl font-black italic tracking-tighter text-white md:text-7xl lg:text-8xl">
            <span className={cn("block transform transition-transform duration-75", glitchIndex === 1 ? "translate-x-1 opacity-80" : "")}>
              PRE-SEASON
            </span>
            <span className={cn("block text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary transform transition-transform duration-75", glitchIndex === 2 ? "-translate-x-1" : "")}>
              UNLOCK
            </span>
          </h1>
        </div>

        {/* Description */}
        <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
          {subheading}
        </p>

        {/* Timer & CTA Group */}
        <div className="mt-4 flex flex-col items-center gap-6 md:flex-row md:gap-12">
          
          {/* Timer */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Time Remaining</span>
            <div className="font-mono text-3xl font-bold text-white md:text-4xl tabular-nums tracking-widest">
              {timeLeft}
            </div>
          </div>

          <div className="h-px w-full bg-white/10 md:h-12 md:w-px" />

          {/* Action Button */}
          <Link href="/?action=predict-any">
            <Button 
              size="lg" 
              className="group relative h-14 overflow-hidden rounded-none border-2 border-white bg-transparent px-8 text-lg font-black uppercase text-white transition-all hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Predict Now <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Button Glitch Hover BG */}
              <div className="absolute inset-0 -z-10 translate-y-[100%] bg-white transition-transform duration-300 group-hover:translate-y-0" />
            </Button>
          </Link>
        </div>

        {/* Footer Stats / Flavour */}
        <div className="mt-8 flex w-full max-w-md justify-between border-t border-white/10 pt-6 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3" />
            <span>4 REGIONS</span>
          </div>
          <div className="flex items-center gap-2">
            <Unlock className="h-3 w-3" />
            <span>48 TEAMS</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-3 w-3" />
            <span>LIMITED TIME</span>
          </div>
        </div>

      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2 border-primary" />
      <div className="absolute top-0 right-0 h-4 w-4 border-r-2 border-t-2 border-primary" />
      <div className="absolute bottom-0 left-0 h-4 w-4 border-l-2 border-b-2 border-primary" />
      <div className="absolute bottom-0 right-0 h-4 w-4 border-r-2 border-b-2 border-primary" />
    </div>
  )
}
