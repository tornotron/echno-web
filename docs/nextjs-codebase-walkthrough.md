# Echno-Web Codebase Walkthrough (for a Next.js newcomer)

You're an experienced programmer, so this guide stays brief and focuses on
**Next.js-specific** mental models and **how this repo is wired together**.
Read it top to bottom — each section assumes the previous one.

---

## 1. Mental model: what Next.js actually is

Next.js is a React framework that adds:

1. **A file-system router** (the `app/` directory). Folder = URL segment.
   Special filenames have meaning (see §3).
2. **A unified server + client model.** Components run on the server by default
   (React Server Components, "RSC") and can opt into the browser with
   `'use client'` at the top of the file. This is the single most important
   thing to internalize.
3. **A build/runtime layer**: `next dev` (HMR), `next build` (compile),
   `next start` (prod). Configured via [next.config.ts](../next.config.ts).

If you only remember one thing: **every file under `app/` is a server component
unless it starts with `'use client'`**.

### Server vs Client components — a practical cheat sheet

| Server Component (default)                | Client Component (`'use client'`)        |
| ----------------------------------------- | ---------------------------------------- |
| Runs on server, ships HTML (no JS for it) | Hydrates in the browser                  |
| Can `await` fetches, read DB, read env    | Can use `useState`, `useEffect`, events  |
| Cannot use `useState`, hooks, `onClick`   | Cannot directly `await` server-only code |
| Imports nothing client-only               | Cheaper to compose with server children  |

You can pass server-rendered children **into** client components as props —
that's the standard composition pattern.

In this repo, **most pages are marked `'use client'`** (search the codebase:
nearly every `page.tsx` opens with it). The team relies on TanStack Query
for data fetching from the browser, not on RSC data fetching. Treat it like
a SPA that happens to use the App Router for routing/layouts.

---

## 2. Tech stack at a glance

From [package.json](../package.json):

- **Next.js 16** + **React 19** (App Router only — no `pages/`).
- **Auth.js v5** (`next-auth@5.0.0-beta.30`) with a Keycloak (OIDC) provider —
  see [auth.ts](../auth.ts).
- **TanStack Query v5** for client-side data fetching/caching (see §5 for
  the configured global defaults).
- **Zustand v5** for ad-hoc client state (sparingly used).
- **Tailwind v4** + **shadcn/ui** + **Radix** primitives for UI.
- **Zod v4** for runtime validation; **react-hook-form** for forms.
- **TypeScript** strict; path alias `@/*` → repo root (see [tsconfig.json](../tsconfig.json)).
- **bun** is enforced (`preinstall: only-allow bun`). Use `bun install`, `bun dev`, etc.
- Backend is a separate **Spring Boot** API; Next.js proxies to it
  via [app/api/v1/[...path]/route.ts](../app/api/v1/[...path]/route.ts).

---

## 3. Next.js App Router — the special files

In any folder under `app/`:

| File               | Role                                                                |
| ------------------ | ------------------------------------------------------------------- |
| `page.tsx`         | The route's UI. The folder path becomes the URL.                    |
| `layout.tsx`       | Wraps `page.tsx` and any nested routes. Persists across navigation. |
| `loading.tsx`      | Suspense fallback while the segment loads.                          |
| `error.tsx`        | Error boundary for the segment (must be a client component).        |
| `not-found.tsx`    | Renders when `notFound()` is called or no route matches.            |
| `global-error.tsx` | Top-level error fallback (replaces the root layout on crash).       |
| `route.ts`         | An HTTP endpoint (export `GET`, `POST`, etc.) instead of UI.        |
| `[id]`             | Dynamic segment. `params.id` is available in the page.              |
| `[...path]`        | Catch-all dynamic segment.                                          |
| `(group)`          | Route group — organizes folders without affecting the URL.          |

This repo uses all of the above. Concrete examples to look at:

