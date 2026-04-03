# SaaS Starter

A production-ready SaaS template built with **Next.js 16**, **Clerk**, **Supabase**, and **Shadcn/UI**. Clone it, fill in three config files, and start shipping features — not boilerplate.

---

## What's included

| Feature | Details |
|---|---|
| **Authentication** | Sign up, sign in, forgot password, MFA, profile management — all via Clerk |
| **Database** | Supabase PostgreSQL with Row Level Security. User profiles auto-synced via webhooks |
| **UI Components** | Shadcn/UI primitives + Tailwind CSS |
| **Light / Dark / System theme** | One-click toggle in every header; follows OS preference by default |
| **App Router** | Next.js 16 file-based routing with Server Components and Server Actions |
| **TypeScript** | Strict types throughout, including auto-generated Supabase DB types |
| **Form validation** | React Hook Form + Zod |
| **Toast notifications** | Sonner |
| **Webhook plumbing** | Clerk → Supabase user sync wired up and verified with svix |

---

## Quick start

> Full step-by-step instructions are in [SETUP.md](./SETUP.md). This section is the fast path.

**1. Clone and install**

```bash
git clone <your-repo-url> my-app
cd my-app
npm install
```

**2. Copy env file**

```bash
cp .env.example .env.local
```

**3. Fill in credentials**

You need accounts at [clerk.com](https://clerk.com) and [supabase.com](https://supabase.com).

```env
NEXT_PUBLIC_APP_NAME=My SaaS App
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**4. Run the database migration**

In the Supabase dashboard → SQL Editor, run `supabase/migrations/0001_create_profiles.sql`.

**5. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
├── (auth)/            # /sign-in, /sign-up  — no sidebar
├── (dashboard)/       # /dashboard, /profile, /settings  — protected, with sidebar
├── (marketing)/       # /  — public landing page
└── api/webhooks/clerk # Clerk → Supabase user sync

components/
├── layout/            # Sidebar, headers, nav
├── shared/            # Logo, ThemeProvider, ThemeToggle, LoadingSpinner
└── ui/                # Shadcn/UI primitives

lib/
├── constants.ts       # APP_NAME, APP_URL, ROUTES
├── utils.ts           # cn() class-merge helper
└── supabase/          # Browser client, server client, admin client

hooks/
├── use-supabase.ts    # Memoised Supabase browser client
└── use-mobile.ts      # Responsive breakpoint hook

supabase/migrations/   # SQL migration files
types/                 # Shared types + auto-generated DB types
```

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page — hero, features, CTA |
| `/sign-in` | Public | Clerk sign-in |
| `/sign-up` | Public | Clerk sign-up |
| `/dashboard` | Authenticated | Home dashboard |
| `/profile` | Authenticated | Clerk UserProfile (name, email, password, MFA) |
| `/settings` | Authenticated | Notifications + Appearance preferences |

---

## How auth works

Clerk middleware protects all `/dashboard`, `/profile`, and `/settings` routes. Unauthenticated visitors are redirected to `/sign-in` automatically.

When a user signs up or updates their Clerk profile, Clerk fires a webhook to `/api/webhooks/clerk`. The handler verifies the signature with svix, then upserts a row in the Supabase `profiles` table using the service-role client (which bypasses RLS). From that point forward, your app reads user data from Supabase — so you can join it with any other tables you add.

---

## Database

The `profiles` table mirrors Clerk user data:

```
id, clerk_id, email, first_name, last_name, avatar_url, created_at, updated_at, deleted_at
```

Row Level Security is enabled. Users can only read and update their own row. The `clerk_id` in each row is matched against the `sub` claim in the Clerk-issued JWT.

**Adding a new table:**

```sql
-- supabase/migrations/0002_create_your_table.sql
create table public.your_table (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.your_table enable row level security;

create policy "Users can manage own rows"
  on public.your_table for all
  using (
    user_id = (
      select id from public.profiles
      where clerk_id = (auth.jwt() ->> 'sub')
    )
  );
```

Then regenerate types:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
```

---

## Theme

Light, dark, and system themes are pre-wired via [next-themes](https://github.com/pacocoursey/next-themes). The toggle lives in both the marketing and dashboard headers.

To change the default theme, edit `app/layout.tsx`:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

To customise colours, edit the `oklch` values in `app/globals.css`:

```css
:root { /* light mode tokens */ }
.dark  { /* dark mode tokens  */ }
```

Always use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.) so both themes work without extra code.

---

## Customisation

| What | Where |
|---|---|
| App name | `NEXT_PUBLIC_APP_NAME` in `.env.local` |
| Logo | `components/shared/logo.tsx` |
| Nav items | `components/layout/sidebar-nav.tsx` → `navItems` |
| Routes | `lib/constants.ts` → `ROUTES` |
| Landing page | `app/(marketing)/page.tsx` |
| Dashboard home | `app/(dashboard)/dashboard/page.tsx` |
| Theme colours | `:root` / `.dark` in `app/globals.css` |
| Default theme | `defaultTheme` prop in `app/layout.tsx` |

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Type-check, lint, and build for production
npm run start    # Serve the production build locally
npm run lint     # Run ESLint
```

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Add all variables from `.env.example` in the Vercel dashboard → **Settings → Environment Variables**.

### Other platforms

Any platform that supports Next.js works (Fly.io, Railway, AWS, GCP). Apply database migrations before deploying a new app version, and update your Clerk webhook endpoint URL to the production domain.

See [SETUP.md § Deployment](./SETUP.md#16-deployment) for the full checklist.

---

## Tech stack

| | |
|---|---|
| [Next.js 16](https://nextjs.org) | App Router, Server Components, API routes |
| [React 19](https://react.dev) | UI |
| [TypeScript 5](https://typescriptlang.org) | Static types |
| [Clerk](https://clerk.com) | Auth — signup, signin, MFA, webhooks |
| [Supabase](https://supabase.com) | PostgreSQL + RLS |
| [Shadcn/UI](https://ui.shadcn.com) | Component primitives |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first CSS |
| [next-themes](https://github.com/pacocoursey/next-themes) | Light / dark / system theme |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Forms + validation |
| [Sonner](https://sonner.emilkowal.ski) | Toast notifications |
| [Lucide React](https://lucide.dev) | Icons |
| [svix](https://svix.com) | Webhook signature verification |

---

## Full setup guide

For Clerk webhook configuration, ngrok local testing, RLS deep-dive, adding pages/tables/API routes, CI/CD, and troubleshooting — read **[SETUP.md](./SETUP.md)**.

---

## License

MIT
