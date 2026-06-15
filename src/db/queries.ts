import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "./client";
import {
  clients,
  workouts,
  workoutExercises,
  messages,
  activity,
  exercises,
} from "./schema";
import type {
  CreateMessageInput,
  CreateWorkoutData,
  UpdateClientInput,
} from "@/lib/api/schemas";

/**
 * Data access for the BFF. Route handlers stay thin: validate, call one of
 * these, return JSON. Keeping queries here (not inline) makes them reusable
 * and testable, and keeps Drizzle specifics out of the HTTP layer.
 */

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/**
 * Directory list. Two small aggregate queries (next scheduled session, last
 * message time) joined to the client rows in memory — cheaper than loading
 * every client's full workout/message history just to render a list.
 */
export async function listClientSummaries() {
  const rows = await db
    .select({
      id: clients.id,
      firstName: clients.firstName,
      lastName: clients.lastName,
      avatarUrl: clients.avatarUrl,
      goals: clients.goals,
    })
    .from(clients)
    .orderBy(asc(clients.firstName), asc(clients.lastName));

  const nextWorkouts = await db
    .select({
      clientId: workouts.clientId,
      nextDate: sql<string | null>`min(${workouts.date})`,
    })
    .from(workouts)
    .where(
      and(eq(workouts.status, "scheduled"), sql`${workouts.date} >= now()`),
    )
    .groupBy(workouts.clientId);

  const lastMessages = await db
    .select({
      clientId: messages.clientId,
      lastAt: sql<string | null>`max(${messages.createdAt})`,
    })
    .from(messages)
    .groupBy(messages.clientId);

  // Aggregates come back as raw Postgres timestamp text ("2026-04-13 21:40:00+00"),
  // not ISO 8601 — normalise so the wire format is consistent with the relational
  // queries (which serialise Date → ISO) and parses cleanly with date-fns.
  const toIso = (v: string | null) => (v ? new Date(v).toISOString() : null);
  const nextByClient = new Map(nextWorkouts.map((r) => [r.clientId, toIso(r.nextDate)]));
  const lastByClient = new Map(lastMessages.map((r) => [r.clientId, toIso(r.lastAt)]));

  return rows.map((c) => ({
    ...c,
    nextWorkoutDate: nextByClient.get(c.id) ?? null,
    lastMessageAt: lastByClient.get(c.id) ?? null,
  }));
}

/** Full client context: profile + workouts (with exercises) + activity feed. */
export async function getClientDetail(id: string) {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      workouts: {
        orderBy: [asc(workouts.date)],
        with: { exercises: { orderBy: [asc(workoutExercises.position)] } },
      },
      activity: { orderBy: [desc(activity.occurredAt)] },
    },
  });
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const updated = await db
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning({ id: clients.id });
  if (updated.length === 0) return undefined;
  return getClientDetail(id);
}

export async function clientExists(id: string) {
  const row = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  return row.length > 0;
}

// ---------------------------------------------------------------------------
// Messages (chat thread)
// ---------------------------------------------------------------------------

export async function listMessages(clientId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.clientId, clientId))
    .orderBy(asc(messages.createdAt));
}

/** Coach sends a message. Also drops a timeline entry so activity stays live. */
export async function createMessage(clientId: string, input: CreateMessageInput) {
  const now = new Date();
  const [message] = await db
    .insert(messages)
    .values({
      id: `m_${randomUUID()}`,
      clientId,
      sender: "coach",
      body: input.body,
      createdAt: now,
    })
    .returning();

  await db.insert(activity).values({
    id: `a_${randomUUID()}`,
    clientId,
    type: "message",
    summary: `You sent a message: "${truncate(input.body, 60)}"`,
    occurredAt: now,
  });

  return message;
}

// ---------------------------------------------------------------------------
// Workouts (book + create)
// ---------------------------------------------------------------------------

export async function listWorkouts(clientId: string) {
  return db.query.workouts.findMany({
    where: eq(workouts.clientId, clientId),
    orderBy: [asc(workouts.date)],
    with: { exercises: { orderBy: [asc(workoutExercises.position)] } },
  });
}

/**
 * Books a session (status=scheduled, has date) or creates a draft plan
 * (status=draft, has exercises). Both flows funnel through here; the zod
 * schema already enforced "scheduled ⇒ has date".
 */
export async function createWorkout(clientId: string, input: CreateWorkoutData) {
  const id = `w_${randomUUID()}`;
  const now = new Date();

  await db.insert(workouts).values({
    id,
    clientId,
    title: input.title,
    date: input.date ? new Date(input.date) : null,
    status: input.status,
  });

  if (input.exercises.length > 0) {
    await db.insert(workoutExercises).values(
      input.exercises.map((e, i) => ({
        id: `we_${randomUUID()}`,
        workoutId: id,
        exerciseId: e.exerciseId ?? null,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        position: i,
      })),
    );
  }

  await db.insert(activity).values({
    id: `a_${randomUUID()}`,
    clientId,
    type: "workout",
    summary:
      input.status === "scheduled"
        ? `You booked "${input.title}"`
        : `You created a plan: "${input.title}"`,
    occurredAt: now,
  });

  const created = await db.query.workouts.findFirst({
    where: eq(workouts.id, id),
    with: { exercises: { orderBy: [asc(workoutExercises.position)] } },
  });
  return created!;
}

// ---------------------------------------------------------------------------
// Exercises (workout-builder picker)
// ---------------------------------------------------------------------------

export async function listExercises(filter?: { muscle?: string; q?: string }) {
  const conditions = [];
  if (filter?.q) {
    conditions.push(ilike(exercises.name, `%${filter.q}%`));
  }
  if (filter?.muscle) {
    // jsonb array containment: muscle_groups @> '["chest"]'
    conditions.push(
      sql`${exercises.muscleGroups} @> ${JSON.stringify([filter.muscle])}::jsonb`,
    );
  }
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroups: exercises.muscleGroups,
      equipmentRequired: exercises.equipmentRequired,
      movementPatterns: exercises.movementPatterns,
      supportsWeight: exercises.supportsWeight,
    })
    .from(exercises)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(exercises.name))
    .limit(200);
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
