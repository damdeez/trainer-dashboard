// @vitest-environment node
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./[id]/route";

/**
 * End-to-end persistence check for a coach action: PATCH a client through the
 * real route handler, then GET it back, proving the edit survives in Neon
 * (the brief's "must persist across reload" guarantee). Hits the live DB, so
 * it's skipped when DATABASE_URL isn't configured; the original value is
 * always restored afterwards.
 */
const hasDb = !!process.env.DATABASE_URL;
const CLIENT_ID = "c_maya_chen";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(id: string, body: unknown) {
  return new NextRequest(`http://test/api/clients/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe.skipIf(!hasDb)("client edit round-trips through API + DB", () => {
  it("persists thingsToKnow across a fresh GET", { timeout: 20_000 }, async () => {
    // Capture the original so we can restore it after the test.
    const before = await (await GET(new NextRequest("http://test"), ctx(CLIENT_ID))).json();
    const original: string = before.thingsToKnow;

    const sentinel = `Round-trip test note @ ${Date.now()}`;

    try {
      const patchRes = await PATCH(
        patchRequest(CLIENT_ID, { thingsToKnow: sentinel }),
        ctx(CLIENT_ID),
      );
      expect(patchRes.status).toBe(200);
      const patched = await patchRes.json();
      expect(patched.thingsToKnow).toBe(sentinel);

      // Re-read from the DB via a brand-new request — the change is durable.
      const after = await (
        await GET(new NextRequest("http://test"), ctx(CLIENT_ID))
      ).json();
      expect(after.thingsToKnow).toBe(sentinel);
    } finally {
      await PATCH(
        patchRequest(CLIENT_ID, { thingsToKnow: original }),
        ctx(CLIENT_ID),
      );
    }
  });

  it("returns 404 for an unknown client", async () => {
    const res = await GET(new NextRequest("http://test"), ctx("c_does_not_exist"));
    expect(res.status).toBe(404);
  });
});
