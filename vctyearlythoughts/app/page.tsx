import { HomeClient } from "@/components/home-client"
import { getUserSubscriptions, getUserRegionSubscriptions, getUserPredictions } from "@/app/actions"
import { TEAMS, KICKOFF_DATES } from "@/lib/teams"
import { isUnlockedToday } from "@/lib/vct-utils"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  
  // If user is logged in but hasn't set a name, redirect to onboarding
  if (session?.user && !session.user.name) {
    redirect("/onboarding")
  }

  // Fetch data on the server
  const subscriptions = await getUserSubscriptions()
  const regionSubscriptions = await getUserRegionSubscriptions()
  const predictions = await getUserPredictions()
  
  // Calculate today's teams using Server Time
  const serverTime = new Date()
  const todaysTeams = TEAMS.filter(t => isUnlockedToday(t, serverTime)).slice(0, 4)

  // Calculate tomorrow's teams (simple approximation based on index)
  // We can just look for the next index in the sequence generally, or specifically 1 day out.
  // Using the same logic as isUnlockedToday but for tomorrow.
  const tomorrow = new Date(serverTime)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowTeams = TEAMS.filter(t => isUnlockedToday(t, tomorrow)).slice(0, 4)

  // Calculate days until earliest start
  const earliestStartStr = Object.values(KICKOFF_DATES).sort()[0]
  const earliestStart = new Date(earliestStartStr)
  const daysUntilStart = Math.ceil((earliestStart.getTime() - serverTime.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <HomeClient 
      initialSubscriptions={subscriptions} 
      initialRegionSubscriptions={regionSubscriptions}
      initialPredictions={predictions}
      todaysTeams={todaysTeams} 
      tomorrowTeams={tomorrowTeams}
      daysUntilStart={daysUntilStart}
    />
  )
}