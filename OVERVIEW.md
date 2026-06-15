# Trainer Dashboard — Overview

A slice of Future's coach dashboard: **pick a client → see their context → take
action.** Built as a take-home. For the full write-up (API contract, edge cases,
production thinking) see [README.md](./README.md).

**Live:** https://trainer-dashboard-5cr6tub5g-damdeezs-projects.vercel.app

## What it does

- **Client directory** — searchable list of 8 clients; ↑/↓ nav and a ⌘K palette.
- **Client context** — per client: goals, "things to know", recent activity,
  workout history, and the chat thread. Selecting a client drives everything
  (selection lives in the URL).
- **Four coach actions, all persisted:** send a chat message (optimistic, with
  rollback), book a workout (date/time), create a workout (assemble exercises,
  drag to reorder), and edit client info.

## Tech stack & why

| Choice | Why |
| --- | --- |
| **Next.js 16 (App Router) + TypeScript** | Required by the brief; Server Components for the shell/routing, Client Components for interactivity, API routes as the BFF. |
| **Neon Postgres + Drizzle ORM** | Persistence has to survive reload *on Vercel*, whose serverless filesystem is ephemeral — so a JSON file/SQLite won't do. One connection string local + prod; Drizzle is lighter and faster-cold-start than Prisma. |
| **TanStack Query (React Query)** | The app is almost all server state. RQ gives caching, loading/empty/error states, and `onMutate`/`onError` — exactly the optimistic-update-with-rollback the brief asks for. |
| **URL-as-state** (`/clients/[id]`) | Selection is shareable, survives reload, and drives the layout — no extra global store needed. |
| **Tailwind 4 + shadcn/ui (on @base-ui)** | "Basic but nice" with accessible dialogs and keyboard nav close to free. |
| **zod** | One schema set validates requests *and* parses responses → typed end to end across the network. |
| **React Compiler** | Auto-memoization, so no hand-written `useMemo`/`useCallback`. |
| **Vitest + RTL** | Fast unit + integration tests for the two critical paths. |

## Requirements coverage

- ✅ Three areas (directory · context · actions), selection drives the UI
- ✅ All four actions, persisted across reload
- ✅ App Router + TS, deliberate Server/Client split, API routes as BFF
- ✅ Loading / empty / error states on every data-driven view
- ✅ Optimistic chat with rollback; errors surfaced via toasts (never silent)
- ✅ 2 critical-path tests (optimistic rollback + API↔DB round-trip)
- ✅ Deployed to a live URL
- ✅ Extras: typed API client (zod), drag-to-reorder, ⌘K + ↑/↓ nav, a11y pass

## Run it

```bash
pnpm install
cp .env.example .env.local   # add a Neon pooled DATABASE_URL
pnpm db:reset                # push schema + seed (8 clients, 50 exercises)
pnpm dev                     # http://localhost:3000
```
