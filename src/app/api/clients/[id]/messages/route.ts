import { NextResponse, type NextRequest } from "next/server";
import { clientExists, createMessage, listMessages } from "@/db/queries";
import { createMessageSchema } from "@/lib/api/schemas";
import { apiError, readBody, withErrors } from "@/lib/api/server";

type Context = { params: Promise<{ id: string }> };

export function GET(_req: NextRequest, { params }: Context) {
  return withErrors(async () => {
    const { id } = await params;
    if (!(await clientExists(id))) return apiError("Client not found.", 404);
    return NextResponse.json(await listMessages(id));
  });
}

export function POST(req: NextRequest, { params }: Context) {
  return withErrors(async () => {
    const { id } = await params;
    if (!(await clientExists(id))) return apiError("Client not found.", 404);

    const parsed = await readBody(req, createMessageSchema);
    if ("response" in parsed) return parsed.response;

    const message = await createMessage(id, parsed.data);
    return NextResponse.json(message, { status: 201 });
  });
}
