import { Badge } from "@/components/ui/badge";

/**
 * Placeholder home. This becomes the responsive list-detail dashboard
 * (directory + client context) once the database is connected and the
 * data layer / API routes land. Kept DB-free for now so the scaffold boots
 * before DATABASE_URL is configured.
 */
export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-start justify-center gap-6 px-6 py-16">
      <Badge variant="secondary">Scaffold ready</Badge>
      <h1 className="text-3xl font-semibold tracking-tight">Trainer Dashboard</h1>
      <p className="text-muted-foreground">
        Next.js 16 (App Router) · React Query · Drizzle + Neon · Tailwind +
        shadcn/ui. Connect a Neon database (<code>DATABASE_URL</code> in{" "}
        <code>.env.local</code>), then run <code>pnpm db:reset</code> to push the
        schema and seed it.
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Client directory + context (responsive list-detail)</li>
        <li>Coach actions: chat, book, create workout, edit info</li>
        <li>Loading / empty / error states + optimistic chat</li>
      </ol>
    </main>
  );
}
