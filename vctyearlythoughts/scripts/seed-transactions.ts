import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

// Helper to normalize strings for comparison
const normalize = (s: string) => s.toLowerCase().trim()

async function main() {
  const { getDb } = await import("../lib/db")
  const db = getDb()
  const { players, teamTransactions } = await import("../lib/schema")
  const { TEAMS } = await import("../lib/teams")
  const transactionsData = (await import("../lib/data/transactions.json")).default
  const { eq } = await import("drizzle-orm")

  console.log("Starting transaction seed...")

  // Create a map of Team Name -> Team ID from our internal constant
  const teamNameMap = new Map<string, string>()
  for (const team of TEAMS) {
    teamNameMap.set(normalize(team.name), team.id)
  }

  // Iterate through regions in the JSON data
  for (const [region, teams] of Object.entries(transactionsData)) {
    console.log(`Processing region: ${region}`)
    
    for (const [slug, teamData] of Object.entries(teams)) {
      const jsonName = teamData.name
      const teamId = teamNameMap.get(normalize(jsonName))

      if (!teamId) {
        console.warn(`⚠️ Could not find internal Team ID for: "${jsonName}" (slug: ${slug})`)
        continue
      }

      console.log(`  -> Processing team: ${jsonName} (ID: ${teamId})`)

      // 1. Insert Roster
      if (teamData.roster && Array.isArray(teamData.roster)) {
        // Clear existing players for this team to avoid duplicates/stale data on re-run
        await db.delete(players).where(eq(players.teamId, teamId))
        
        for (const player of teamData.roster) {
          await db.insert(players).values({
            teamId,
            name: player.name,
            alias: player.alias,
            role: player.role
          })
        }
        console.log(`     Inserted ${teamData.roster.length} players.`)
      }

      // 2. Insert Transactions
      if (teamData.transactions && Array.isArray(teamData.transactions)) {
         // Clear existing transactions for this team
        await db.delete(teamTransactions).where(eq(teamTransactions.teamId, teamId))

        for (const tx of teamData.transactions) {
          await db.insert(teamTransactions).values({
            teamId,
            date: tx.date,
            action: tx.action,
            playerAlias: tx.player
          })
        }
        console.log(`     Inserted ${teamData.transactions.length} transactions.`)
      }
    }
  }

  console.log("✅ Seeding complete.")
}

main().catch((e) => {
  console.error("Error seeding transactions:", e)
  process.exit(1)
})
