import { NextResponse } from "next/server";
import { listClientSummaries } from "@/db/queries";
import { withErrors } from "@/lib/api/server";

export function GET() {
  return withErrors(async () => {
    const clients = await listClientSummaries();
    return NextResponse.json(clients);
  });
}
