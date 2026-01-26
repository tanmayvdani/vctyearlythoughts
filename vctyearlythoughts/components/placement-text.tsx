import { cn } from "@/lib/utils"

interface PlacementTextProps {
  value: string
  className?: string
}

export function PlacementText({ value, className }: PlacementTextProps) {
  if (!value) return null

  const getPlacementClass = (val: string) => {
    const normalized = val.toLowerCase()
    if (normalized.startsWith("1st")) return "placement-gold"
    if (normalized.startsWith("2nd")) return "placement-silver"
    if (normalized.startsWith("3rd")) return "placement-bronze"
    return ""
  }

  const placementClass = getPlacementClass(value)

  return (
    <span className={cn("font-black tracking-tighter", placementClass, className)}>
      {value}
    </span>
  )
}
