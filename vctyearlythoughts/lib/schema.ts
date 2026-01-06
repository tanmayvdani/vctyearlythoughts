import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from "drizzle-orm/sqlite-core"
import type { AdapterAccount } from "next-auth/adapters"

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
})

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// Custom tables for our app

export const predictions = sqliteTable("prediction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("teamId").notNull(),
  teamName: text("teamName").notNull(),
  teamTag: text("teamTag").notNull(),
  thought: text("thought").notNull(),
  userId: text("userId").notNull(), // Can be real user ID or "guest"
  userName: text("userName").notNull(),
  timestamp: text("timestamp").notNull(),
  isPublic: integer("isPublic", { mode: "boolean" }).notNull().default(false),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  teamIdIdx: index("team_id_idx").on(table.teamId),
  publicTimeIdx: index("public_time_idx").on(table.isPublic, table.timestamp),
}))

export const otpRequests = sqliteTable("otp_request", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(), // email or IP
  count: integer("count").notNull().default(0),
  lastRequest: integer("lastRequest", { mode: "timestamp_ms" }).notNull(),
})

export const teamNotifications = sqliteTable("team_notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  teamId: text("teamId").notNull(),
  sent: integer("sent", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  userTeamUnique: uniqueIndex("user_team_unique").on(table.userId, table.teamId),
}))

export const regionNotifications = sqliteTable("region_notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  regionName: text("regionName").notNull(),
  sent: integer("sent", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  userRegionUnique: uniqueIndex("user_region_unique").on(table.userId, table.regionName),
}))

export const allowedTesters = sqliteTable("allowed_tester", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
})
