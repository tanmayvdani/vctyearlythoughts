import { Navbar } from "@/components/navbar"
import { PowerRankingsClient } from "./power-rankings-client"

export const metadata = {
  title: "Power Rankings | VCT Time Capsule",
  description: "Create and share your VCT Power Rankings styled like Plat Chat broadcast overlays.",
}

export default function PowerRankingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 py-8">
        <PowerRankingsClient />
      </main>
    </div>
  )
}
