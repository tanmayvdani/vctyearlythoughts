"use client"

import { useState, Suspense, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Mail, CheckCircle2 } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/")
    }
  }, [status, router])

  const handleLogin = async () => {
    if (!email) return
    setIsLoading(true)
    
    try {
      const result = await signIn("resend", { email, redirect: false })

      if (result?.error) {
        toast.error("Something went wrong. Please try again.")
        return
      }
      
      setIsEmailSent(true)

    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || status === "authenticated") {
    return null 
  }

  return (
    <>
      <div className="w-full max-w-md bg-card border border-white/10 p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">ACCESS TIME CAPSULE</h1>
          <p className="text-[10pt] text-muted-foreground font-mono uppercase tracking-widest">
            Identify yourself to record thoughts
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10pt] font-mono uppercase text-muted-foreground tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="name@example.com"
                className="pl-10 bg-input border-white/10 rounded-none font-mono text-[10pt] h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button 
            className="w-full bg-primary hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest h-12"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Magic Link"}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center text-[10pt] uppercase">
            <span className="bg-card px-2 text-muted-foreground font-mono">Or continue anonymously</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
           <Button 
             variant="outline" 
             className="rounded-none border-white/10 hover:bg-white/5 h-12 bg-transparent uppercase font-bold text-[10pt]"
             onClick={() => window.location.href = "/"}
           >
            Continue as Guest
          </Button>
        </div>

        <p className="text-[10pt] text-center text-muted-foreground font-mono uppercase leading-relaxed">
          BY SIGNING IN, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
        </p>
      </div>

      <Dialog open={isEmailSent} onOpenChange={setIsEmailSent}>
        <DialogContent className="sm:max-w-md border-white/10 bg-card">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-4 pt-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold uppercase tracking-tight">Check your inbox</span>
            </DialogTitle>
            <DialogDescription className="text-center pt-2 font-mono text-[10pt] uppercase tracking-wide">
              We&apos;ve sent a magic link to <span className="text-foreground font-bold">{email}</span>.
              <br/>
              Click the link to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4 pb-6">
            <Button 
              variant="outline" 
              className="w-full max-w-[200px] border-white/10 hover:bg-white/5 uppercase font-bold text-[10pt]"
              onClick={() => setIsEmailSent(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-muted-foreground text-[10pt] uppercase font-mono animate-pulse">Loading secure channel...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