- Root layout: [app/layout.tsx](../app/layout.tsx)
- Root page (marketing): [app/page.tsx](../app/page.tsx)
- Dashboard layout (auth-gated shell): [app/users/dashboard/layout.tsx](../app/users/dashboard/layout.tsx)
- Dynamic project route: [app/users/dashboard/portfolio/projects/[id]/page.tsx](../app/users/dashboard/portfolio/projects/%5Bid%5D/page.tsx)
- Catch-all API proxy: [app/api/v1/[...path]/route.ts](../app/api/v1/%5B...path%5D/route.ts)
- Global error/not-found: [app/error.tsx](../app/error.tsx), [app/not-found.tsx](../app/not-found.tsx)

### Middleware (here called "proxy")

Next.js looks for a `middleware.ts` (or, with custom config, another file) at
the project root. This repo names it [proxy.ts](../proxy.ts). It runs
**before every matched request** and is used here for auth gating, session
revocation checks, and token-refresh error handling.

---

## 4. Repo structure — the high-level map

```text
app/                  → routing + pages + API routes (Next.js)
  users/dashboard/    → authenticated section, grouped by domain:
    portfolio/        → projects, inspections
    finance/          → budgets, expenses, invoices, payments, receipts
    resources/        → assets, goods-receipts, indents, material-consumptions,
                        materials, purchase-orders, stock-adjustments,
                        storage-locations, transfers
    third-party/      → labour, sub-contracts, vendors
    workforce/        → employees, leaves
    site/             → site-level management
    attendance/       → attendance module
    chat/             → chat module
    tasks/            → standalone task view
    organizations/    → multi-org management
    portal/ learning/ → additional feature areas
auth.ts               → Auth.js config (Keycloak, JWT callbacks, refresh)
proxy.ts              → middleware (auth gate, session checks)
next.config.ts        → Next.js config (redirects, image hosts, output mode)
scripts/              → codegen scripts (generate-routes.ts, watch-routes.ts) — run on
                       Node.js 22+ via `node --experimental-strip-types …`, wired into
                       package.json as `routes:generate` / `routes:watch`. Bun is used
                       only as the package manager / dev workflow runner (e.g.
                       `bun routes:watch` and the `only-allow bun` preinstall hook).

components/
  ui/                 → raw shadcn primitives (do NOT import directly from app/features)
  shadcn/             → re-exports / variant-customized wrappers around ui/  ← USE THESE
  common/             → app-wide reusable composites (Pagination, PageHeader…)
  shared/             → cross-feature widgets
  providers/          → React context providers (auth, query, theme, sidebar…)
  errors/             → error UI

features/<domain>/    → domain modules (projects, tasks, leave, attendance, …)
  components/         → feature UI; a feature only imports from its own folder + shared layers

hooks/<domain>/       → TanStack Query hooks (queries + mutations) per domain
  use-*.ts            → top-level cross-cutting hooks (use-mobile, use-geolocation, …)

services/             → thin API client wrappers, one file per backend resource

nav/                  → navigation platform (filesystem-driven, see §7)
  types.ts            → core RouteNode / NavItem / RouteMetadata types
  access/             → RBAC access config per route
  breadcrumbs/        → breadcrumb utilities
  compose/            → merges generated routes with human metadata
  generated/          → auto-generated from filesystem (routes, helpers, index maps)
  indexes/            → id/path index builders
  metadata/           → human-authored per-route UI intent (label, icon, badges…)
  validators/         → nav-tree validation
  index.ts            → main entry point; exports `navigation`, `routes`, `DASHBOARD_BASE`

config/
  nav.config.ts       → backward-compat shim — re-exports from @/nav (do not add new logic here)
  auth-config.ts      → RBAC role/permission definitions

lib/
  api/api-client.ts   → fetch wrapper (timeout, retry, ApiError class)
  auth/               → session-revocation, token helpers, constants
  rbac/               → role/permission helpers
  query/              → TanStack Query shared utilities
    options.ts        → standardQueryOptions, realtimeQueryOptions, staticQueryOptions, noCacheQueryOptions
    retry.ts          → shouldRetry (shared retry policy for all hooks)
  monitoring/         → metrics helpers (metrics.ts, rate-limit.ts)
  security/           → security helpers
  utils/              → date, retry, navigation, breadcrumb, error helpers
  stores/             → Zustand stores
  styles/             → toast, Tailwind helpers
  validators/         → Zod schemas
  logger.ts           → structured logger (used everywhere)

types/<domain>/       → TS types + Zod parsers + (de)serializers per domain
public/               → static assets
```

