import { drizzle } from "drizzle-orm/libsql"
import { createClient, type Client } from "@libsql/client"
import * as schema from "./schema"

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined
let _client: Client | undefined

export function getDb() {
  if (_db) return _db

  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    throw new Error("DATABASE_URL is not set. Please configure your Turso connection URL.")
  }
  if (!authToken) {
    throw new Error("DATABASE_AUTH_TOKEN is not set. Please configure your Turso auth token.")
  }

  _client = createClient({ url, authToken })
  _db = drizzle(_client, { schema })
  return _db
}

