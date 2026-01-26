# Project Summary: VCT Time Capsule

## Overview
**VCT Time Capsule** is a Next.js 16 application designed as a "Time Capsule" for Valorant Esports fans. It allows users to record predictions and thoughts on VCT teams leading up to the 2026 season. The app features a daily unlocking mechanism where specific teams become available for prediction each day, a public feed with voting and comments, team roster tracking, and user settings.

## Tech Stack
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Database:** SQLite (LibSQL/Turso)
*   **ORM:** Drizzle ORM
*   **Styling:** Tailwind CSS v4, Radix UI primitives (shadcn/ui-like patterns), Lucide React icons
*   **Authentication:** NextAuth.js v5 (Resend Provider / Email Magic Links with rate limiting)
*   **Forms:** React Hook Form with Zod validation
*   **Charts:** Recharts
*   **Markdown:** React Markdown with GFM and remark-breaks
*   **Deployment:** Vercel
*   **Analytics:** Vercel Analytics

## Directory Structure

```text
vctyearlythoughts/
├── app/                        # Next.js App Router
│   ├── actions.ts              # Server Actions (Mutations: submit prediction, subscribe, voting, commenting)
│   ├── api/                    # API Routes (Auth, Cron jobs)
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth API route
│   │   ├── cron/notify/route.ts         # Cron job for notifications
│   │   └── confirm-email-change/route.ts # Email change confirmation
│   ├── feed/                   # Public feed page with filters and pagination
│   │   ├── actions.ts          # Feed-specific actions
│   │   ├── page.tsx            # Feed page
│   │   └── post/[slug]/page.tsx # Individual prediction page
│   ├── login/                  # Login page
│   ├── my-feed/                # User's private feed page
│   ├── onboarding/             # Username setup page
│   ├── first-impressions/      # First Impressions event page
│   ├── rosters/                # Team rosters page
│   │   ├── page.tsx            # Rosters page
│   │   └── roster-client.tsx   # Client component for roster display
│   ├── settings/               # User settings page
│   ├── page.tsx                # Landing page (Dashboard)
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout (Auth provider, Toaster, Fonts)
│   ├── error.tsx               # Error boundary
│   └── favicon.ico             # Favicon
├── components/                 # React Components
│   ├── ui/                     # Reusable UI atoms (Button, Input, Dialog, Select, etc.)
│   ├── auth-provider.tsx       # Client-side auth provider
│   ├── comment-section.tsx     # Comments with threading
│   ├── confirm-dialog.tsx      # Confirmation dialogs
│   ├── feed-filters.tsx        # Feed filtering UI
│   ├── feed-list.tsx           # Displays list of predictions
│   ├── home-client.tsx         # Client component for home page
│   ├── markdown-content.tsx    # Markdown rendering
│   ├── my-feed-list.tsx        # User's prediction list
│   ├── navbar.tsx              # Main navigation
│   ├── pagination-controls.tsx # Pagination UI
│   ├── prediction-card.tsx     # Prediction card with voting
│   ├── prediction-modal.tsx    # Core feature: Modal to submit team predictions
│   ├── region-column.tsx       # Column view for teams in a specific region
│   ├── report-modal.tsx        # Report content modal
│   ├── special-event-cta.tsx   # Special event call-to-action
│   ├── team-card.tsx           # Team card
│   ├── teaser-card.tsx         # Teaser card for locked teams
│   ├── featured-team-card.tsx  # Featured team card
│   └── ui/                     # Additional UI components (Checkbox, Popover, etc.)
├── drizzle/                    # Database Migrations & Meta
├── lib/                        # Core Utilities & Configuration
│   ├── db.ts                   # Database connection (LibSQL)
│   ├── schema.ts               # Drizzle Schema definitions
│   ├── teams.ts                # Static data: Team definitions & Kickoff dates
│   ├── vct-utils.ts            # Logic for team unlocking schedules
│   ├── utils.ts                # Utility functions
│   ├── storage.ts              # Local storage utilities
│   ├── errors.ts               # Custom error classes
│   ├── data/                   # JSON data (transactions.json)
│   └── data/                   # Additional JSON files (data.json, data_cleaned.json, original_data.json)
├── public/                     # Static assets (Logos, images, SVGs)
├── scripts/                    # Utility scripts
│   ├── apply-migration.js      # Apply migrations
│   ├── backup-predictions.ts   # Backup predictions
│   ├── check-env.ts            # Check environment variables
│   ├── check-slug.ts           # Check slugs
│   ├── create-tester.ts        # Create test user
│   ├── fix_data.py             # Python script for data fixing
│   ├── init-db.js              # Initialize database
│   ├── inspect-db.js           # Inspect database
│   ├── port-data.ts            # Port data
│   ├── seed-roster.js          # Seed roster data
│   ├── seed-transactions.ts    # Seed transactions
│   ├── send-notifications.ts   # Send notifications
│   └── backfill-slugs.ts       # Backfill slugs
├── auth.ts                     # NextAuth configuration
└── ...config files             # (next.config.ts, drizzle.config.ts, tailwind.config.ts, tsconfig.json, etc.)
```

