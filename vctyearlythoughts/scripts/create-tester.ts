import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load env vars from .env.local in the parent directory
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// Define schema locally to avoid importing from app code and dealing with aliases
const allowedTesters = sqliteTable("allowed_tester", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
});

async function addTester(email: string) {
  if (!email) {
    console.error("Please provide an email address.");
    return;
  }

  console.log(`Adding ${email} to allowed testers...`);

  try {
    const { getDb } = await import("../lib/db");
    const db = getDb();
    await db.insert(allowedTesters).values({
      id: crypto.randomUUID(),
      email,
    });
    console.log(`✅ Successfully added ${email}`);
  } catch (e: any) {
    if (e.message?.includes("UNIQUE constraint failed")) {
      console.log(`⚠️  ${email} is already whitelisted.`);
    } else {
      console.error("Error adding tester:", e);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: npx tsx scripts/create-tester.ts <email1> <email2> ...");
    process.exit(1);
  }

  for (const email of args) {
    await addTester(email);
  }
}

main();
