import { KICKOFF_DATES, type Region, type Team } from "./teams"

export function getUnlockStatus(team: Team, mockDate?: Date) {
  const now = mockDate || new Date()
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
