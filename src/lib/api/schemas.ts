import { z } from "zod";
import {
  workoutStatuses,
  messageSenders,
  activityTypes,
} from "@/db/schema";

/**
 * The API contract, in one place.
 * --------------------------------
 * These zod schemas are the single source of truth shared by the route
 * handlers (which validate input and shape output) and the client fetchers
 * (which parse responses, so the UI is typed end-to-end). Dates cross the
 * wire as ISO strings — JSON has no Date type — so response schemas use
 * `z.string()` for timestamps and the UI parses them with date-fns.
 */

// ---------------------------------------------------------------------------
// Entities (response shapes)
// ---------------------------------------------------------------------------

/** Lightweight row for the directory list — no nested workouts/activity. */
export const clientSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
  goals: z.array(z.string()),
  /** Next scheduled session, if any — drives the "next up" hint in the list. */
  nextWorkoutDate: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
});
export type ClientSummary = z.infer<typeof clientSummarySchema>;

export const workoutExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string().nullable(),
  name: z.string(),
  sets: z.number().int(),
  reps: z.number().int(),
  position: z.number().int(),
});
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

export const workoutSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  title: z.string(),
  date: z.string().nullable(),
  status: z.enum(workoutStatuses),
  createdAt: z.string(),
  exercises: z.array(workoutExerciseSchema),
});
export type Workout = z.infer<typeof workoutSchema>;

export const messageSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  sender: z.enum(messageSenders),
  body: z.string(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof messageSchema>;

export const activityItemSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  type: z.enum(activityTypes),
  summary: z.string(),
  occurredAt: z.string(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroups: z.array(z.string()),
  equipmentRequired: z.array(z.string()),
  movementPatterns: z.array(z.string()),
  supportsWeight: z.boolean(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

/** Full client context returned by GET /api/clients/[id]. */
export const clientDetailSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
  goals: z.array(z.string()),
  thingsToKnow: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  workouts: z.array(workoutSchema),
  activity: z.array(activityItemSchema),
});
export type ClientDetail = z.infer<typeof clientDetailSchema>;

// ---------------------------------------------------------------------------
// Request bodies (input validation)
// ---------------------------------------------------------------------------

/** PATCH /api/clients/[id] — edit info. All fields optional (partial update). */
export const updateClientSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    goals: z.array(z.string().trim().min(1).max(200)).max(20),
    thingsToKnow: z.string().max(2000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required.",
  });
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/** POST /api/clients/[id]/messages — send a chat message (coach side). */
export const createMessageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty.").max(4000),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

/**
 * POST /api/clients/[id]/workouts — models both coach actions:
 *  - "book"   → a scheduled session with a date (exercises optional)
 *  - "create" → a draft plan assembled from exercises (date optional)
 * One body, distinguished by `status`; a refinement enforces the invariant
 * that a scheduled workout must carry a date.
 */
export const workoutExerciseInputSchema = z.object({
  exerciseId: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
});
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseInputSchema>;

export const createWorkoutSchema = z
  .object({
    title: z.string().trim().min(1, "Give the workout a title.").max(120),
    date: z.string().datetime().nullable().optional(),
    status: z.enum(["scheduled", "draft"]).default("scheduled"),
    exercises: z.array(workoutExerciseInputSchema).max(50).default([]),
  })
  .refine((v) => v.status !== "scheduled" || !!v.date, {
    message: "A scheduled workout needs a date.",
    path: ["date"],
  });
/** What the client sends — `status`/`exercises` have defaults, so optional. */
export type CreateWorkoutInput = z.input<typeof createWorkoutSchema>;
/** What handlers receive post-validation — defaults applied, fields present. */
export type CreateWorkoutData = z.output<typeof createWorkoutSchema>;

// ---------------------------------------------------------------------------
// Error envelope
// ---------------------------------------------------------------------------

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
