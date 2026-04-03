# Badminton Coach Income Tracker

A clean, modern web app for a badminton coach to track coaching income session by session.

## Stack

- **Next.js 15** + TypeScript + App Router
- **Tailwind CSS v4** + Shadcn/UI
- **Framer Motion** for animations
- **Supabase** (PostgreSQL) for data storage
- **Vercel** for deployment

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file (see `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
   ```

3. Run the SQL migration in your Supabase SQL Editor:
   - File: `supabase/migrations/001_initial_schema.sql`

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Features

- Dashboard with today's earnings and monthly totals
- Quick session logging (3-4 taps on mobile)
- Student management
- Session history with filters
- Income reports (daily/monthly breakdowns)
