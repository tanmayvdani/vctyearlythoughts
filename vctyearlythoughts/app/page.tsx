import { HomeClient } from "@/components/home-client"
import { getUserSubscriptions, getUserRegionSubscriptions } from "@/app/actions"
import { TEAMS, KICKOFF_DATES } from "@/lib/teams"
import { isUnlockedToday } from "@/lib/vct-utils"

export default async function Home() {
  // Fetch data on the server
  const subscriptions = await getUserSubscriptions()
  const regionSubscriptions = await getUserRegionSubscriptions()
  
  // Calculate today's teams using Server Time
  const serverTime = new Date()
  const todaysTeams = TEAMS.filter(t => isUnlockedToday(t, serverTime)).slice(0, 4)

  // Calculate tomorrow's teams (simple approximation based on index)
  // We can just look for the next index in the sequence generally, or specifically 1 day out.
  // Using the same logic as isUnlockedToday but for tomorrow.
  const tomorrow = new Date(serverTime)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowTeams = TEAMS.filter(t => isUnlockedToday(t, tomorrow)).slice(0, 1)

  // Calculate days until earliest start
  const earliestStartStr = Object.values(KICKOFF_DATES).sort()[0]
  const earliestStart = new Date(earliestStartStr)
  const daysUntilStart = Math.ceil((earliestStart.getTime() - serverTime.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <HomeClient 
      initialSubscriptions={subscriptions} 
      initialRegionSubscriptions={regionSubscriptions}
      todaysTeams={todaysTeams} 
      tomorrowTeams={tomorrowTeams}
      daysUntilStart={daysUntilStart}
    />
  )
}