### The dependency rule (enforced by ESLint)

[eslint.config.mjs](../eslint.config.mjs) configures
`eslint-plugin-boundaries` with this layered rule:

```text
app       → features, shared, shadcn, lib, types
features  → (same feature only), shared, shadcn, lib, types
shadcn    → ui, lib, types
ui        → lib, types        (the raw shadcn primitives)
lib       → lib, types
types     → types
```

Practical takeaways:

- **Never import from `components/ui/` directly** in app code or features.
  Always go through `components/shadcn/` (which is the customized layer).
- **Features are siloed** — `features/projects` cannot import from
  `features/leave`. Cross-feature reuse goes through `shared/` or `lib/`.
- **`app/` is the only orchestration layer** — features should not import from `app/`.

If you're unsure where a new file belongs, run lint — boundary violations error out.

---

## 5. The data flow (read this carefully — it's the same everywhere)

Every domain in this app follows the **exact same pattern**. Once you
understand projects, you understand all 25+ features.

```text
                                          ┌─────────────────────┐
  Page (app/.../page.tsx, 'use client')    │ Spring Boot backend │
        │                                   └──────────▲──────────┘
        │ uses                                          │
        ▼                                               │ HTTPS
  Hook  (hooks/<domain>/use-X.ts)                      │
        │ wraps useQuery/useMutation                    │
        ▼                                               │
  Service (services/<domain>-service.ts)               │
        │ calls api.get/post/put/delete                 │
        ▼                                               │
  ApiClient (lib/api/api-client.ts) ───── fetch ───────┘
        │ adds: timeout, retry, error normalization
        │
  All requests go to /api/v1/* on Next.js,
  which is the catch-all proxy route that
  forwards them to BACKEND_API_URL with the
  user's access token attached server-side.
```

Concrete example for the **Projects** feature:

1. Page: [app/users/dashboard/portfolio/projects/page.tsx](../app/users/dashboard/portfolio/projects/page.tsx)
2. Hook: [hooks/project/use-projects.ts](../hooks/project/use-projects.ts) (queries) + [hooks/project/use-project-mutations.ts](../hooks/project/use-project-mutations.ts) (mutations)
3. Service: [services/project-service.ts](../services/project-service.ts)
4. Types/parsers: [types/project/project.ts](../types/project/project.ts)
5. UI components specific to projects: [features/projects/components/](../features/projects/components/)

Read those five files in that order — that's the canonical "tour of one
feature." Every other feature is a structural copy.

### TanStack Query global defaults

The `QueryProvider` ([components/providers/query-provider.tsx](../components/providers/query-provider.tsx))
sets these defaults for all hooks:

| Setting                | Value                                          |
| ---------------------- | ---------------------------------------------- |
| `staleTime`            | 60 s — data considered fresh for 1 minute      |
| `gcTime`               | 5 min — cache entry lives 5 min after last use |
| `retry`                | `shouldRetry` from `lib/query/retry.ts`        |
| `retryDelay`           | Exponential back-off, capped at 30 s           |
| `refetchOnWindowFocus` | Production only (avoids dev noise)             |
| `refetchOnReconnect`   | Always                                         |

`shouldRetry` retries 5xx / network / 429 errors up to 3 times; skips retries
on 4xx client errors and auth failures (401/403/404).

Individual hooks that need different behaviour import a preset from
[lib/query/options.ts](../lib/query/options.ts) and spread it into `useQuery`:

