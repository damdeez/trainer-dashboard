"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarPlus,
  Dumbbell,
  Info,
  ListPlus,
  MessageSquare,
  Pencil,
  Target,
} from "lucide-react";
import { useClient } from "@/lib/hooks/useApi";
import { ApiRequestError } from "@/lib/api/fetcher";
import type { ClientDetail } from "@/lib/api/schemas";
import { formatRelative, formatWorkoutDate, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "./ChatPanel";
import { EditClientDialog } from "./EditClientDialog";
import { BookWorkoutDialog } from "./BookWorkoutDialog";
import { CreateWorkoutDialog } from "./CreateWorkoutDialog";

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>
      <Skeleton className="h-8 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

interface OverviewProps {
  client: ClientDetail;
}

function Overview({ client }: OverviewProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Target className="size-4" /> Goals
        </h2>
        {client.goals.length > 0 ? (
          <ul className="space-y-1.5">
            {client.goals.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No goals set yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Info className="size-4" /> Things to know
        </h2>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {client.thingsToKnow || "Nothing noted yet."}
        </p>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Activity className="size-4" /> Recent activity
        </h2>
        {client.activity.length > 0 ? (
          <ul className="space-y-3">
            {client.activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="bg-muted-foreground/40 mt-1.5 size-2 shrink-0 rounded-full" />
                <div>
                  <p>{a.summary}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatRelative(a.occurredAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        )}
      </section>
    </div>
  );
}

interface PlansProps {
  client: ClientDetail;
  onCreate: () => void;
}

function Plans({ client, onCreate }: PlansProps) {
  if (client.workouts.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-3 py-10 text-center text-sm">
        <Dumbbell className="size-8 opacity-40" />
        <p>No workouts yet.</p>
        <Button size="sm" variant="outline" onClick={onCreate}>
          Create the first plan
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {client.workouts.map((w) => (
        <li key={w.id} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{w.title}</p>
              <p className="text-muted-foreground text-xs">
                {formatWorkoutDate(w.date)}
              </p>
            </div>
            <Badge variant={w.status === "scheduled" ? "default" : "secondary"}>
              {w.status}
            </Badge>
          </div>
          {w.exercises.length > 0 && (
            <ul className="mt-2 space-y-1 border-t pt-2">
              {w.exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="text-muted-foreground flex justify-between text-sm"
                >
                  <span>{ex.name}</span>
                  <span className="tabular-nums">
                    {ex.sets} × {ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

interface ClientDetailViewProps {
  clientId: string;
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const { data: client, isLoading, isError, error, refetch } = useClient(clientId);
  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-foreground font-medium">
          {notFound ? "Client not found" : "Couldn't load this client"}
        </p>
        {notFound ? (
          <Link href="/clients" className="text-sm underline underline-offset-4">
            Back to directory
          </Link>
        ) : (
          <button
            onClick={() => refetch()}
            className="text-sm underline underline-offset-4"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Link
          href="/clients"
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm md:hidden"
        >
          <ArrowLeft className="size-4" /> Directory
        </Link>

        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            <AvatarFallback>
              {initials(client.firstName, client.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-muted-foreground text-sm">
              {client.workouts.length} workout
              {client.workouts.length === 1 ? "" : "s"} · {client.goals.length}{" "}
              goal{client.goals.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-1.5"
          >
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setBookOpen(true)} className="gap-1.5">
            <CalendarPlus className="size-4" /> Book workout
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <ListPlus className="size-4" /> Create plan
          </Button>
        </div>
      </div>

      {/* Tabbed context */}
      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 pt-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="size-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5">
              <Dumbbell className="size-3.5" /> Plans
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="min-h-0 flex-1 overflow-y-auto p-4">
          <Overview client={client} />
        </TabsContent>
        <TabsContent value="chat" className="min-h-0 flex-1">
          <ChatPanel clientId={client.id} />
        </TabsContent>
        <TabsContent value="plans" className="min-h-0 flex-1 overflow-y-auto p-4">
          <Plans client={client} onCreate={() => setCreateOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* key per client: re-mounts each form so its useState re-seeds from the
          newly selected client instead of going stale when selection changes. */}
      <EditClientDialog
        key={`edit-${client.id}`}
        client={client}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <BookWorkoutDialog
        key={`book-${client.id}`}
        clientId={client.id}
        open={bookOpen}
        onOpenChange={setBookOpen}
      />
      <CreateWorkoutDialog
        key={`create-${client.id}`}
        clientId={client.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
