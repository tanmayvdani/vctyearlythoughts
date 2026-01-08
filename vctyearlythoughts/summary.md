# Project Summary: VCT Time Capsule

## Overview
**12 Days to VCT** is a Next.js 16 application designed as a "Time Capsule" for Valorant Esports fans. It allows users to record predictions and thoughts on VCT teams leading up to the 2026 season. The app features a daily unlocking mechanism where specific teams become available for prediction each day.

## Tech Stack
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Database:** SQLite (LibSQL/Turso)
*   **ORM:** Drizzle ORM
*   **Styling:** Tailwind CSS v4, Radix UI primitives (shadcn/ui-like patterns)
*   **Authentication:** NextAuth.js v5 (Resend Provider / Email Magic Links)
*   **Deployment:** Vercel

## Directory Structure

```text
vctyearlythoughts/
├── app/                        # Next.js App Router
│   ├── actions.ts              # Server Actions (Mutations: submit prediction, subscribe)
│   ├── api/                    # API Routes (Auth, Cron jobs)
│   ├── feed/                   # Public feed page
│   ├── login/                  # Login page
│   ├── my-feed/                # User's private feed page
│   ├── onboarding/             # Username setup page
│   ├── page.tsx                # Landing page (Dashboard)
│   └── layout.tsx              # Root layout (Auth provider, Toaster, Fonts)
├── components/                 # React Components
│   ├── ui/                     # Reusable UI atoms (Button, Input, Dialog, etc.)
│   ├── prediction-modal.tsx    # Core feature: Modal to submit team predictions
│   ├── feed-list.tsx           # Displays list of predictions
│   ├── region-column.tsx       # Column view for teams in a specific region
│   └── navbar.tsx              # Main navigation
├── drizzle/                    # Database Migrations & Meta
├── lib/                        # Core Utilities & Configuration
│   ├── db.ts                   # Database connection (LibSQL)
│   ├── schema.ts               # Drizzle Schema definitions
│   ├── teams.ts                # Static data: Team definitions & Kickoff dates
│   ├── vct-utils.ts            # Logic for team unlocking schedules
│   └── data/                   # JSON data (e.g., team rosters)
├── public/                     # Static assets (Logos, images)
├── scripts/                    # Utility scripts (Seed DB, Check Env, Migrations)
└── ...config files             # (next.config.ts, drizzle.config.ts, tailwind, etc.)
```

## Key Modules & Features

### 1. Database Schema (`lib/schema.ts`)
The application uses SQLite with the following key tables:
*   **Auth:** `user`, `account`, `session`, `verificationToken` (Standard NextAuth).
*   **Core:**
    *   `prediction`: Stores user thoughts, placements (kickoff, stages, masters), and roster move predictions.
    *   `team`: Static/Cached team data.
*   **Notifications:**
    *   `team_notification` / `region_notification`: User subscriptions.
    *   `email_outbox`: Queue for sending transactional emails via Cron.
*   **Rosters:** `player`, `team_transaction` (Historical roster changes).

### 2. Authentication
*   **Provider:** Passwordless Email (Magic Links) via Resend.
*   **Guest Mode:** Users can submit predictions as "Guest" (stored with cookies/local storage logic in `actions.ts`), or sign in to save permanently.
*   **Onboarding:** New users are redirected to set a username.

### 3. Unlocking Logic (`lib/vct-utils.ts`)
Teams are "locked" until a specific date relative to their region's kickoff.
*   **Logic:** `getUnlockStatus(team)` calculates if a team is open for prediction based on `KICKOFF_DATES` in `lib/teams.ts`.
*   **UI:** Locked teams show a lock icon; unlocked teams open the `PredictionModal`.

### 4. Predictions (`components/prediction-modal.tsx`)
*   Users can predict placements (Kickoff, Stage 1/2, Internationals) and write a "Season Thought".
*   Data is submitted via Server Actions (`submitPrediction` in `app/actions.ts`).

### 5. Notifications (`app/api/cron/notify`)
*   A Cron job runs to check for newly unlocked teams.
*   It queues emails in `email_outbox` for subscribed users.
*   It processes the outbox to send emails via Resend API.

## Development Workflow

### Database
*   **Generate Migrations:** `npx drizzle-kit generate`
*   **Apply Migrations (Local):** `npx drizzle-kit push` or `node scripts/apply-migration.js`
*   **Seed Data:** `npx tsx scripts/seed-transactions.ts`

### Running Locally
1.  Setup `.env.local` (Database URL, Auth Secret, Resend API Key).
2.  `npm install`
3.  `npm run dev` -> http://localhost:3000

## Design System
*   **Theme:** Dark mode by default (`globals.css`).
*   **Colors:** Valorant-inspired (Red/Coral accent `#fd5360`, Dark backgrounds).
*   **Font:** Geist Sans / Mono.
