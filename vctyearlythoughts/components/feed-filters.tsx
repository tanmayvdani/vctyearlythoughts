"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { TEAMS } from "@/lib/teams"
import { Button } from "@/components/ui/button"
import { X, Check, ChevronsUpDown } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const REGION_IMAGES: Record<string, string> = {
  Americas: "/logos/amer.png",
  EMEA: "/logos/emea.png",
  Pacific: "/logos/pac.png",
  China: "/logos/cn.png",
}

export function FeedFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Helper to get array from URL params
  const getParams = (key: string) => {
    const params = searchParams.getAll(key)
    if (params.includes("all")) return []
    return params
  }

  const [selectedRegions, setSelectedRegions] = useState<string[]>(getParams("region"))
  const [selectedTeams, setSelectedTeams] = useState<string[]>(getParams("team"))
  
  const [openRegion, setOpenRegion] = useState(false)
  const [openTeam, setOpenTeam] = useState(false)

  // Sync state with URL when it changes
  useEffect(() => {
    setSelectedRegions(getParams("region"))
    setSelectedTeams(getParams("team"))
  }, [searchParams])

  // Prefetch logic
  useEffect(() => {
    const params = new URLSearchParams()
    selectedRegions.forEach(r => params.append("region", r))
    selectedTeams.forEach(t => params.append("team", t))
    const url = `${pathname}?${params.toString()}`
    router.prefetch(url)
  }, [selectedRegions, selectedTeams, pathname, router])

  const applyFilters = () => {
    const params = new URLSearchParams()
    selectedRegions.forEach(r => params.append("region", r))
    selectedTeams.forEach(t => params.append("team", t))
    
    if (selectedRegions.length === 0 && selectedTeams.length === 0) {
      router.push(pathname)
    } else {
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  const clearFilters = () => {
    setSelectedRegions([])
    setSelectedTeams([])
    router.push(pathname)
  }

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    )
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(t => t !== teamId)
        : [...prev, teamId]
    )
  }

  const hasActiveFilters = getParams("region").length > 0 || getParams("team").length > 0
  
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 mb-6 p-4 bg-card/30 border border-white/10 rounded-lg">
      
      {/* Regions Multi-Select */}
      <div className="flex-1 space-y-2 w-full">
        <label className="text-[10pt] font-mono font-bold uppercase text-muted-foreground">Region</label>
        <Popover open={openRegion} onOpenChange={setOpenRegion}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openRegion}
              className="w-full justify-between bg-background/50 border-input h-10 px-3"
            >
              {selectedRegions.length > 0 
                ? `${selectedRegions.length} selected`
                : "Select Regions"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search region..." />
              <CommandList>
                <CommandEmpty>No region found.</CommandEmpty>
                <CommandGroup>
                  {["Americas", "EMEA", "Pacific", "China"].map((region) => (
                    <CommandItem
                      key={region}
                      value={region}
                      onSelect={() => toggleRegion(region)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedRegions.includes(region)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      <Image 
                        src={REGION_IMAGES[region]} 
                        alt={region} 
                        width={24} 
                        height={24} 
                        className="mr-2 object-contain"
                      />
                      <span>{region}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {/* Selected Regions Display */}
        {selectedRegions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedRegions.map(region => (
              <div key={region} className="flex items-center gap-2 bg-card border border-white/10 px-2 py-1 rounded text-[10pt] font-medium text-foreground">
                <Image 
                  src={REGION_IMAGES[region]} 
                  alt={region} 
                  width={16} 
                  height={16} 
                  className="object-contain"
                />
                {region}
                <button onClick={() => toggleRegion(region)} className="ml-1 text-white hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams Multi-Select */}
      <div className="flex-1 space-y-2 w-full">
        <label className="text-[10pt] font-mono font-bold uppercase text-muted-foreground">Team</label>
        <Popover open={openTeam} onOpenChange={setOpenTeam}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openTeam}
              className="w-full justify-between bg-background/50 border-input h-10 px-3"
            >
              {selectedTeams.length > 0 
                ? `${selectedTeams.length} selected`
                : "Select Teams"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search team..." />
              <CommandList>
                <CommandEmpty>No team found.</CommandEmpty>
                <CommandGroup>
                  {TEAMS.map((team) => (
                    <CommandItem
                      key={team.id}
                      value={team.name} // Search by name
                      onSelect={() => toggleTeam(team.id)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedTeams.includes(team.id)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      <Image 
                        src={`/logos/${team.id}.png`}
                        alt={team.name} 
                        width={30} 
                        height={30} 
                        className="mr-2 object-contain"
                      />
                      <span className="truncate">{team.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Teams Display */}
        {selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTeams.map(teamId => {
              const team = TEAMS.find(t => t.id === teamId)
              if (!team) return null
              return (
                <div key={team.id} className="flex items-center gap-2 bg-card border border-white/10 px-2 py-1 rounded text-[10pt] font-medium text-foreground">
                  <Image 
                    src={`/logos/${team.id}.png`}
                    alt={team.name} 
                    width={16} 
                    height={16} 
                    className="object-contain"
                  />
                  {team.tag}
                  <button onClick={() => toggleTeam(team.id)} className="ml-1 text-white hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto mt-auto pb-1">
        <Button 
          onClick={applyFilters}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-wider flex-1 sm:flex-none text-[10pt]"
        >
          Apply Filter
        </Button>

        {hasActiveFilters && (
           <Button 
             variant="ghost" 
             size="icon-sm" 
             onClick={clearFilters} 
             className="bg-primary text-white hover:bg-primary/80 hover:text-white"
             title="Clear Filters"
           >
             <X className="w-3.5 h-3.5" />
           </Button>
        )}
      </div>
    </div>
  )
}