| Preset                 | Use case                                      |
| ---------------------- | --------------------------------------------- |
| `standardQueryOptions` | Default — same as global (explicit opt-in)    |
| `realtimeQueryOptions` | Chat messages, live dashboards — always stale |
| `staticQueryOptions`   | Work categories, org settings — 10 min fresh  |
| `noCacheQueryOptions`  | Unread counts, must-be-fresh data             |

### Why a proxy route for the API?

[app/api/v1/[...path]/route.ts](../app/api/v1/%5B...path%5D/route.ts) is a
**catch-all Route Handler**. It:

- Reads the access token from the server-side session (never exposed to the browser).
- Adds the `Authorization` header.
- Forwards to `process.env.BACKEND_API_URL` with timeouts and PII redaction in logs.

The browser only ever talks to `/api/v1/*` on this Next.js server — the real
backend URL and token are kept server-side. This is a very common Next.js
pattern.

---

## 6. Authentication (Auth.js v5 + Keycloak)

The whole auth story is in three files:

1. [auth.ts](../auth.ts) — defines the Keycloak provider, JWT/session
   callbacks, access-token refresh, and exports `auth`, `signIn`, `signOut`,
   and a `handlers` object.
2. [proxy.ts](../proxy.ts) — wraps the entire app in `auth(...)` middleware
   so every request has `req.auth` available; redirects unauthenticated users.
3. [components/providers/auth-provider.tsx](../components/providers/auth-provider.tsx)
   — client-side `<SessionProvider>` plus a `SessionMonitor` that watches for
   token-refresh errors, idle timeouts, and revocation.

NextAuth's API routes live at [app/api/auth/](../app/api/auth/) (handled by
the `handlers` re-export — standard Auth.js setup).

Useful client API:

```ts
import { useSession, signIn, signOut } from 'next-auth/react';
const { data: session, status } = useSession(); // status: 'loading' | 'authenticated' | 'unauthenticated'
```

On the server (RSC, Route Handler, middleware):

```ts
import { auth } from '@/auth';
const session = await auth();
```

**RBAC** is layered on top — see [lib/rbac/](../lib/rbac/), [hooks/use-authorization.ts](../hooks/use-authorization.ts),
and [config/auth-config.ts](../config/auth-config.ts).
The pattern is "one page for everyone, conditionally render based on permissions."

---

## 7. Navigation platform (`nav/`)

The navigation system is a **filesystem-driven platform** in the `nav/`
directory. It has two layers:

1. **Generated** (`nav/generated/`) — auto-derived from the `app/` folder
   tree by the codegen CLI. Contains typed route constants, path helpers, and
   an index map. Regenerate with:

   ```sh
   bun routes:generate   # one-shot
   bun routes:watch      # watch mode (already runs as part of `bun dev`)
   ```

2. **Human-authored** (`nav/metadata/`) — per-route UI intent: display label,
   icon, badge, visibility, RBAC access config. Edit these when you add a new
   route.

The `nav/compose/` module merges both layers into a fully typed nav tree.
`nav/index.ts` is the single entry point for application code:

```ts
import { navigation, routes, DASHBOARD_BASE } from '@/nav';

// Type-safe route helpers — no magic strings
routes.portfolio.projects.href; // '/users/dashboard/portfolio/projects'
routes.portfolio.projects.detail('42').href; // '/users/dashboard/portfolio/projects/42'
routes.finance.receipts.new.href;
```

`config/nav.config.ts` is a **backward-compat shim** that re-exports from
`@/nav`. Do not add new logic there — migrate imports to `@/nav` directly.

The sidebar ([features/common/components/sidebar.tsx](../features/common/components/sidebar.tsx))
and breadcrumbs ([features/common/components/breadcrumbs.tsx](../features/common/components/breadcrumbs.tsx))
consume `navigation` from `@/nav`.

---

## 8. Recommended reading order

Spend ~2–3 hours going through these in order. You'll have a working mental
model afterwards.

### Phase 1 — Framework & shape (30 min)

1. [package.json](../package.json) — confirm versions and scripts.
2. [next.config.ts](../next.config.ts) — note `output: 'standalone'`, the
   `/dashboard → /users/dashboard` redirect, and image host allowlist.
