import { z } from "zod";
import { apiErrorSchema } from "./schemas";

/**
 * Error thrown by every fetcher on a non-2xx response. Carries the HTTP
 * status and the server's message so React Query's `onError` (and our
 * toasts) can show something useful and rollback paths can branch on status.
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * Typed fetch: issues the request, throws ApiRequestError on failure, and
 * parses a successful body with the given zod schema so callers get a fully
 * typed, validated result (no `any` leaking out of the network boundary).
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(path, {
    method,
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let details: unknown;
    try {
      const parsed = apiErrorSchema.safeParse(await res.json());
      if (parsed.success) {
        message = parsed.data.error;
        details = parsed.data.details;
      }
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiRequestError(message, res.status, details);
  }

  return schema.parse(await res.json());
}
