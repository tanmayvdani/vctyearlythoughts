# VCT Yearly Thoughts

A Next.js application designed as a time capsule for Valorant Esports fans. Users can record predictions and thoughts on VCT teams leading up to the 2026 season.

## Architecture

*   **Framework:** Next.js 16 (App Router)
*   **Database:** SQLite (LibSQL/Turso) via Drizzle ORM
*   **Auth:** NextAuth.js (Resend & Credentials)
*   **Styling:** Tailwind CSS, Radix UI

## Getting Started

1.  Navigate to the project directory:
    ```bash
    cd vctyearlythoughts
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables in `.env.local`:
    *   `AUTH_SECRET`
    *   `RESEND_API_KEY`
    *   `DATABASE_URL`
    *   `DATABASE_AUTH_TOKEN`

4.  Run the development server:
    ```bash
    npm run dev
    ```

## Deployment

The application is optimized for deployment on Vercel. Ensure environment variables are correctly configured in the project settings.
