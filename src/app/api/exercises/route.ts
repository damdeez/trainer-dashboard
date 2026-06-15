import { NextResponse, type NextRequest } from "next/server";
import { listExercises } from "@/db/queries";
import { withErrors } from "@/lib/api/server";

export function GET(req: NextRequest) {
  return withErrors(async () => {
    const { searchParams } = req.nextUrl;
    const muscle = searchParams.get("muscle") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    return NextResponse.json(await listExercises({ muscle, q }));
  });
}
