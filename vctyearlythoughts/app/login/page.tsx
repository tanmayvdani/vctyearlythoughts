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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
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
          BY SIGNING IN, YOU AGREE TO OUR TERMS OF SERVICE AND{" "}
          <button 
            onClick={() => setShowPrivacyPolicy(true)} 
            className="underline underline-offset-4 decoration-primary/50 hover:decoration-primary text-foreground font-bold transition-all"
          >
            PRIVACY POLICY
          </button>.
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
              <br/>
              <span className="mt-2 block opacity-80 text-[9pt]">Check your spam folder if it doesn&apos;t arrive.</span>
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

      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-2xl border-white/10 bg-card max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-primary">Privacy Policy</DialogTitle>
            <DialogDescription className="font-mono text-[10pt] uppercase text-muted-foreground">
              Last updated: January 10, 2026
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4 text-[10pt] leading-relaxed text-foreground/90 font-sans">
            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">1. Introduction</h3>
              <p className="text-muted-foreground">
                Welcome to VCT Time Capsule (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and your rights in relation to the platform.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">2. Legal Basis for Processing</h3>
              <p className="text-muted-foreground">
                If you are located in the European Economic Area (EEA), we process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Consent:</strong> When you voluntarily sign up via email or subscribe to team notifications.</li>
                <li><strong>Legitimate Interest:</strong> To provide, maintain, and improve the &quot;Time Capsule&quot; service and ensure the security of the platform.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">3. Information We Collect</h3>
              <p className="text-muted-foreground">
                <strong>A. Personal Information You Disclose to Us</strong> We collect personal information that you voluntarily provide:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Email Address:</strong> Used solely for authentication (Magic Links via Resend) and notification emails (if opted-in).</li>
                <li><strong>Username:</strong> Collected during onboarding to identify your predictions.</li>
                <li><strong>User Content:</strong> Your predictions, &quot;Time Capsule&quot; thoughts, and roster moves.</li>
              </ul>
              <p className="text-muted-foreground pt-2">
                <strong>B. Information Automatically Collected &amp; Local Storage</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Log and Usage Data:</strong> Our hosting provider (Vercel) may collect diagnostic info (IP address, browser type) for site reliability.</li>
                <li>
                  <strong>Cookies &amp; Local Storage:</strong>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Authentication:</strong> We use cookies via NextAuth.js to maintain your session.</li>
                    <li><strong>Guest Mode:</strong> If you do not log in, we use Local Storage to temporarily save predictions on your device.</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">4. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Authentication:</strong> To send magic links for passwordless login.</li>
                <li><strong>Service Delivery:</strong> To store and display your predictions.</li>
                <li><strong>Notifications:</strong> To send you alerts when a team unlocks. These emails are strictly event-based and limited in frequency; we do not send marketing spam.</li>
                <li><strong>Moderation:</strong> To review content for community safety.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">5. How We Share Your Information</h3>
              <p className="text-muted-foreground">
                We do not sell your data. We share information only with necessary infrastructure providers:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Vercel:</strong> Hosting and deployment.</li>
                <li><strong>Turso (LibSQL):</strong> Database storage.</li>
                <li><strong>Resend:</strong> Email delivery.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">6. International Data Transfers</h3>
              <p className="text-muted-foreground">
                Our application is hosted on Vercel and uses Turso (US-based) for database services. By using the platform, you acknowledge that your information may be transferred to, stored, and processed in the United States and other countries where our service providers operate.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">7. Your Rights</h3>
              <p className="text-muted-foreground">
                Regardless of your location, we provide the following rights regarding your data:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Access and Correction:</strong> You may request a copy of the personal data we hold about you or request that we correct any inaccuracies.</li>
                <li><strong>Deletion:</strong> You have the right to delete your account at any time via your account settings. This action permanently removes your personal data and predictions from our database.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">8. Children&apos;s Privacy</h3>
              <p className="text-muted-foreground">
                Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If we become aware that we have collected Personal Data from a child under 13 without verification of parental consent, we take steps to remove that information.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">9. Content Guidelines &amp; Moderation</h3>
              <p className="text-muted-foreground">
                The administrator reserves the right to remove content that is offensive, harmful, or irrelevant. This moderation process is internal; we do not share your private content with third parties during the review process unless required by law.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold uppercase text-foreground">10. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have questions about this policy or wish to exercise your data rights, please contact us at: support@email.vctyearlythoughts.in
              </p>
            </section>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              className="bg-primary text-white hover:bg-primary/90 rounded-none font-bold uppercase tracking-widest"
              onClick={() => setShowPrivacyPolicy(false)}
            >
              I Understand
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
