"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api/endpoints";
import type {
  ClientDetail,
  CreateWorkoutInput,
  Message,
  UpdateClientInput,
} from "@/lib/api/schemas";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: ({ signal }) => api.listClients(signal),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.client(id) : ["clients", "none"],
    queryFn: ({ signal }) => api.getClient(id!, signal),
    enabled: !!id,
  });
}

export function useMessages(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.messages(id) : ["clients", "none", "messages"],
    queryFn: ({ signal }) => api.listMessages(id!, signal),
    enabled: !!id,
  });
}

export function useExercises(filter: { muscle?: string; q?: string }) {
  return useQuery({
    queryKey: queryKeys.exercises(filter),
    queryFn: ({ signal }) => api.listExercises(filter, signal),
    staleTime: 5 * 60_000, // catalog is effectively static
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Send a chat message — the showcase optimistic mutation. We immediately
 * paint the coach's message (with a temp id), then reconcile with the server
 * row on success, or roll back to the prior thread + toast on failure.
 */
export function useSendMessage(clientId: string) {
  const qc = useQueryClient();
  const key = queryKeys.messages(clientId);

  return useMutation({
    mutationFn: (body: string) => api.sendMessage(clientId, { body }),
    onMutate: async (body: string) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key) ?? [];
      const optimistic: Message = {
        id: `optimistic_${Date.now()}`,
        clientId,
        sender: "coach",
        body,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<Message[]>(key, [...previous, optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (error, _body, context) => {
      if (context) {
        qc.setQueryData(key, context.previous);
      }
      toast.error("Message failed to send", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
    onSuccess: (saved, _body, context) => {
      // Swap the optimistic placeholder for the persisted row.
      qc.setQueryData<Message[]>(key, (cur) =>
        (cur ?? []).map((m) => (m.id === context?.optimisticId ? saved : m)),
      );
    },
    onSettled: () => {
      // Keep the activity feed (part of client detail) in sync.
      qc.invalidateQueries({ queryKey: queryKeys.client(clientId) });
    },
  });
}

export function useCreateWorkout(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkoutInput) =>
      api.createWorkout(clientId, input),
    onSuccess: (workout) => {
      qc.invalidateQueries({ queryKey: queryKeys.client(clientId) });
      qc.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success(
        workout.status === "scheduled" ? "Workout booked" : "Plan created",
      );
    },
    onError: (error) => {
      toast.error("Couldn't save workout", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}

export function useUpdateClient(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClientInput) => api.updateClient(clientId, input),
    onSuccess: (client: ClientDetail) => {
      qc.setQueryData(queryKeys.client(clientId), client);
      qc.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success("Client info updated");
    },
    onError: (error) => {
      toast.error("Couldn't update client", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}
