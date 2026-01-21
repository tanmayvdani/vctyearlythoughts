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
  kickoffPlacement: text("kickoffPlacement"),
  stage1Placement: text("stage1Placement"),
  stage2Placement: text("stage2Placement"),
  masters1Placement: text("masters1Placement"),
  masters2Placement: text("masters2Placement"),
  championsPlacement: text("championsPlacement"),
  rosterMoves: text("rosterMoves"),
  voteScore: integer("voteScore").notNull().default(0),
  commentCount: integer("commentCount").notNull().default(0),
  slug: text("slug"),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  teamIdIdx: index("team_id_idx").on(table.teamId),
  publicTimeIdx: index("public_time_idx").on(table.isPublic, table.timestamp),
}))

export const comments = sqliteTable("comment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  userImage: text("userImage"),
  predictionId: text("predictionId")
    .notNull()
    .references(() => predictions.id, { onDelete: "cascade" }),
  parentId: text("parentId"), // Self-reference for threading
  content: text("content").notNull(),
  voteScore: integer("voteScore").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  predictionIdx: index("comment_prediction_idx").on(table.predictionId),
  parentIdx: index("comment_parent_idx").on(table.parentId),
}))

export const votes = sqliteTable("vote", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  predictionId: text("predictionId")
    .references(() => predictions.id, { onDelete: "cascade" }),
  commentId: text("commentId")
    .references(() => comments.id, { onDelete: "cascade" }),
  value: integer("value").notNull(), // 1 for upvote, -1 for downvote
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  userPredictionUnique: uniqueIndex("user_prediction_vote_unique").on(table.userId, table.predictionId),
  userCommentUnique: uniqueIndex("user_comment_vote_unique").on(table.userId, table.commentId),
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

export const teams = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tag: text("tag").notNull(),
  region: text("region").notNull(),
  index: integer("index").notNull(),
  roster: text("roster"), // JSON string
  transactions: text("transactions"), // JSON string
})

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



// Roster and Transaction Data
export const players = sqliteTable("player", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("teamId").notNull(),
  name: text("name"),
  alias: text("alias").notNull(),
  role: text("role"),
}, (table) => ({
  teamIdIdx: index("player_team_id_idx").on(table.teamId),
}))

export const teamTransactions = sqliteTable("team_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("teamId").notNull(),
  date: text("date").notNull(),
  action: text("action").notNull(),
  playerAlias: text("playerAlias").notNull(),
}, (table) => ({
  teamIdIdx: index("transaction_team_id_idx").on(table.teamId),
  dateIdx: index("transaction_date_idx").on(table.date),
}))

// Email Outbox Table
export const emailOutbox = sqliteTable("email_outbox", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // e.g. 'team_notification'
  payload: text("payload").notNull(), // JSON payload
  status: text("status").notNull().default("pending"), // pending | sent | failed
  attempts: integer("attempts").notNull().default(0),
  lastError: text("lastError"),
  nextRetryAt: integer("nextRetryAt", { mode: "timestamp_ms" }),
  sentAt: integer("sentAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  statusCreatedAtIdx: index("status_created_at_idx").on(table.status, table.createdAt),
}))

export const emailChangeRequests = sqliteTable("email_change_request", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  newEmail: text("newEmail").notNull(),
  token: text("token").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("email_change_user_idx").on(table.userId),
  tokenIdx: index("email_change_token_idx").on(table.token),
}))
