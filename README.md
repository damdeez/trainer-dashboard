# Trainer Dashboard

A coach-facing dashboard slice for managing clients: pick a client from the
directory, see their full context, and take action — chat, book a session,
build a workout plan, or edit their profile. **Every action persists across
reload.**

**Live:** https://trainer-dashboard-5cr6tub5g-damdeezs-projects.vercel.app
&nbsp;·&nbsp; **Repo:** https://github.com/damdeez/trainer-dashboard

```
┌─────────────┬──────────────────────────────────────────┐
│  Directory  │  Client context                          │
│  (search,   │  ┌────────────────────────────────────┐  │
│   ↑/↓ nav,  │  │ Maya Chen        [Edit] [Book] [+]  │  │
│   ⌘K)       │  ├────────────────────────────────────┤  │
│             │  │ Overview │ Chat │ Plans             │  │
│  • Maya  ◀  │  │ goals · things to know · activity  │  │
│  • Derek    │  │ optimistic chat thread             │  │
│  • Aisha…   │  │ workouts + exercises               │  │
└─────────────┴──────────────────────────────────────────┘
```

---

## Setup

Requires Node 20+ and `pnpm`, plus a Neon Postgres connection string.

```bash
pnpm install

# 1. Configure the database (see .env.example)
cp .env.example .env.local        # then paste your Neon pooled DATABASE_URL
#   or, if linked to Vercel: vercel env pull .env.local

# 2. Push the schema + seed sample data (8 clients, 50 exercises)
pnpm db:reset

# 3. Run it
pnpm dev                          # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm db:studio`.

---

## API contract