## Key Modules & Features

### 1. Database Schema (`lib/schema.ts`)
The application uses SQLite with the following key tables:
*   **Auth:** `user`, `account`, `session`, `verificationToken`, `otp_request` (rate limiting), `email_change_request` (Standard NextAuth with extensions).
*   **Core:**
    *   `prediction`: Stores user thoughts, placements (kickoff, stages, masters, champions), roster move predictions, vote score, comment count, slug for sharing.
    *   `comment`: Threaded comments on predictions with voting.
    *   `vote`: Upvotes/downvotes for predictions and comments.
    *   `team`: Cached team data with roster and transactions.
*   **Notifications:**
    *   `team_notification` / `region_notification`: User subscriptions.
    *   `email_outbox`: Queue for sending transactional emails via Cron.
*   **Rosters:** `player`, `team_transaction` (Historical roster changes).

### 2. Authentication (`auth.ts`)
*   **Provider:** Passwordless Email (Magic Links) via Resend with custom Valorant-themed templates.
*   **Rate Limiting:** 100 OTP requests per hour per email to prevent abuse.
*   **Guest Mode:** Users can submit predictions as "Guest" (stored with cookies/local storage logic in `actions.ts`), or sign in to save permanently and access additional features like commenting and voting.
*   **Email Changes:** Secure email change flow with tokens.
*   **Onboarding:** New users are redirected to set a username.

### 3. Unlocking Logic (`lib/vct-utils.ts`)
Teams are "locked" until a specific date relative to their region's kickoff.
*   **Logic:** `getUnlockStatus(team)` calculates if a team is open for prediction based on `KICKOFF_DATES` in `lib/teams.ts`.
*   **UI:** Locked teams show a lock icon and teaser card; unlocked teams open the `PredictionModal`.

### 4. Predictions (`components/prediction-modal.tsx`)
*   Users can predict placements (Kickoff, Stage 1/2, Masters 1/2, Champions) and write a "Season Thought", suggest roster moves.
*   Predictions can be public (shared on feed) or private (personal).
*   Data is submitted via Server Actions (`submitPrediction` in `app/actions.ts`).
*   Public predictions get a slug for sharing and can be voted on and commented on.

### 5. Feed & Social Features
*   **Public Feed:** Browse public predictions with filtering by team, region, time, sorting by votes/comments.
*   **Voting:** Upvote/downvote predictions and comments.
*   **Comments:** Threaded comments on predictions.
*   **Pagination:** Efficient pagination for large feeds.
*   **Individual Posts:** Dedicated pages for predictions with full content and comments.

### 6. Rosters (`app/rosters/`)
*   View current and historical team rosters.
*   Track player transactions and changes over time.
*   Data sourced from JSON files and database.

### 7. Notifications (`app/api/cron/notify`)
*   A Cron job runs to check for newly unlocked teams.
*   It queues emails in `email_outbox` for subscribed users.
*   It processes the outbox to send emails via Resend API.

### 8. User Settings (`app/settings/`)
*   Change username, email, manage subscriptions.

## Development Workflow

### Database
*   **Generate Migrations:** `npx drizzle-kit generate`
*   **Apply Migrations (Local):** `npx drizzle-kit push` or `node scripts/apply-migration.js`
*   **Seed Data:** `npx tsx scripts/seed-transactions.ts`, `node scripts/seed-roster.js`
*   **Backup/Restore:** `npx tsx scripts/backup-predictions.ts`

### Running Locally
1.  Setup `.env.local` (Database URL, Auth Secret, Resend API Key).
2.  `npm install`
3.  `npm run dev` -> http://localhost:3000

## Design System
*   **Theme:** Dark mode by default (`globals.css`), Valorant-inspired colors.
*   **Colors:** Valorant-inspired (Red/Coral accent `#fd5360`, Dark backgrounds `#0f1923`).
*   **Font:** Geist Sans / Mono.
*   **Icons:** Lucide React.
