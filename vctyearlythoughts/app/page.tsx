import { HomeClient } from "@/components/home-client"
import { getUserSubscriptions, getUserRegionSubscriptions } from "@/app/actions"
import { TEAMS } from "@/lib/teams"
import { isUnlockedToday } from "@/lib/vct-utils"

export default async function Home() {
  // Fetch data on the server
  const subscriptions = await getUserSubscriptions()
  const regionSubscriptions = await getUserRegionSubscriptions()
  
  // Calculate today's teams using Server Time
  const serverTime = new Date()
  const todaysTeams = TEAMS.filter(t => isUnlockedToday(t, serverTime)).slice(0, 4)

  return (
    <HomeClient 
      initialSubscriptions={subscriptions} 
      initialRegionSubscriptions={regionSubscriptions}
      todaysTeams={todaysTeams} 
    />
  )
}