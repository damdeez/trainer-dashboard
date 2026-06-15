import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Schema notes
 * ------------
 * - Text primary keys: the seed data ships human-readable ids ("c_maya_chen",
 *   "w_maya_01") and exercises use UUIDs. We preserve them rather than remap, so
 *   seeding is idempotent and the JSON stays the source of truth on first load.
 * - `goals` / array-ish exercise metadata live in JSONB. They're read whole,
 *   never queried by element in this app, so a relational split would be cost
 *   with no payoff.
 * - Workouts model both "book" (status=scheduled, has a date) and "create"
 *   (status=draft, has exercises, date optional) — the brief's two distinct
 *   actions, one table.
 */

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  avatarUrl: text("avatar_url"),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  thingsToKnow: text("things_to_know").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroups: jsonb("muscle_groups").$type<string[]>().notNull().default([]),
  jointsLoaded: jsonb("joints_loaded").$type<string[]>().notNull().default([]),
  movementPatterns: jsonb("movement_patterns").$type<string[]>().notNull().default([]),
  equipmentRequired: jsonb("equipment_required").$type<string[]>().notNull().default([]),
  isBilateral: boolean("is_bilateral").notNull().default(true),
  side: text("side"),
  priorityTier: integer("priority_tier"),
  isReps: boolean("is_reps").notNull().default(true),
  isDuration: boolean("is_duration").notNull().default(false),
  supportsWeight: boolean("supports_weight").notNull().default(false),
  estimatedRepDuration: doublePrecision("estimated_rep_duration"),
  bilateralPairId: text("bilateral_pair_id"),
});

export const workoutStatuses = ["scheduled", "draft", "completed"] as const;
export type WorkoutStatus = (typeof workoutStatuses)[number];

export const workouts = pgTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    // Nullable: a freshly-created draft plan may not be scheduled yet.
    date: timestamp("date", { withTimezone: true }),
    status: text("status").$type<WorkoutStatus>().notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("workouts_client_idx").on(t.clientId)],
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    // Denormalized snapshot of the name at assembly time, so a workout still
    // reads correctly even if the exercise catalog later changes.
    name: text("name").notNull(),
    sets: integer("sets").notNull().default(3),
    reps: integer("reps").notNull().default(10),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("workout_exercises_workout_idx").on(t.workoutId)],
);

export const messageSenders = ["coach", "client"] as const;
export type MessageSender = (typeof messageSenders)[number];

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    sender: text("sender").$type<MessageSender>().notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_client_idx").on(t.clientId)],
);

export const activityTypes = ["workout", "message", "note"] as const;
export type ActivityType = (typeof activityTypes)[number];

export const activity = pgTable(
  "activity",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    type: text("type").$type<ActivityType>().notNull(),
    summary: text("summary").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("activity_client_idx").on(t.clientId)],
);

export const clientsRelations = relations(clients, ({ many }) => ({
  workouts: many(workouts),
  messages: many(messages),
  activity: many(activity),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  client: one(clients, { fields: [workouts.clientId], references: [clients.id] }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  client: one(clients, { fields: [messages.clientId], references: [clients.id] }),
}));

export const activityRelations = relations(activity, ({ one }) => ({
  client: one(clients, { fields: [activity.clientId], references: [clients.id] }),
}));
