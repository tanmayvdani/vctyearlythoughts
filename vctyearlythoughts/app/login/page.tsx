"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Mail } from "lucide-react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { checkIfTester } from "@/app/actions"
import { toast } from "sonner"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const isVerify = searchParams.get("verify") === "true"

  const handleLogin = async () => {
    if (!email) return
    setIsLoading(true)
    
    try {
      const isTester = await checkIfTester(email)
      
      if (isTester) {
        await signIn("credentials", { email, callbackUrl: "/" })
      } else {
        await signIn("resend", { email, callbackUrl: "/" })
      }
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-card border border-white/10 p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tighter uppercase">ACCESS TIME CAPSULE</h1>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
          Identify yourself to record thoughts
        </p>
      </div>

      {isVerify ? (
         <div className="bg-primary/10 border border-primary p-4 text-center space-y-2 animate-in fade-in">
            <h3 className="text-primary font-bold uppercase text-sm">Check your email</h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              A magic link has been sent to your inbox. Click it to sign in.
            </p>
         </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="name@example.com"
                className="pl-10 bg-input border-white/10 rounded-none font-mono text-sm h-12"
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
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10"></span>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-card px-2 text-muted-foreground font-mono">Or continue anonymously</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
         <Button 
           variant="outline" 
           className="rounded-none border-white/10 hover:bg-white/5 h-12 bg-transparent uppercase font-bold text-xs"
           onClick={() => window.location.href = "/"}
         >
          Continue as Guest
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground font-mono uppercase leading-relaxed">
        BY SIGNING IN, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="text-muted-foreground text-xs uppercase font-mono animate-pulse">Loading secure channel...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
