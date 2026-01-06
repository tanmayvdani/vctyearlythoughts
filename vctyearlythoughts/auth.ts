import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { otpRequests, allowedTesters } from "@/lib/schema"
import { eq, and, gt } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Resend({
      // If no API key is provided, Auth.js will default to logging to console in dev
      apiKey: process.env.RESEND_API_KEY,
      from: "onboarding@resend.dev",
    }),
    Credentials({
      name: "Tester Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const email = credentials.email as string

        const tester = await db
          .select()
          .from(allowedTesters)
          .where(eq(allowedTesters.email, email))
          .get()

        if (tester) {
          // Verify user exists in main users table or create? 
          // DrizzleAdapter usually handles user creation for OAuth/MagicLink.
          // For Credentials, we might need to return an object. 
          // If we return an object, NextAuth creates a JWT session by default for credentials?
          // But we are using database sessions... 
          // Credentials provider with Database adapter is tricky. 
          // Usually Credentials -> JWT. Database -> Session.
          // Let's stick to returning a User object.
          return { id: email, email: email, name: "Tester" }
        }
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, email, account }) {
      if (!user.email) return false
      
      // Bypass rate limit for Credentials login (Testers)
      if (account?.provider === "credentials") return true

      return await db.transaction(async (tx) => {
        // Rate Limiting Logic: 3 requests per hour
        const now = Date.now()
        const oneHourAgo = now - 60 * 60 * 1000
        
        const requests = await tx
          .select()
          .from(otpRequests)
          .where(
            and(
              eq(otpRequests.identifier, user.email!), // user.email is checked above
              gt(otpRequests.lastRequest, new Date(oneHourAgo))
            )
          )

        if (requests.length > 0) {
          const existingRequest = requests[0]
          if (existingRequest.count >= 100) {
            console.warn(`Rate limit exceeded for ${user.email}`)
            return false // Block sign in
          }
          
          console.log(`Login attempt ${existingRequest.count + 1}/100 for ${user.email}`)

          // Update count
          await tx
            .update(otpRequests)
            .set({ 
              count: existingRequest.count + 1,
              lastRequest: new Date(now)
            })
            .where(eq(otpRequests.id, existingRequest.id))
        } else {
          console.log(`First login attempt for ${user.email}`)
          // Create new record
          await tx.insert(otpRequests).values({
            identifier: user.email!,
            count: 1,
            lastRequest: new Date(now),
          })
        }

        return true
      })
    },
    async session({ session, user, token }) {
      // Add user ID to session
      if (session.user) {
        if (user?.id) {
            session.user.id = user.id
        } else if (token?.sub) {
            // Fallback for JWT strategies if mixed
            session.user.id = token.sub
        }
      }
      return session
    },
    async jwt({ token, user }) {
        if (user) {
            token.sub = user.id
        }
        return token
    }
  },
  session: {
      strategy: "jwt", // Force JWT to support Credentials provider alongside others easily without complex DB adapter handling for credentials
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=true', // Show check email message on same page
  }
})
