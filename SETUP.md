# SaaS Starter — Complete Setup Guide

A production-ready SaaS template with auth, database, and UI pre-wired. Follow every section in order on a fresh clone.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Environment Variables](#3-environment-variables)
4. [Clerk — Auth Setup](#4-clerk--auth-setup)
5. [Supabase — Database Setup](#5-supabase--database-setup)
6. [Database Migration](#6-database-migration)
7. [Local Webhook Testing](#7-local-webhook-testing)
8. [Start the Dev Server](#8-start-the-dev-server)
9. [Verify Everything Works](#9-verify-everything-works)
10. [Project Structure](#10-project-structure)
11. [App Routes](#11-app-routes)
12. [How Key Features Work](#12-how-key-features-work)
13. [Theme System](#13-theme-system)
14. [Customising for Your Project](#14-customising-for-your-project)
15. [Adding Features](#15-adding-features)
16. [Deployment](#16-deployment)
17. [Tech Stack Reference](#17-tech-stack-reference)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Prerequisites

Make sure the following are installed before you begin:

| Tool | Version | Check |
|---|---|---|
| Node.js | ≥ 20 | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Git | any recent | `git --version` |
| Supabase CLI | ≥ 1.x | `supabase --version` |

You also need free accounts at:
- [clerk.com](https://clerk.com) — auth provider
- [supabase.com](https://supabase.com) — PostgreSQL database
- [ngrok.com](https://ngrok.com) — tunnel for local webhook testing (free tier is fine)

---

## 2. Clone & Install

```bash
git clone <your-repo-url> my-saas-app
cd my-saas-app
npm install
```

---

## 3. Environment Variables

Copy the example file and fill in each value:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored — **never commit it**. The full list of variables:

```env
# ── App ────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=My SaaS App         # Shown in the browser tab and UI
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Change to your domain in production

# ── Clerk (Auth) ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# ── Supabase (Database) ────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Server-side only — never expose to client
```

> **Security rule:** Variables prefixed `NEXT_PUBLIC_` are embedded in the client-side JS bundle. Never put secrets there. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intentionally public — Supabase Row Level Security (RLS) protects your data.

---

## 4. Clerk — Auth Setup

### 4.1 Create a Clerk application

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application**
2. Choose your sign-in options (Email, Google, GitHub, etc.)
3. Open **API Keys** in the left sidebar
4. Copy **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Copy **Secret Key** → `CLERK_SECRET_KEY`

### 4.2 Configure redirect URLs

In Clerk dashboard → **Paths**:

| Setting | Value |
|---|---|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| After sign-in | `/dashboard` |
| After sign-up | `/dashboard` |

### 4.3 Create a webhook endpoint

Clerk fires events whenever a user is created, updated, or deleted. The app listens at `/api/webhooks/clerk` and syncs the data to Supabase.

1. In Clerk dashboard → **Webhooks** → **Add Endpoint**
2. Set the URL (see [Section 7](#7-local-webhook-testing) for local dev):
   - **Local:** `https://<your-ngrok-id>.ngrok-free.app/api/webhooks/clerk`
   - **Production:** `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Click **Create** → copy the **Signing Secret** → `CLERK_WEBHOOK_SIGNING_SECRET`

---

## 5. Supabase — Database Setup

### 5.1 Create a project

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a region close to your users
3. Set a strong database password and save it somewhere safe

### 5.2 Copy your credentials

In the Supabase dashboard → **Project Settings** → **API**:

| Value | Variable |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` secret key | `SUPABASE_SERVICE_ROLE_KEY` |

> **Warning:** The `service_role` key bypasses all Row Level Security policies. It is only used server-side in the Clerk webhook handler. Never expose it in client code.

---

## 6. Database Migration

The first migration creates the `profiles` table, RLS policies, indexes, and an `updated_at` trigger.

**Option A — Supabase Dashboard (easiest)**

1. Open your project → **SQL Editor**
2. Paste the contents of `supabase/migrations/0001_create_profiles.sql`
3. Click **Run**

**Option B — Supabase CLI**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### What the migration creates

```sql
-- profiles table (mirrors Clerk user data)
public.profiles (
  id           uuid PRIMARY KEY,
  clerk_id     text UNIQUE NOT NULL,   -- Clerk user ID, e.g. user_2abc...
  email        text UNIQUE NOT NULL,
  first_name   text,
  last_name    text,
  avatar_url   text,
  created_at   timestamptz,
  updated_at   timestamptz,            -- auto-updated via trigger
  deleted_at   timestamptz             -- soft delete
)
```

**RLS policies:**
- `Users can view own profile` — `SELECT` where `clerk_id = JWT sub`
- `Users can update own profile` — `UPDATE` where `clerk_id = JWT sub`
- The service-role key (used by the webhook) bypasses RLS automatically

**Generating TypeScript types** after schema changes:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
```

---

## 7. Local Webhook Testing

Clerk needs a public HTTPS URL to deliver webhook events. During local development, use [ngrok](https://ngrok.com) to create a tunnel:

```bash
# Install ngrok if you haven't
brew install ngrok   # macOS
# or: npm install -g ngrok

ngrok http 3000
```

ngrok prints a URL like `https://abc123.ngrok-free.app`. Use that as your Clerk webhook endpoint URL (see [Section 4.3](#43-create-a-webhook-endpoint)).

> **Tip:** Free ngrok URLs change every time you restart ngrok. Either update your Clerk webhook endpoint each time, or sign up for a free ngrok account to get a stable subdomain.

---

## 8. Start the Dev Server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Available scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js development server with hot reload |
| `npm run build` | Build for production (runs type-check + lint + compile) |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

---

## 9. Verify Everything Works

Work through this checklist after setup:

- [ ] `http://localhost:3000` loads the landing page
- [ ] Click **Get Started** → sign-up flow works end-to-end
- [ ] After sign-up you are redirected to `/dashboard`
- [ ] Open Supabase dashboard → **Table Editor** → `profiles` — confirm a row was inserted by the webhook
- [ ] Sign out and sign back in → lands on `/dashboard`
- [ ] Toggle the theme icon in the header — light / dark / system all apply correctly
- [ ] `/profile` page loads the Clerk profile component
- [ ] `/settings` page shows the Notifications and Appearance tabs

---

## 10. Project Structure

```
saas-starter/
├── app/
│   ├── layout.tsx                  # Root layout: ClerkProvider, ThemeProvider, fonts
│   ├── globals.css                 # Tailwind imports + CSS variable themes
│   ├── (auth)/                     # Auth route group (no sidebar)
│   │   ├── layout.tsx              # Centred, full-height layout
│   │   ├── sign-in/[[...sign-in]]/ # Clerk <SignIn /> component
│   │   └── sign-up/[[...sign-up]]/ # Clerk <SignUp /> component
│   ├── (dashboard)/                # Protected route group (with sidebar)
│   │   ├── layout.tsx              # SidebarProvider + AppSidebar + DashboardHeader
│   │   ├── dashboard/page.tsx      # Home dashboard with stat cards
│   │   ├── profile/[[...profile]]/ # Clerk <UserProfile /> component
│   │   └── settings/page.tsx       # Notifications + Appearance tabs
│   ├── (marketing)/                # Public route group (with nav bar)
│   │   ├── layout.tsx              # MarketingHeader wrapper
│   │   └── page.tsx                # Landing page (hero + feature cards)
│   └── api/
│       └── webhooks/clerk/route.ts # POST handler for Clerk user events → Supabase sync
│
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx         # Sidebar shell (logo, nav, user footer)
│   │   ├── sidebar-nav.tsx         # navItems array + active-state link list
│   │   ├── dashboard-header.tsx    # Breadcrumb + ThemeToggle + UserButton
│   │   └── marketing-header.tsx    # Logo + ThemeToggle + Sign In / Get Started
│   ├── shared/
│   │   ├── theme-provider.tsx      # next-themes ThemeProvider wrapper
│   │   ├── theme-toggle.tsx        # Light / Dark / System dropdown button
│   │   ├── logo.tsx                # App name / logo link
│   │   └── loading-spinner.tsx     # Generic loading indicator
│   └── ui/                         # Shadcn/UI primitives (button, card, dialog, …)
│
├── hooks/
│   ├── use-supabase.ts             # Returns a memoised Supabase browser client
│   └── use-mobile.ts               # Returns true when viewport < md breakpoint
│
├── lib/
│   ├── constants.ts                # APP_NAME, APP_URL, ROUTES object
│   ├── utils.ts                    # cn() — Tailwind class merge helper
│   └── supabase/
│       ├── client.ts               # Browser client (anon key, RLS enforced)
│       └── server.ts               # Server client (anon key) + Admin client (service key)
│
├── types/
│   ├── index.ts                    # Shared TypeScript types
│   └── database.types.ts           # Auto-generated Supabase table types
│
├── supabase/
│   └── migrations/
│       └── 0001_create_profiles.sql
│
├── proxy.ts                        # Next.js proxy / rewrite configuration
├── SETUP.md                        # This file
├── CLAUDE.md                       # AI agent role guidelines
└── .env.example                    # Template for .env.local
```

---

## 11. App Routes

| Route | Access | What's there |
|---|---|---|
| `/` | Public | Landing page — hero, feature cards, CTA buttons |
| `/sign-in` | Public | Clerk sign-in flow |
| `/sign-up` | Public | Clerk sign-up flow |
| `/dashboard` | Auth required | Welcome card + database/profile status cards |
| `/profile` | Auth required | Clerk UserProfile (name, email, password, MFA) |
| `/settings` | Auth required | Notifications toggles + Appearance info |
| `/api/webhooks/clerk` | Clerk only | Receives user events, syncs to Supabase |

Auth protection is applied at the Next.js middleware level via Clerk. Unauthenticated requests to dashboard routes are redirected to `/sign-in` automatically.

---

## 12. How Key Features Work

### Auth flow (Clerk + Next.js middleware)

```
Request → Clerk middleware (checks session cookie)
  ├── Signed in  → render the route
  └── Not signed in → redirect to /sign-in
```

- The middleware config is in `middleware.ts` (or the Next.js 16 equivalent). Clerk handles everything — session cookies, token refresh, MFA.
- Inside Server Components use `currentUser()` or `auth()` from `@clerk/nextjs/server`.
- Inside Client Components use `useUser()` or `useAuth()` from `@clerk/nextjs`.

### User sync flow (Clerk → Supabase)

```
User signs up / updates profile in Clerk
  → Clerk fires webhook POST to /api/webhooks/clerk
    → Signature verified with svix
      → Supabase Admin client upserts profiles row
```

The `profiles` table is the source of truth for user data inside your own database. Always read user data from Supabase in your business logic — not from Clerk directly — so you can join it with your other tables.

### Supabase clients — which to use when

| Client | File | Key | Respects RLS | When to use |
|---|---|---|---|---|
| Browser client | `lib/supabase/client.ts` | anon | Yes | Client Components, custom hooks |
| Server client | `lib/supabase/server.ts` → `createClient()` | anon | Yes | Server Components, Server Actions |
| Admin client | `lib/supabase/server.ts` → `createAdminClient()` | service_role | No (bypasses all) | Webhook handler, admin-only ops |

The `useSupabase()` hook (`hooks/use-supabase.ts`) returns a memoised browser client for use in Client Components.

### Row Level Security (RLS)

Every Supabase table has RLS enabled. The JWT issued by Clerk contains the user's `clerk_id` in the `sub` claim. RLS policies use `auth.jwt() ->> 'sub'` to filter rows. This means:

- A user can only ever read/write their own rows — even if your app code has a bug
- The admin client (service_role) bypasses RLS — use it only in trusted server contexts

---

## 13. Theme System

The template ships with **light**, **dark**, and **system** (follows OS preference) themes — all pre-wired.

### How it works

| Layer | File | Role |
|---|---|---|
| CSS variables | `app/globals.css` | Defines all colour tokens for `:root` (light) and `.dark` |
| Provider | `components/shared/theme-provider.tsx` | Wraps `next-themes` `ThemeProvider` |
| Root layout | `app/layout.tsx` | Mounts provider with `defaultTheme="system" enableSystem` |
| Toggle button | `components/shared/theme-toggle.tsx` | Dropdown: Light / Dark / System |
| Dashboard header | `components/layout/dashboard-header.tsx` | Renders `<ThemeToggle />` |
| Marketing header | `components/layout/marketing-header.tsx` | Renders `<ThemeToggle />` |

### Changing the default theme

In `app/layout.tsx`, change the `defaultTheme` prop:

```tsx
// Always start in light mode
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>

// Always start in dark mode
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>

// Follow OS preference (default)
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

### Customising colours

Edit the `oklch` values in `app/globals.css`:

```css
:root {
  /* Light mode */
  --background: oklch(1 0 0);          /* white */
  --foreground: oklch(0.145 0 0);      /* near-black */
  --primary: oklch(0.205 0 0);         /* dark grey */
  /* … */
}

.dark {
  /* Dark mode */
  --background: oklch(0.145 0 0);      /* near-black */
  --foreground: oklch(0.985 0 0);      /* near-white */
  --primary: oklch(0.922 0 0);         /* light grey */
  /* … */
}
```

Always use Tailwind semantic tokens in components (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, etc.) so that both themes render correctly without any extra code.

---

## 14. Customising for Your Project

| What to change | Where |
|---|---|
| App name | `NEXT_PUBLIC_APP_NAME` in `.env.local` |
| App URL | `NEXT_PUBLIC_APP_URL` in `.env.local` |
| Logo / wordmark | `components/shared/logo.tsx` |
| Sidebar nav items | `components/layout/sidebar-nav.tsx` → `navItems` array |
| Route constants | `lib/constants.ts` → `ROUTES` object |
| Landing page copy | `app/(marketing)/page.tsx` |
| Dashboard home | `app/(dashboard)/dashboard/page.tsx` |
| Theme colours (light) | `:root` block in `app/globals.css` |
| Theme colours (dark) | `.dark` block in `app/globals.css` |
| Default theme | `defaultTheme` prop on `<ThemeProvider>` in `app/layout.tsx` |
| Border radius scale | `--radius` in `app/globals.css` |
| New database tables | Add `.sql` files to `supabase/migrations/` |
| TypeScript DB types | `npx supabase gen types typescript --project-id <id> > types/database.types.ts` |
| Shared TypeScript types | `types/index.ts` |

---

## 15. Adding Features

### Add a new dashboard page

1. Create `app/(dashboard)/your-page/page.tsx` — it automatically gets the sidebar layout
2. Add a nav item in `components/layout/sidebar-nav.tsx`:

```ts
const navItems = [
  { title: "Dashboard",  href: ROUTES.dashboard,  icon: LayoutDashboard },
  { title: "Your Page",  href: "/your-page",       icon: YourIcon },       // add this
  { title: "Profile",    href: ROUTES.profile,     icon: User },
  { title: "Settings",   href: ROUTES.settings,    icon: Settings },
];
```

3. Add the route to `ROUTES` in `lib/constants.ts`:

```ts
export const ROUTES = {
  // ...existing routes
  yourPage: "/your-page",
} as const;
```

### Add a new database table

1. Create a migration file: `supabase/migrations/0002_create_your_table.sql`

```sql
create table public.your_table (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  -- your columns here
  created_at timestamptz not null default now()
);

alter table public.your_table enable row level security;

create policy "Users can manage own rows"
  on public.your_table
  for all
  using (
    user_id = (
      select id from public.profiles
      where clerk_id = (auth.jwt() ->> 'sub')
    )
  );
```

2. Run the migration (Supabase dashboard SQL Editor or `supabase db push`)
3. Regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
```

### Fetch data in a Server Component

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function YourPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("your_table").select("*");

  if (error) throw error;  // handled by Next.js error boundary
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### Fetch data in a Client Component

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";

export function YourComponent() {
  const supabase = useSupabase();
  const [data, setData] = useState([]);

  useEffect(() => {
    supabase.from("your_table").select("*").then(({ data }) => {
      if (data) setData(data);
    });
  }, [supabase]);

  return <div>{/* render data */}</div>;
}
```

### Add a new API route

Create `app/api/your-endpoint/route.ts`:

```ts
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase.from("your_table").select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### Add a form with validation

The template includes `react-hook-form` and `zod`:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormData = z.infer<typeof schema>;

export function YourForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <p>{errors.name.message}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 16. Deployment

### Pre-deployment checklist

- [ ] All environment variables set in the hosting platform
- [ ] Database migrations applied to the production Supabase project
- [ ] Clerk webhook endpoint updated to the production URL
- [ ] `npm run build` passes with zero errors locally

### Environment variables for production

Set all variables from `.env.example` in your hosting platform's dashboard. Key differences from local:

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production Clerk key (starts `pk_live_`) |
| `CLERK_SECRET_KEY` | Production Clerk key (starts `sk_live_`) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Secret from the production webhook endpoint |
| Supabase keys | From your production Supabase project |

### Deploy to Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Follow the prompts, then add your environment variables in the Vercel dashboard → **Settings** → **Environment Variables**.

### Deploy to other platforms

The app is a standard Next.js 16 App Router application. Any platform that supports Next.js will work:
- **Fly.io** — use `Dockerfile` with `npm run build && npm start`
- **Railway** — connect your repo, set env vars, deploy
- **AWS / GCP / Azure** — use the Next.js standalone output (`output: "standalone"` in `next.config.ts`)

---

## 17. Tech Stack Reference

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.2 | Framework — App Router, Server Components, API routes |
| [React](https://react.dev) | 19.2.4 | UI rendering |
| [TypeScript](https://typescriptlang.org) | ^5 | Static types |
| [Clerk](https://clerk.com) | ^7 | Auth — signup, signin, MFA, profile, webhooks |
| [Supabase](https://supabase.com) | ^2 | PostgreSQL database with RLS |
| [@supabase/ssr](https://github.com/supabase/ssr) | ^0.10 | Supabase client for SSR environments |
| [Shadcn/UI](https://ui.shadcn.com) | ^4 | Accessible component primitives |
| [Tailwind CSS](https://tailwindcss.com) | ^4 | Utility-first CSS |
| [next-themes](https://github.com/pacocoursey/next-themes) | ^0.4 | Light / dark / system theme switching |
| [Lucide React](https://lucide.dev) | ^1.7 | Icon library |
| [React Hook Form](https://react-hook-form.com) | ^7 | Form state management |
| [Zod](https://zod.dev) | ^4 | Schema validation |
| [Sonner](https://sonner.emilkowal.ski) | ^2 | Toast notifications |
| [svix](https://svix.com) | ^1.90 | Webhook signature verification |
| [tw-animate-css](https://github.com/jamiebuilds/tailwindcss-animate) | ^1.4 | Tailwind animation utilities |

---

## 18. Troubleshooting

### "Missing CLERK_WEBHOOK_SIGNING_SECRET" in the console

The webhook handler returns a 500 if this env var is missing. Make sure it is set in `.env.local` and that you restarted the dev server after adding it.

### Profile row not created after sign-up

1. Check that your ngrok tunnel is running and the URL matches the Clerk webhook endpoint exactly
2. In the Clerk dashboard → **Webhooks** → click your endpoint → **Recent Deliveries** — look for failed attempts and their error messages
3. Check the terminal running `npm run dev` for stack traces from the webhook handler

### Supabase RLS blocking your queries

If you get empty data or permission errors:
- In a Server Component, make sure you are using `createClient()` from `lib/supabase/server.ts` (not the browser client)
- Check that the Clerk JWT `sub` claim matches the `clerk_id` stored in the row
- Temporarily test with the admin client to confirm the data exists, then fix the RLS policy

### TypeScript errors after schema changes

Regenerate the types file after every migration:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
```

### `npm run build` fails

Run these in order to isolate the issue:

```bash
npx tsc --noEmit   # type errors
npm run lint       # lint errors
npm run build      # full build
```

Fix type and lint errors before pushing to production.

### Theme flickers on page load

This is the "flash of unstyled content" problem with SSR + `next-themes`. The `suppressHydrationWarning` attribute on `<html>` in `app/layout.tsx` suppresses the React hydration warning. If you still see a flicker, ensure you have not added any server-side conditional class names based on theme.
