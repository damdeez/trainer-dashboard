import { NextResponse } from "next/server";
import { z } from "zod";

/** JSON error in the shape `apiErrorSchema` expects, so the client fetcher
 *  can parse it uniformly. */
export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Parse + validate a request body against a zod schema. Returns either the
 * typed data or a ready-to-return 400 response with flattened field errors.
 * Usage: `const parsed = await readBody(req, schema); if ("response" in parsed) return parsed.response;`
 */
export async function readBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: apiError("Invalid JSON body.", 400) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      response: apiError("Validation failed.", 400, z.flattenError(result.error)),
    };
  }
  return { data: result.data };
}

/** Wrap a handler so any thrown error becomes a 500 instead of crashing. */
export async function withErrors(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    console.error("[api] unhandled error:", err);
    return apiError("Something went wrong on the server.", 500);
  }
}
