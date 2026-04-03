@AGENTS.md

# Role-Specific Agent Guidelines

Read the section for your role before starting any task. All roles must also follow the shared rules below.

---

## Shared Rules (All Roles)

- **Read before editing.** Never propose changes to code you have not read.
- **Minimal footprint.** Only change what is required. No speculative refactors, no extra comments, no new files unless strictly necessary.
- **No security anti-patterns.** Never introduce SQL injection, XSS, command injection, or any OWASP Top 10 vulnerability.
- **Follow the existing stack.** Next.js 16 App Router · TypeScript · Clerk (auth) · Supabase (DB) · Shadcn/UI · Tailwind CSS.
- **Theme awareness.** The app supports light, dark, and system themes. Never hard-code colours — use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.) so both themes render correctly.
- **Environment variables.** Secrets live in `.env.local` only. Never commit them. Reference the `.env.example` for the full list.

---

## UI / UX Designer

**Goal:** Build and refine the visual layer — layouts, components, animations, accessibility.

### Rules
- Use Shadcn/UI primitives first; only create custom components when Shadcn cannot meet the requirement.
- All interactive elements must be keyboard-accessible and meet WCAG AA contrast in **both** light and dark themes.
- Colour overrides go in the `:root` (light) and `.dark` blocks in `app/globals.css` using `oklch` values — never inline styles.
- Default theme is `"system"`. Change `defaultTheme` on `<ThemeProvider>` in `app/layout.tsx` only if a product decision requires it.
- Spacing, typography, and radius use Tailwind utilities tied to the CSS-variable scale already defined in `globals.css`.
- Animations use `tw-animate-css` classes; keep durations ≤ 300 ms for micro-interactions.
- Responsive breakpoints: design mobile-first, test at `sm` (640 px), `md` (768 px), `lg` (1024 px), `xl` (1280 px).

### Key files
| Area | File |
|---|---|
| Global styles / theme tokens | `app/globals.css` |
| Theme provider | `components/shared/theme-provider.tsx` |
| Theme toggle button | `components/shared/theme-toggle.tsx` |
| Logo | `components/shared/logo.tsx` |
| Marketing header | `components/layout/marketing-header.tsx` |
| Dashboard header | `components/layout/dashboard-header.tsx` |
| Sidebar | `components/layout/app-sidebar.tsx` |
| Shadcn components | `components/ui/` |

---

## Backend Engineer

**Goal:** Implement API routes, database logic, webhooks, and server-side features.

### Rules
- All database access uses the Supabase client from `lib/supabase/`. Use the **service-role** client only in server contexts (API routes, Server Actions); use the **anon** client on the client side.
- RLS is always on. Every new table needs RLS policies in a new migration file under `supabase/migrations/`.
- Validate and sanitise all external input at the API boundary. Use Zod for request schemas.
- Clerk webhook handler is at `app/api/webhooks/clerk/route.ts` — verify the `svix` signature before processing.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `CLERK_SECRET_KEY` to the client bundle.
- Keep API routes thin: move business logic into `lib/` modules so it can be tested independently.
- Regenerate database types after schema changes: `npx supabase gen types typescript --project-id <id> > types/database.types.ts`.

### Key files
| Area | File |
|---|---|
| Supabase clients | `lib/supabase/` |
| DB types | `types/database.types.ts` |
| Migrations | `supabase/migrations/` |
| Clerk webhook | `app/api/webhooks/clerk/route.ts` |
| App constants / routes | `lib/constants.ts` |

---

## Testing Engineer

**Goal:** Ensure correctness through unit, integration, and end-to-end tests.

### Rules
- Unit-test pure functions in `lib/` with Jest / Vitest; keep tests colocated (`lib/foo.test.ts`).
- Integration tests must hit a real Supabase instance (local via `supabase start`), not mocks — mocked DB tests have historically masked migration failures.
- E2E tests (Playwright) cover critical user journeys: sign-up, sign-in, dashboard access, profile update.
- Seed data lives in `supabase/seed.sql`; reset with `supabase db reset` before each E2E run.
- Never skip type checks: run `tsc --noEmit` as part of CI.
- Test both light and dark themes in visual regression tests (toggle the `dark` class on `<html>`).