A thin backend-for-frontend over Next route handlers. Every request body is
validated with zod; every response is parsed against the same zod schemas on
the client, so the app is typed end-to-end across the network boundary
(`src/lib/api/schemas.ts` is the single source of truth).

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/clients` | Directory list (lightweight: + next session, last message) |
| `GET` | `/api/clients/[id]` | Full client context (profile, workouts, activity) |
| `PATCH` | `/api/clients/[id]` | Edit info (name, goals, things to know) |
| `GET` | `/api/clients/[id]/messages` | Chat thread |
| `POST` | `/api/clients/[id]/messages` | Send a message → **optimistic** |
| `GET` | `/api/clients/[id]/workouts` | Workouts + exercises |
| `POST` | `/api/clients/[id]/workouts` | Book a session **or** create a draft plan |
| `GET` | `/api/exercises?muscle=&q=` | Exercise picker, filterable |

Errors use one envelope — `{ error: string, details?: unknown }` — with `400`
for validation failures (flattened field errors), `404` for missing clients,
and `500` for anything unhandled.

---

## Architecture & decisions

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 +
shadcn/ui · TanStack Query · Drizzle ORM + Neon Postgres · Vitest.

- **Persistence — Neon Postgres + Drizzle.** The live Vercel deploy is the
  deciding constraint: a JSON file or local SQLite can't survive Vercel's
  ephemeral serverless filesystem, which would silently break "persist across
  reload." Neon is one connection string for local + prod. Drizzle over Prisma:
  lighter, fully typed, faster cold starts. The driver is
  `@neondatabase/serverless` (HTTP — no pool to manage, ideal for serverless).

- **State — TanStack Query + URL-as-state.** The app is almost entirely server
  state, so React Query owns fetching, caching, and the loading/empty/error
  surfaces. Selection lives in the URL (`/clients/[clientId]`) so it's
  shareable, survives reload, and drives the responsive shell.

- **Optimistic action — chat.** `useSendMessage` paints the coach's message
  instantly with a temp id (`onMutate`), reconciles with the persisted row on
  success, and rolls the cache back + toasts on failure (`onError`). This is the
  one place the brief explicitly calls for optimism, so it gets the full
  treatment; other mutations invalidate and refetch, which is simpler and
  correct for less latency-sensitive actions.

- **Layout — responsive list-detail.** One component tree, breakpoint-driven.
  Desktop ≥ md: directory as a persistent left sidebar + detail pane. Mobile:
  directory is the home screen; selecting a client swaps to a full-screen
  detail, and action modals become bottom sheets (one `ResponsiveModal`
  switches Dialog ↔ Drawer).

- **One workouts table, two actions.** "Book" (`status=scheduled`, has a date)
  and "create" (`status=draft`, has exercises) are the same row shape with a
  zod refinement enforcing "scheduled ⇒ has a date."

**Stretch included:** ⌘K command palette (cmdk), ↑/↓ keyboard nav in the
directory, drag-to-reorder exercises in the plan builder (dnd-kit), dark mode,
toasts, skeletons, and relative timestamps.

---

## Trade-offs & things I'd revisit

- **Client-side data fetching over RSC + hydration.** I render the dashboard as
  client components driven by React Query rather than prefetching in Server
  Components and dehydrating. It keeps one mental model (every read is a query,
  every action a mutation) and makes loading/empty/error states first-class, at
  the cost of a request waterfall on first paint. With more time I'd prefetch
  the directory + first client on the server and hydrate.
- **Activity feed is append-only and derived in writes.** Sending a message or
  saving a workout also writes an `activity` row so the timeline stays live.
  This couples the two writes; a production version would likely emit a domain
  event instead.
- **No auth / single implicit coach.** Out of scope for the slice; every action
  is attributed to "the coach."
- **Exercise filter uses `ILIKE` + jsonb containment.** Fine for 50 rows; at
  catalog scale I'd add a trigram or full-text index.

## Edge cases handled

- Optimistic chat rollback + toast on send failure (covered by a test).
- `404` for unknown client ids, surfaced as a "Client not found" pane with a way
  back to the directory; query errors get a retry affordance.
- Validation errors return flattened field messages; the UI disables submit
  until inputs are valid (e.g. a scheduled workout requires a date).
- Drafts have no date (`Unscheduled`); timestamps render relative ("3h ago").
- SSR-safe theming (dark-only) and media queries — no hydration mismatch.
- Optimistic ids never collide with persisted ids and are swapped on success.

---

## Tests

Two critical paths (`pnpm test`):

1. **Optimistic chat rollback** (`src/lib/api/hooks.test.tsx`) — a deferred
   mock proves the message appears optimistically, then the cache rolls back to
   the exact prior thread and an error toast fires when the API rejects (plus
   the success path swaps the temp row for the persisted one).
2. **API + DB round-trip** (`src/app/api/clients/roundtrip.test.ts`) — drives
   the real `PATCH` then `GET` route handlers against Neon, proving an edit
   persists across a fresh read; it restores the original value and skips
   cleanly when `DATABASE_URL` is absent.

---

## AI & tooling

Built with Claude Code as a pair: it scaffolded boilerplate (zod schemas,
route handlers, shadcn wiring), and I directed architecture, reviewed every
diff, and debugged the interesting failures — e.g. a seed bug where snake_case
JSON keys were silently dropped by Drizzle's insert (defaulting all exercise
metadata to `[]`), and a self-referential `--font-sans` CSS variable. The repo
notably uses `@base-ui/react` (not Radix), so composition is via `render`/class
props rather than `asChild` — worth knowing when extending the UI.

## How I'd evaluate this in production

- **Correctness:** does state survive reload, and do optimistic updates
  reconcile or roll back? (The two tests above are the seed of this suite.)
- **Latency:** p75 time-to-interactive for the directory and first client;
  mutation round-trip times. Watch Neon cold starts on serverless.
- **Reliability:** error rate per route, and how often optimistic sends roll
  back (a proxy for backend health the coach actually feels).
- **UX signals:** action completion funnels (started vs. saved), and a11y —
  keyboard-only and screen-reader passes on the dialogs and directory.