3. [tsconfig.json](../tsconfig.json) — note the `@/*` path alias.
4. [eslint.config.mjs](../eslint.config.mjs) — read the `boundaries/elements`
   and `rules` sections. This _is_ the architecture, codified.
5. [README.md](../README.md) — features and ops overview (skim).

### Phase 2 — App Router skeleton (30 min)

6. [app/layout.tsx](../app/layout.tsx) — root layout, providers, theme.
7. [components/providers/auth-provider.tsx](../components/providers/auth-provider.tsx)
   and [components/providers/query-provider.tsx](../components/providers/query-provider.tsx)
   — the two providers wrapping the whole app.
8. [app/page.tsx](../app/page.tsx) — public marketing landing page. The
   authenticated → dashboard redirect lives in [proxy.ts](../proxy.ts), not
   here.
9. [app/users/dashboard/layout.tsx](../app/users/dashboard/layout.tsx) and
   [features/common/components/app-layout.tsx](../features/common/components/app-layout.tsx)
   — the authenticated shell (sidebar + breadcrumbs + content).
10. [app/error.tsx](../app/error.tsx), [app/not-found.tsx](../app/not-found.tsx),
    [app/global-error.tsx](../app/global-error.tsx) — error boundaries.

### Phase 3 — Auth & API plumbing (30 min)

11. [auth.ts](../auth.ts) — read top-to-bottom. The JWT callback (refresh
    logic) is the core piece.
12. [proxy.ts](../proxy.ts) — middleware for auth gating.
13. [app/api/v1/[...path]/route.ts](../app/api/v1/%5B...path%5D/route.ts) — the
    catch-all backend proxy. Note `GET/POST/PUT/PATCH/DELETE` exports.
14. [lib/api/api-client.ts](../lib/api/api-client.ts) — fetch wrapper used
    by every service.
15. [lib/query/options.ts](../lib/query/options.ts) and
    [lib/query/retry.ts](../lib/query/retry.ts) — shared TanStack Query presets
    and retry policy.
16. [nav/index.ts](../nav/index.ts) — nav platform entry point; then skim
    `nav/types.ts` and `nav/generated/routes.generated.ts` to see the shape.

### Phase 4 — One feature end-to-end (45 min)

Pick **Projects** — it's the most representative.

17. [types/project/project.ts](../types/project/project.ts) — domain type +
    parsers.
18. [services/project-service.ts](../services/project-service.ts) — CRUD calls.
19. [hooks/project/use-projects.ts](../hooks/project/use-projects.ts) — read
    queries.
20. [hooks/project/use-project-mutations.ts](../hooks/project/use-project-mutations.ts)
    — read mutations + cache invalidation pattern.
21. [features/projects/components/](../features/projects/components/) — feature UI.
22. [app/users/dashboard/portfolio/projects/page.tsx](../app/users/dashboard/portfolio/projects/page.tsx)
    — list page (also a great RBAC example).
23. [app/users/dashboard/portfolio/projects/[id]/page.tsx](../app/users/dashboard/portfolio/projects/%5Bid%5D/page.tsx)
    — dynamic detail page; note `useParams()`.

### Phase 5 — Get it running (15 min)

24. Copy `.env.local` from a teammate (Keycloak issuer/client, `BACKEND_API_URL`).
25. `bun install && bun dev`. Visit http://localhost:3000.
    (`bun dev` concurrently runs the route watcher + Next.js dev server.)
26. Sign in via Keycloak and land on `/users/dashboard`.
27. Open DevTools → Network tab and watch a page hit `/api/v1/...` — confirm
    the proxy round-trip mental model.

---

## 9. Next.js concepts you'll encounter (quick glossary)

Only the ones actually used here. If you see one in code and forget what it
does, this is the lookup.

- **App Router** — the routing system rooted in `app/`. Folder names = URL
  segments; special files (§3) define behavior.
