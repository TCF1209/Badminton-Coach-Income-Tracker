# Badminton Coach Income Tracker — Claude Code Project Brief

## Overview

Build a clean, modern web app for a badminton coach to track coaching income session by session. The coach currently has no tracking system and needs a simple, fast way to log sessions and view income summaries.

- **Deploy target:** Vercel
- **Stack:** Next.js 15, TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion
- **Database:** Supabase (PostgreSQL) — no auth needed, single-user app

---

## Step 1 — Environment Setup

Create a `.env.local` file in the project root with the following variables (user will fill in their own keys):

```
NEXT_PUBLIC_SUPABASE_URL=https://klndryahwbxveimcshik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__OcsNANykZkztYpaSmULcA_RjWO2mm5
```

---

## Step 2 — Database Schema

Create a `supabase/migrations/001_initial_schema.sql` file with the following SQL. The user will run this in their Supabase SQL Editor, OR set it up via Supabase CLI:

```sql
-- Students table
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- Sessions table
create table sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('1-on-1', '1-on-2', 'group')),
  student_ids uuid[] not null,
  amount numeric(10,2) not null,
  paid boolean default false,
  payment_method text check (payment_method in ('tng', 'bank')),
  notes text,
  created_at timestamptz default now()
);

-- Disable RLS (single-user app, no auth needed)
alter table students disable row level security;
alter table sessions disable row level security;
```

---

## Design Requirements

- **Aesthetic:** Modern, premium sports dashboard feel — NOT generic AI/SaaS look
- **Inspiration:** Clean bold typography, strong whitespace, feels like a premium sports brand app
- **Color palette:** Deep navy + electric teal + white
- **Do NOT use:** Inter, Roboto, Arial, purple gradients, or any generic AI aesthetic
- **Typography:** Choose a distinctive display font paired with a refined body font
- **Responsive:** Mobile-first — must feel native on phone AND polished on desktop

### Framer Motion Animations (required throughout)
- Page transitions between routes
- Cards fade/slide in on load with staggered delays
- Income total "counts up" animation on dashboard load (feels rewarding)
- Button micro-interactions on tap/click
- New session items animate in when added to the list
- Floating Action Button (FAB) subtle pulse or glow effect on mobile

---

## App Pages & Features

### `/` — Dashboard (Home)
- Large, prominent **Today's Earnings** display (e.g. RM 160)
- **This Month's Total** earnings
- Quick stats row: sessions today, sessions this month
- Recent sessions list (last 5 entries)
- Floating Action Button (FAB) — **"+ Log Session"** — always visible on mobile, fixed bottom right
- All numbers animate (count up) on page load

### `/log` — Log a Session
- Select session type (tap/click cards, not a dropdown):
  - **1-on-1** → RM 80 auto-filled
  - **1-on-2** → RM 80 auto-filled
  - **Group Class** → RM 60 auto-filled (flat fee regardless of student count)
- Select student(s) from saved list
  - For Group Class: allow multi-select (but amount stays RM 60 flat)
- Date picker (default: today)
- Payment status toggle: **Paid / Unpaid**
- Payment method selector: **TNG** or **Bank Transfer**
- Optional notes field
- Submit button — on success, animate confirmation and redirect to dashboard

### `/students` — Student Management
- List of all students
- Add new student (Name + optional phone number)
- Edit / Delete student
- Tap a student to view their session history

### `/history` — Session History
- Full list of all logged sessions, newest first
- Filter bar: by date range, session type, payment status
- Each session card shows: date, type, student(s), amount, paid status
- Swipe or tap to edit / delete a session

### `/reports` — Income Reports
- **Daily view:** select a date, see earnings for that day
- **Monthly view:** dropdown or scroll to select month
  - Total earnings
  - Breakdown by session type (1-on-1 / 1-on-2 / Group)
  - Paid vs Unpaid breakdown
  - Number of sessions
- Display as summary cards (no need for complex chart libraries)

---

## Data Model (TypeScript types)

```ts
type SessionType = '1-on-1' | '1-on-2' | 'group'
type PaymentMethod = 'tng' | 'bank'

type Student = {
  id: string
  name: string
  phone?: string
  created_at: string
}

type Session = {
  id: string
  date: string           // ISO date e.g. "2026-04-04"
  type: SessionType
  student_ids: string[]
  amount: number         // 80 or 60
  paid: boolean
  payment_method: PaymentMethod
  notes?: string
  created_at: string
}
```

---

## Supabase Integration Pattern

- Use `@supabase/supabase-js` client
- Use **server components** for initial data fetching where possible
- Use **client-side Supabase** for all mutations (insert, update, delete)
- After mutations, call `revalidatePath()` to refresh data
- Show **loading skeletons** while data is fetching
- Handle errors gracefully with toast notifications (use Shadcn/UI toast)

---

## UX Rules

- Log Session flow must be **max 3-4 taps** to complete — coach logs right after class on mobile
- All amounts displayed in **Malaysian Ringgit (RM)**
- Date format: **DD MMM YYYY** (e.g. 04 Apr 2026)
- The dashboard should feel **satisfying and motivating** — seeing income grow should feel good
- Empty states should be friendly and guide the user to add their first student / session

---

## Important Constraints

- No login / auth required — single user personal tool
- No complex charting libraries needed — use styled summary cards
- Must work on both mobile and desktop browsers
- Keep the app fast and simple — this is a personal productivity tool, not an enterprise system
