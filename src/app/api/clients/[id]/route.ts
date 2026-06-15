import { NextResponse, type NextRequest } from "next/server";
import { getClientDetail, updateClient } from "@/db/queries";
import { updateClientSchema } from "@/lib/api/schemas";
import { apiError, readBody, withErrors } from "@/lib/api/server";

type Context = { params: Promise<{ id: string }> };

export function GET(_req: NextRequest, { params }: Context) {
  return withErrors(async () => {
    const { id } = await params;
    const client = await getClientDetail(id);
    if (!client) return apiError("Client not found.", 404);
    return NextResponse.json(client);
  });
}

export function PATCH(req: NextRequest, { params }: Context) {
  return withErrors(async () => {
    const { id } = await params;
    const parsed = await readBody(req, updateClientSchema);
    if ("response" in parsed) return parsed.response;

    const updated = await updateClient(id, parsed.data);
    if (!updated) return apiError("Client not found.", 404);
    return NextResponse.json(updated);
  });
}
