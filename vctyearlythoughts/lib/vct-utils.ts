import { KICKOFF_DATES, LOCK_DATES, type Region, type Team } from "./teams"

// Global Unlock Event: Jan 22 2026 00:00 GMT to Jan 23 2026 00:00 GMT
const GLOBAL_UNLOCK_START = new Date("2026-01-22T00:00:00.000Z")
const GLOBAL_UNLOCK_END = new Date("2026-01-23T00:00:00.000Z")

export function isGlobalUnlockActive(mockDate?: Date) {
  return true // DEBUG: Forcing event active
  const now = mockDate || new Date()
  return now >= GLOBAL_UNLOCK_START && now < GLOBAL_UNLOCK_END
}

export function getUnlockStatus(team: Team, mockDate?: Date) {
  const now = mockDate || new Date()

  // Global Unlock Event Override
  if (isGlobalUnlockActive(now)) {
    return {
      isUnlocked: true,
      daysUntilUnlock: 0,
      unlockDate: now, // Unlocked right now
    }
  }

  const kickoffDate = new Date(KICKOFF_DATES[team.region])

  // Teams start unlocking 12 days before kickoff
  const unlockStartDate = new Date(kickoffDate)
  unlockStartDate.setDate(kickoffDate.getDate() - 12)

  // Calculate how many days have passed since the unlock start date
  const diffInMs = now.getTime() - unlockStartDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1

  const isUnlocked = diffInDays >= team.index
  const daysUntilUnlock = team.index - diffInDays

  return {
    isUnlocked,
    daysUntilUnlock: daysUntilUnlock > 0 ? daysUntilUnlock : 0,
    unlockDate: new Date(unlockStartDate.getTime() + (team.index - 1) * 24 * 60 * 60 * 1000),
  }
}

export function isUnlockedToday(team: Team, mockDate?: Date) {
  const now = mockDate || new Date()
  
  if (isGlobalUnlockActive(now)) {
      return true
  }

  const kickoffDate = new Date(KICKOFF_DATES[team.region])

  // Teams start unlocking 12 days before kickoff
  const unlockStartDate = new Date(kickoffDate)
  unlockStartDate.setDate(kickoffDate.getDate() - 12)

  // Calculate how many days have passed since the unlock start date
  const diffInMs = now.getTime() - unlockStartDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1

  return diffInDays === team.index
}

export function getRegionUnlockCount(region: Region, teams: Team[], mockDate?: Date) {
  return teams.filter((t) => t.region === region).filter((t) => getUnlockStatus(t, mockDate).isUnlocked).length
}

export function isRegionLocked(region: Region, mockDate?: Date) {
  const now = mockDate || new Date()
  
  if (isGlobalUnlockActive(now)) {
    return false
  }

  const lockDate = new Date(LOCK_DATES[region] + "T00:00:00.000Z") // Explicit UTC
  return now >= lockDate
}

export function getRegionLockStatus(region: Region, mockDate?: Date) {
  const now = mockDate || new Date()

  if (isGlobalUnlockActive(now)) {
    return {
      isLocked: false,
      lockDate: GLOBAL_UNLOCK_END, // Show the end of the global event as the new lock date
      hoursUntilLock: Math.max(0, Math.floor((GLOBAL_UNLOCK_END.getTime() - now.getTime()) / (1000 * 60 * 60)))
    }
  }

  const lockDate = new Date(LOCK_DATES[region] + "T00:00:00.000Z")
  const isLocked = now >= lockDate
  
  return {
    isLocked,
    lockDate,
    hoursUntilLock: isLocked ? 0 : Math.max(0, Math.floor((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60)))
  }
}