### Key files
| Area | File |
|---|---|
| DB seed | `supabase/seed.sql` |
| Types | `types/` |
| Environment (test) | `.env.test` (not committed) |

---

## System Engineer

**Goal:** Manage infrastructure, environment configuration, and observability.

### Rules
- All infrastructure is declared as code. No manual console changes without a corresponding IaC update.
- Environment tiers: `development` (`.env.local`) · `staging` · `production`. Secrets are injected at deploy time — never stored in the repo.
- Supabase migrations run automatically in CI before deployment; never apply raw SQL to production manually.
- Monitor edge-function latency and DB query times. Set alerts on p99 > 2 s.
- Proxy configuration lives in `proxy.ts` — understand it before touching network or routing rules.
- Log structured JSON; never log PII or secrets.

### Key files
| Area | File |
|---|---|
| Proxy / rewrites | `proxy.ts` |
| DB migrations | `supabase/migrations/` |
| Environment template | `.env.example` |

---

## Deployment Engineer

**Goal:** Package, ship, and roll back application releases safely.

### Rules
- Build command: `npm run build`. Fix all TypeScript and lint errors before shipping — a red build never goes to production.
- The app is a Next.js 16 App Router project; deploy to a platform that supports the Next.js runtime (Vercel, Fly.io with a custom Dockerfile, etc.).
- Environment variables must be set in the hosting platform before deployment. Refer to `.env.example` for the full list.
- Database migrations (`supabase/migrations/`) must be applied **before** the new app version goes live.
- Use blue-green or canary deployments for production; never deploy directly over the live instance without a rollback plan.
- Verify that `NEXT_PUBLIC_*` variables are correct for the target environment — they are baked into the client bundle at build time.
- Health-check endpoint: add `/api/health` if it does not exist before setting up uptime monitors.

### Key files
| Area | File |
|---|---|
| Build config | `package.json` (scripts) |
| Next.js config | `next.config.ts` |
| Environment template | `.env.example` |
| Migrations | `supabase/migrations/` |

---

## CI / CD Engineer

**Goal:** Design and maintain the automated pipeline from commit to production.

### Rules
- Pipeline stages (in order): **install** → **type-check** (`tsc --noEmit`) → **lint** → **test** → **build** → **migrate** → **deploy**.
- Cache `node_modules` and `.next/cache` between runs keyed on `package-lock.json`.
- Secrets are injected as CI environment variables — never hard-coded in pipeline YAML.
- Pull-request checks must all pass before merge; block force-pushes to `main`.
- Run Supabase migrations in the pipeline using the Supabase CLI: `supabase db push` (staging) before promoting to production.
- Publish build artefacts (e.g. `.next/`) as pipeline artefacts for traceability.
- Notify on failure via your team's preferred channel (Slack, email, etc.) — silence is not acceptable.
- Keep pipeline files in `.github/workflows/` (GitHub Actions) or the equivalent for your CI provider.

### Key files
| Area | File |
|---|---|
| Pipeline definitions | `.github/workflows/` |
| Build scripts | `package.json` |
| Environment template | `.env.example` |
| Migrations | `supabase/migrations/` |

---

## Security Engineer

**Goal:** Identify and close vulnerabilities; ensure auth, data, and secrets are handled correctly.

### Rules
- Auth is delegated entirely to Clerk. Never build custom session management.
- All API routes that mutate data must verify the Clerk session. Use `auth()` from `@clerk/nextjs/server`.
- Supabase RLS is the last line of defence for data access — audit it on every schema change.
- Run `npm audit` in CI; block on high/critical findings.
- CSP headers must be set in `next.config.ts` (`headers()` export).
- Never log or return raw database errors to the client — map them to generic messages.
- Rotate secrets immediately if they are accidentally committed. Invalidate and replace; do not just delete the commit.
- Validate all webhook payloads (Clerk uses `svix` signatures — already wired in the webhook route).

### Key files
| Area | File |
|---|---|
| Clerk webhook (signature verify) | `app/api/webhooks/clerk/route.ts` |
| Supabase RLS policies | `supabase/migrations/` |
| Next.js config (headers / CSP) | `next.config.ts` |
| Auth helpers | `lib/supabase/` |
