"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { useRouter, useSearchParams } from "next/navigation"
import { updateUsername, requestEmailChange } from "@/app/actions"
import { useSession } from "next-auth/react"
import { CheckCircle, AlertCircle, Pencil, Mail, Save } from "lucide-react"

export default function SettingsPage() {
  const [username, setUsername] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()

  const currentUsername = session?.user?.name || ""
  const currentEmail = session?.user?.email || ""

  const success = searchParams.get("success")
  const error = searchParams.get("error")

  useEffect(() => {
    if (success === "true") {
      update()
      router.replace("/settings")
    }
  }, [success, update, router])

  const handleStartEditUsername = () => {
    setIsEditingUsername(true)
    setUsername("")
  }

  const handleUpdateUsername = async () => {
    if (!username.trim()) return
    setIsUpdatingUsername(true)
    await updateUsername(username)
    await update()
    setIsEditingUsername(false)
    setUsername("")
    setIsUpdatingUsername(false)
  }

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false)
    setUsername("")
  }

  const handleStartEditEmail = () => {
    setIsEditingEmail(true)
    setNewEmail("")
  }

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return
    setIsUpdatingEmail(true)
    const result = await requestEmailChange(newEmail)
    if (result.error) {
      alert(result.error)
    } else {
      alert("Confirmation email sent to " + newEmail)
      setIsEditingEmail(false)
      setNewEmail("")
    }
    setIsUpdatingEmail(false)
  }

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false)
    setNewEmail("")
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-[800px] mx-auto space-y-8 animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase">Settings</h1>
            <p className="text-muted-foreground font-mono text-[10pt]">
              Manage your account information
            </p>
          </div>

          {success === "true" && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-400">Email updated successfully!</p>
            </div>
          )}

          {error === "expired" && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-400">Email confirmation link has expired. Please try again.</p>
            </div>
          )}

          {error === "used" && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-yellow-400">This confirmation link has already been used.</p>
            </div>
          )}

          {error === "invalid" && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-400">Invalid confirmation link.</p>
            </div>
          )}

          <div className="bg-card border border-white/10 p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10pt] font-mono uppercase text-muted-foreground tracking-widest">
                  Username
                </label>
                {isEditingUsername ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[9pt] text-muted-foreground">Current: {currentUsername}</p>
                      <Input
                        type="text"
                        placeholder="VALORANT_FAN_2026"
                        className="bg-input border-white/10 rounded-none font-mono text-[10pt] h-12"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateUsername()}
                        maxLength={32}
                        autoCapitalize="none"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="bg-primary hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest h-12 flex-1"
                        onClick={handleUpdateUsername}
                        disabled={isUpdatingUsername || !username.trim()}
                      >
                        {isUpdatingUsername ? "UPDATING..." : (
                          <>
                            <Save className="w-4 h-4" />
                            SAVE
                          </>
                        )}
                      </Button>
                      <Button 
                        className="bg-secondary hover:bg-secondary/90 rounded-none font-bold uppercase tracking-widest h-12 px-4"
                        onClick={handleCancelEditUsername}
                        disabled={isUpdatingUsername}
                      >
                        CANCEL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="bg-input/50 border border-white/10 p-3 flex-1">
                      <p className="text-[10pt] font-mono">{currentUsername || "Not set"}</p>
                    </div>
                    <Button 
                      className="bg-secondary hover:bg-secondary/90 rounded-none font-bold uppercase tracking-widest h-12 px-4"
                      onClick={handleStartEditUsername}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="space-y-2">
                <label className="text-[10pt] font-mono uppercase text-muted-foreground tracking-widest">
                  Email
                </label>
                {isEditingEmail ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[9pt] text-muted-foreground">Current: {currentEmail}</p>
                      <Input
                        type="email"
                        placeholder="new@example.com"
                        className="bg-input border-white/10 rounded-none font-mono text-[10pt] h-12"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRequestEmailChange()}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="bg-primary hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest h-12 flex-1"
                        onClick={handleRequestEmailChange}
                        disabled={isUpdatingEmail || !newEmail.trim()}
                      >
                        {isUpdatingEmail ? "SENDING..." : (
                          <>
                            <Mail className="w-4 h-4" />
                            SEND LINK
                          </>
                        )}
                      </Button>
                      <Button 
                        className="bg-secondary hover:bg-secondary/90 rounded-none font-bold uppercase tracking-widest h-12 px-4"
                        onClick={handleCancelEditEmail}
                        disabled={isUpdatingEmail}
                      >
                        CANCEL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="bg-input/50 border border-white/10 p-3 flex-1">
                      <p className="text-[10pt] font-mono">{currentEmail || "Not set"}</p>
                    </div>
                    <Button 
                      className="bg-secondary hover:bg-secondary/90 rounded-none font-bold uppercase tracking-widest h-12 px-4"
                      onClick={handleStartEditEmail}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
