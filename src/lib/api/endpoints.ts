import { z } from "zod";
import { apiFetch } from "./fetcher";
import {
  clientSummarySchema,
  clientDetailSchema,
  messageSchema,
  workoutSchema,
  exerciseSchema,
  type CreateMessageInput,
  type CreateWorkoutInput,
  type UpdateClientInput,
} from "./schemas";

/**
 * Query keys — centralised so mutations can invalidate precisely and tests
 * can reference the same keys. Hierarchical by resource + id.
 */
export const queryKeys = {
  clients: ["clients"] as const,
  client: (id: string) => ["clients", id] as const,
  messages: (id: string) => ["clients", id, "messages"] as const,
  workouts: (id: string) => ["clients", id, "workouts"] as const,
  exercises: (filter?: { muscle?: string; q?: string }) =>
    ["exercises", filter ?? {}] as const,
};

const clientListSchema = z.array(clientSummarySchema);
const messageListSchema = z.array(messageSchema);
const workoutListSchema = z.array(workoutSchema);
const exerciseListSchema = z.array(exerciseSchema);

export const api = {
  listClients: (signal?: AbortSignal) =>
    apiFetch("/api/clients", clientListSchema, { signal }),

  getClient: (id: string, signal?: AbortSignal) =>
    apiFetch(`/api/clients/${id}`, clientDetailSchema, { signal }),

  updateClient: (id: string, input: UpdateClientInput) =>
    apiFetch(`/api/clients/${id}`, clientDetailSchema, {
      method: "PATCH",
      body: input,
    }),

  listMessages: (id: string, signal?: AbortSignal) =>
    apiFetch(`/api/clients/${id}/messages`, messageListSchema, { signal }),

  sendMessage: (id: string, input: CreateMessageInput) =>
    apiFetch(`/api/clients/${id}/messages`, messageSchema, {
      method: "POST",
      body: input,
    }),

  listWorkouts: (id: string, signal?: AbortSignal) =>
    apiFetch(`/api/clients/${id}/workouts`, workoutListSchema, { signal }),

  createWorkout: (id: string, input: CreateWorkoutInput) =>
    apiFetch(`/api/clients/${id}/workouts`, workoutSchema, {
      method: "POST",
      body: input,
    }),

  listExercises: (filter?: { muscle?: string; q?: string }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filter?.muscle) params.set("muscle", filter.muscle);
    if (filter?.q) params.set("q", filter.q);
    const qs = params.toString();
    return apiFetch(
      `/api/exercises${qs ? `?${qs}` : ""}`,
      exerciseListSchema,
      { signal },
    );
  },
};
