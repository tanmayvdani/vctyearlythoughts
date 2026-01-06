"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { LogOut, User } from "lucide-react"
import Image from "next/image"

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { label: "DASHBOARD", href: "/" },
    { label: "MY FEED", href: "/my-feed" },
    { label: "PUBLIC FEED", href: "/feed" },
  ]

  return (
    <nav className="h-10 border-b border-border bg-muted flex items-center justify-center sticky top-0 z-50">
      <div className="w-full max-w-[1200px] px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/valoranttimecapsule.png" 
              alt="VCT Capsule" 
              width={24} 
              height={24} 
              className="object-contain" 
            />
            <span className="font-bold tracking-tight text-xs hidden sm:inline-block text-white">VCT CAPSULE</span>
          </Link>

          <div className="flex items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 h-10 flex items-center text-[11px] font-bold tracking-tight transition-colors border-b-2",
                  pathname === item.href
                    ? "text-primary border-primary bg-white/[0.03]"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/[0.02]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="uppercase">{user.name || user.email}</span>
            </div>
            <button 
              onClick={() => logout()} 
              className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              LOG OUT
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-[11px] font-bold text-muted-foreground hover:text-white transition-colors">
            SIGN IN
          </Link>
        )}
      </div>
    </nav>
  )
}
