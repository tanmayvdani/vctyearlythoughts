import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { emailChangeRequests, users, accounts } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { auth, signIn } from "@/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/settings?error=invalid", request.url))
  }

  const db = getDb()

  const requests = await db
    .select()
    .from(emailChangeRequests)
    .where(eq(emailChangeRequests.token, token))
    .limit(1)

  if (requests.length === 0) {
    return NextResponse.redirect(new URL("/settings?error=invalid", request.url))
  }

  const emailRequest = requests[0]

  if (emailRequest.used) {
    return NextResponse.redirect(new URL("/settings?error=used", request.url))
  }

  if (new Date(emailRequest.expiresAt) < new Date()) {
    return NextResponse.redirect(new URL("/settings?error=expired", request.url))
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ email: emailRequest.newEmail })
        .where(eq(users.id, emailRequest.userId))

      await tx
        .update(emailChangeRequests)
        .set({ used: true })
        .where(eq(emailChangeRequests.id, emailRequest.id))
    })

    return NextResponse.redirect(new URL("/settings?success=true", request.url))
  } catch (error) {
    console.error("Failed to update email:", error)
    return NextResponse.redirect(new URL("/settings?error=server", request.url))
  }
}
