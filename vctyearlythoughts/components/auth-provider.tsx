"use client"

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react"
import React from "react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={false} 
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}

export const useAuth = () => {
  const { data: session, status } = useSession()
  return {
    user: session?.user || null,
    isLoading: status === "loading",
    login: (email: string) => signIn("resend", { email }), // fallback for legacy calls
    logout: () => signOut(),
  }
}
