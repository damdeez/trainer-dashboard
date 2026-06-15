import { NextResponse, type NextRequest } from "next/server";
import { clientExists, createWorkout, listWorkouts } from "@/db/queries";
import { createWorkoutSchema } from "@/lib/api/schemas";
import { apiError, readBody, withErrors } from "@/lib/api/server";

type Context = { params: Promise<{ id: string }> };

export function GET(_req: NextRequest, { params }: Context) {
  return withErrors(async () => {
    const { id } = await params;
    if (!(await clientExists(id))) return apiError("Client not found.", 404);
    return NextResponse.json(await listWorkouts(id));
  });
}

export function POST(req: NextRequest, { params }: Context) {
  return withErrors(async () => {
    const { id } = await params;
    if (!(await clientExists(id))) return apiError("Client not found.", 404);

    const parsed = await readBody(req, createWorkoutSchema);
    if ("response" in parsed) return parsed.response;

    const workout = await createWorkout(id, parsed.data);
    return NextResponse.json(workout, { status: 201 });
  });
}
