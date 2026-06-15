// Env is loaded by the `db:seed` script via tsx's --env-file-if-exists flag
// (loaded before module evaluation, so ./client sees DATABASE_URL on import).
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "./client";
import {
  clients,
  exercises,
  workouts,
  workoutExercises,
  messages,
  activity,
} from "./schema";

// The exercises JSON ships snake_case keys (the upstream catalog format).
// Drizzle's insert expects the schema's camelCase property names, so map
// explicitly — otherwise unknown keys are silently dropped and every jsonb
// column falls back to its `[]` / boolean default.
type RawExercise = {
  id: string;
  name: string;
  muscle_groups: string[];
  joints_loaded: string[];
  movement_patterns: string[];
  equipment_required: string[];
  is_bilateral: boolean;
  side: string | null;
  priority_tier: number | null;
  is_reps: boolean;
  is_duration: boolean;
  supports_weight: boolean;
  estimated_rep_duration: number | null;
  bilateral_pair_id: string | null;
};

function toExerciseRow(e: RawExercise): typeof exercises.$inferInsert {
  return {
    id: e.id,
    name: e.name,
    muscleGroups: e.muscle_groups,
    jointsLoaded: e.joints_loaded,
    movementPatterns: e.movement_patterns,
    equipmentRequired: e.equipment_required,
    isBilateral: e.is_bilateral,
    side: e.side,
    priorityTier: e.priority_tier,
    isReps: e.is_reps,
    isDuration: e.is_duration,
    supportsWeight: e.supports_weight,
    estimatedRepDuration: e.estimated_rep_duration,
    bilateralPairId: e.bilateral_pair_id,
  };
}

type SeedClient = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  goals: string[];
  thingsToKnow: string;
  upcomingWorkouts: {
    id: string;
    date: string;
    title: string;
    exercises: { exerciseId: string; name: string; sets: number; reps: number }[];
  }[];
  recentActivity: {
    id: string;
    type: "workout" | "message" | "note";
    date: string;
    summary: string;
  }[];
};

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "src/db/data", file), "utf8"));
}

async function main() {
  const exerciseRows = load<RawExercise[]>("exercises.json").map(toExerciseRow);
  const clientRows = load<SeedClient[]>("clients.json");

  console.log("Clearing existing data…");
  // Order matters: children before parents (FKs cascade, but explicit is clear).
  await db.delete(workoutExercises);
  await db.delete(workouts);
  await db.delete(messages);
  await db.delete(activity);
  await db.delete(clients);
  await db.delete(exercises);

  console.log(`Seeding ${exerciseRows.length} exercises…`);
  await db.insert(exercises).values(exerciseRows);

  console.log(`Seeding ${clientRows.length} clients…`);
  for (const c of clientRows) {
    await db.insert(clients).values({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      avatarUrl: c.avatarUrl,
      goals: c.goals,
      thingsToKnow: c.thingsToKnow,
    });

    for (const w of c.upcomingWorkouts) {
      await db.insert(workouts).values({
        id: w.id,
        clientId: c.id,
        title: w.title,
        date: new Date(w.date),
        status: "scheduled",
      });
      if (w.exercises.length) {
        await db.insert(workoutExercises).values(
          w.exercises.map((e, i) => ({
            id: randomUUID(),
            workoutId: w.id,
            exerciseId: e.exerciseId,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            position: i,
          })),
        );
      }
    }

    // Recent activity → timeline rows. Message-type entries also seed an
    // initial chat thread so the chat view isn't empty on first load.
    if (c.recentActivity.length) {
      await db.insert(activity).values(
        c.recentActivity.map((a) => ({
          id: a.id,
          clientId: c.id,
          type: a.type,
          summary: a.summary,
          occurredAt: new Date(a.date),
        })),
      );
    }
    const seededMessages = c.recentActivity
      .filter((a) => a.type === "message")
      .map((a) => ({
        id: `m_${a.id}`,
        clientId: c.id,
        sender: "client" as const,
        body: a.summary,
        createdAt: new Date(a.date),
      }));
    if (seededMessages.length) {
      await db.insert(messages).values(seededMessages);
    }
  }

  console.log("Seed complete ✅");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
