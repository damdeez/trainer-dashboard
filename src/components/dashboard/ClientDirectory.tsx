"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { useClients } from "@/lib/api/hooks";
import type { ClientSummary } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";
import { formatWorkoutDate, initials } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientDirectory() {
  const { data, isLoading, isError, refetch } = useClients();
  const params = useParams<{ clientId?: string }>();
  const selectedId = params?.clientId;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q),
    );
  }, [data, query]);

  const rootRef = useRef<HTMLDivElement>(null);

  // Roving ↑/↓ keyboard nav: from the search box, ArrowDown drops into the
  // list; within the list the arrows move focus row to row. Enter follows the
  // focused link (native <a> behaviour), so no extra handling needed.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>("[data-client-row]") ?? [],
    );
    if (rows.length === 0) return;
    e.preventDefault();
    const idx = rows.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? Math.min(idx + 1, rows.length - 1)
        : Math.max(idx - 1, 0);
    rows[next === -1 ? 0 : next]?.focus();
  }

  return (
    <div className="flex h-full flex-col" ref={rootRef} onKeyDown={onKeyDown}>
      <div className="border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="pl-8"
            aria-label="Search clients"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Client directory">
        {isLoading && <DirectorySkeleton />}

        {isError && (
          <div className="text-muted-foreground p-4 text-sm">
            <p>Couldn&apos;t load clients.</p>
            <button
              onClick={() => refetch()}
              className="text-foreground mt-2 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="text-muted-foreground p-4 text-sm">
            {query ? "No clients match your search." : "No clients yet."}
          </p>
        )}

        <ul className="space-y-1">
          {filtered.map((c) => (
            <li key={c.id}>
              <ClientRow client={c} active={c.id === selectedId} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function ClientRow({
  client,
  active,
}: {
  client: ClientSummary;
  active: boolean;
}) {
  return (
    <Link
      href={`/clients/${client.id}`}
      data-client-row
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md p-2 text-sm transition-colors",
        "hover:bg-accent focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        active && "bg-accent",
      )}
    >
      <Avatar className="size-9">
        <AvatarFallback className="text-xs">
          {initials(client.firstName, client.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {client.firstName} {client.lastName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {client.nextWorkoutDate
            ? `Next: ${formatWorkoutDate(client.nextWorkoutDate)}`
            : client.goals[0] ?? "No upcoming sessions"}
        </p>
      </div>
    </Link>
  );
}

function DirectorySkeleton() {
  return (
    <ul className="space-y-1" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </li>
      ))}
    </ul>
  );
}
