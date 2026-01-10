import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb } from "@/lib/db"
import Resend from "next-auth/providers/resend"
import { Resend as ResendClient } from "resend"
import { otpRequests, users } from "@/lib/schema"
import { eq, and, gt } from "drizzle-orm"
import { RateLimitError } from "@/lib/errors"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb()),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const resend = new ResendClient(process.env.RESEND_API_KEY)
        const { host } = new URL(url)
        const escapedHost = host.replace(/\./g, "&#8203;.")

        try {
          await resend.emails.send({
            from: provider.from || "onboarding@resend.dev",
            to: identifier,
            subject: `Sign in to ${host}`,
            html: html({ url, host, theme: { brandColor: "#ff4655", buttonText: "#ffffff" } }),
            text: text({ url, host }),
          })
        } catch (error) {
          console.error("Failed to send verification email", error)
          throw new Error("Failed to send verification email")
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const userEmail = user.email
      if (!userEmail) return false
      
      try {
        const db = getDb()
        return await db.transaction(async (tx) => {
          // Rate Limiting Logic: 100 requests per hour
          const now = Date.now()
          const oneHourAgo = now - 60 * 60 * 1000
          
          const requests = await tx
            .select()
            .from(otpRequests)
            .where(
              and(
                eq(otpRequests.identifier, userEmail),
                gt(otpRequests.lastRequest, new Date(oneHourAgo))
              )
            )
            .limit(1)

          if (requests.length > 0) {
            const existingRequest = requests[0]
            if (existingRequest.count >= 100) {
              console.warn(`Rate limit exceeded for ${userEmail}`)
              throw new RateLimitError()
            }
            
            console.log(`Login attempt ${existingRequest.count + 1}/100 for ${userEmail}`)

            // Update count
            await tx
              .update(otpRequests)
              .set({ 
                count: existingRequest.count + 1,
                lastRequest: new Date(now)
              })
              .where(eq(otpRequests.id, existingRequest.id))
          } else {
            console.log(`First login attempt for ${userEmail}`)
            // Create new record
            await tx.insert(otpRequests).values({
              identifier: userEmail,
              count: 1,
              lastRequest: new Date(now),
            })
          }

          return true
        })
      } catch (error) {
        if (error instanceof RateLimitError) {
          return "/login?error=RateLimitExceeded"
        }
        console.error("Sign in error:", error)
        return false
      }
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
        
        // Ensure we have the latest data from DB (especially name)
        if (session.user.id) {
           try {
             const db = getDb()
             const dbUser = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
             if (dbUser.length > 0) {
               session.user.name = dbUser[0].name
               session.user.email = dbUser[0].email
               session.user.image = dbUser[0].image
             }
           } catch(e) {
             console.error("Error fetching user in session callback", e)
           }
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

function html(params: { url: string; host: string; theme: { brandColor: string; buttonText: string } }) {
  const { url, host, theme } = params

  const brandColor = theme.brandColor || "#ff4655" // Valorant Red default
  const color = {
    background: "#0f1923", // Valorant Dark Blue
    text: "#ece8e1", // Off-white
    mainBackground: "#111",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: theme.buttonText || "#fff",
  }

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.background}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        <strong>VCT Time Capsule</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}">
              <a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">
                Sign in
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email, you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
function text({ url, host }: { url: string; host: string }) {
  return `Sign in to VCT Time Capsule (${host})\n\nPlease click the link below to sign in:\n${url}\n\nIf you did not request this email, you can safely ignore it.\n`
}