- **Server Component / Client Component** — default vs `'use client'`. See §1.
- **Route Handler** — `app/.../route.ts` exporting `GET`/`POST`/etc.
  Same idea as an Express handler, but file-system-routed. Used here for the
  API proxy and a few utility endpoints (health, metrics, debug).
- **Middleware** (here named `proxy.ts`) — runs before requests are matched
  to routes. Use for auth checks, redirects, header manipulation.
- **Dynamic segments** — `[id]`, `[...slug]`. Inside the page,
  `useParams()` (client) or the `params` prop (server) gives you the value.
- **Route groups** — `(folder)` doesn't appear in the URL; pure organization.
  Not heavily used here.
- **Server Actions** — `'use server'` functions you can call from a client
  component as if they were local. **Not used in this repo** (TanStack Query
  - service layer takes their place); skip for now.
- **`next/link`** — client-side navigation; use instead of `<a href>` for
  internal links to keep SPA-like transitions and prefetching.
- **`next/navigation`** — `useRouter`, `usePathname`, `useParams`,
  `useSearchParams`. Replaces `react-router`.
- **`next/image`** — optimized image component. Remote hosts must be
  allowlisted in `next.config.ts`.
- **Metadata API** — exported `metadata` object or `generateMetadata` function
  sets `<head>` content per route. See [lib/metadata.ts](../lib/metadata.ts).
- **`force-dynamic` / `force-static`** — set `export const dynamic = ...` to
  control caching/SSG behavior. Scoped here to the dashboard layout
  ([app/users/dashboard/layout.tsx](../app/users/dashboard/layout.tsx)), so
  authenticated pages render per request while the marketing routes remain
  statically optimizable.
- **Streaming / Suspense** — the App Router supports React Suspense out of
  the box; `loading.tsx` files are sugar for `<Suspense fallback={...}>`.
- **`revalidatePath` / `revalidateTag`** — invalidate cached server data.
  Not currently used; cache invalidation here is done client-side via
  TanStack Query's `queryClient.invalidateQueries`.
- **Standalone output** — `output: 'standalone'` in `next.config.ts` produces
  a self-contained `.next/standalone/` folder for Docker (see [Dockerfile](../Dockerfile)).

---

## 10. Quick conventions cheatsheet for contributing

- **Filenames**: kebab-case, except React components which may be PascalCase
  and Next.js special files (`page.tsx`, `layout.tsx`, …). Enforced by
  `eslint-plugin-unicorn/filename-case`.
- **Import order/sort**: enforced by `eslint-plugin-perfectionist`. Run lint.
- **Imports across layers**: must respect §4's boundary rules. Lint will
  catch violations.
- **Adding a new domain**: create `types/<x>/`, `services/<x>-service.ts`,
  `hooks/<x>/use-<x>.ts` + `use-<x>-mutations.ts`,
  `features/<x>/components/`, then the route(s) under the appropriate
  `app/users/dashboard/<section>/` group. Add metadata to `nav/metadata/`
  and run `bun routes:generate`. Do **not** add logic to `config/nav.config.ts`.
- **Use shadcn UI from `@/components/shadcn/*`**, never `@/components/ui/*`.
- **Mark interactive pages `'use client'`** at the top. Most pages here do.
- **Run `bun lint` before pushing** — Husky's pre-commit hook will run it
  on staged files anyway.
- **Route helpers**: use `routes.*` from `@/nav` instead of hardcoded strings.
  If you add a route and helpers are missing, run `bun routes:generate`.

---

## 11. Where to go after this guide

- Read three more features end-to-end (e.g. Leave, Attendance, GRN). You'll
  see the same shape and start spotting the differences.
- Read [components/providers/organization-provider.tsx](../components/providers/organization-provider.tsx)
  — the multi-tenancy layer.
- Skim [lib/utils/](../lib/utils/) — small, focused helpers worth knowing.
- Watch the official Next.js App Router intro (~20 min) on nextjs.org/learn
  for any §9 concept that still feels fuzzy.

You're now equipped to navigate, read, and contribute. Happy hacking.
