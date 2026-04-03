# CLAUDE.md - Badminton Coach Income Tracker

> **Documentation Version**: 1.0
> **Last Updated**: 2026-04-04
> **Project**: Badminton Coach Income Tracker
> **Description**: Web app for a badminton coach to track coaching income session by session
> **Stack**: Next.js 15, TypeScript, Tailwind CSS v4, Shadcn/UI, Framer Motion, Supabase

This file provides essential guidance to Claude Code when working with this repository.

## CRITICAL RULES

### PROHIBITIONS
- NEVER create new files in root directory - use proper module structure under `src/`
- NEVER create duplicate files (v2, enhanced_, new_) - extend existing files
- NEVER use `find`, `grep`, `cat`, `head`, `tail` commands - use Read, Grep, Glob tools
- NEVER use git commands with -i flag (interactive mode not supported)
- NEVER hardcode values that should be configurable
- NEVER skip searching for existing implementations before creating new files

### MANDATORY REQUIREMENTS
- COMMIT after every completed task/phase
- PUSH to GitHub after every commit: `git push origin main`
- READ FILES FIRST before editing
- SEARCH FIRST before creating new files - extend existing code when possible
- USE proper TypeScript types throughout - no `any` types

## PROJECT STRUCTURE

```
src/
  app/                    # Next.js App Router pages
    (routes)/             # Route groups
    globals.css           # Global styles + Tailwind
    layout.tsx            # Root layout
    page.tsx              # Dashboard (home)
  components/
    ui/                   # Shadcn/UI components
    (feature components)  # App-specific components
  lib/
    supabase.ts           # Supabase client
    utils.ts              # Utility functions
    types.ts              # TypeScript type definitions
supabase/
  migrations/             # SQL migration files
```

## TECH STACK DETAILS

- **Framework**: Next.js 15+ with App Router (server & client components)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + Shadcn/UI
- **Animations**: Framer Motion (required throughout - page transitions, card animations, count-up effects)
- **Database**: Supabase (PostgreSQL) - no auth, single-user app
- **Deploy target**: Vercel

## SUPABASE PATTERNS

- Use `@supabase/supabase-js` client
- Server components for initial data fetching where possible
- Client-side Supabase for all mutations (insert, update, delete)
- Show loading skeletons while data fetches
- Handle errors with Sonner toast notifications

## DESIGN SYSTEM

- **Palette**: Deep navy + electric teal + white
- **Feel**: Modern premium sports dashboard - NOT generic AI/SaaS
- **Typography**: Distinctive display font + refined body font (NOT Inter/Roboto/Arial)
- **Responsive**: Mobile-first - must feel native on phone AND polished on desktop
- **Animations**: Framer Motion everywhere - page transitions, staggered card reveals, count-up numbers, micro-interactions

## BUSINESS LOGIC

- Session types: 1-on-1 (RM 80), 1-on-2 (RM 80), Group (RM 60 flat)
- Currency: Malaysian Ringgit (RM)
- Date format: DD MMM YYYY (e.g. 04 Apr 2026)
- Payment methods: TNG, Bank Transfer
- Log session flow: max 3-4 taps on mobile

## COMMON COMMANDS

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
git push origin main # Backup to GitHub
```
