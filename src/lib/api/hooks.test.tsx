import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSendMessage } from "./hooks";
import { api, queryKeys } from "./endpoints";
import { ApiRequestError } from "./fetcher";
import type { Message } from "./schemas";

// Toasts are a side-effect we assert on, not exercise.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
import { toast } from "sonner";

const CLIENT_ID = "c_test";
const messagesKey = queryKeys.messages(CLIENT_ID);

function existingThread(): Message[] {
  return [
    {
      id: "m_seed",
      clientId: CLIENT_ID,
      sender: "client",
      body: "Hey coach!",
      createdAt: "2026-06-01T12:00:00.000Z",
    },
  ];
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useSendMessage (optimistic chat)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rolls back the optimistic message and toasts when the API fails", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const seed = existingThread();
    qc.setQueryData(messagesKey, seed);

    // A deferred lets us observe the optimistic state *before* the request
    // settles, then reject on demand — otherwise the rollback races the assert.
    let rejectSend!: (err: unknown) => void;
    const pending = new Promise<Message>((_, reject) => {
      rejectSend = reject;
    });
    const sendSpy = vi.spyOn(api, "sendMessage").mockReturnValue(pending);

    const { result } = renderHook(() => useSendMessage(CLIENT_ID), {
      wrapper: makeWrapper(qc),
    });

    act(() => {
      result.current.mutate("Great session today!");
    });

    // Optimistic write lands immediately: the new coach message is visible.
    await waitFor(() => {
      const thread = qc.getQueryData<Message[]>(messagesKey) ?? [];
      expect(thread).toHaveLength(2);
      expect(thread[1]).toMatchObject({
        sender: "coach",
        body: "Great session today!",
      });
    });

    // Now fail the request: the cache rolls back to exactly the prior thread
    // and an error toast is shown.
    await act(async () => {
      rejectSend(new ApiRequestError("Server exploded", 500));
      await pending.catch(() => {});
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<Message[]>(messagesKey)).toEqual(seed);
    expect(toast.error).toHaveBeenCalledWith(
      "Message failed to send",
      expect.objectContaining({ description: "Server exploded" }),
    );
    expect(sendSpy).toHaveBeenCalledWith(CLIENT_ID, {
      body: "Great session today!",
    });
  });

  it("replaces the optimistic message with the persisted row on success", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    qc.setQueryData(messagesKey, existingThread());

    const persisted: Message = {
      id: "m_real_123",
      clientId: CLIENT_ID,
      sender: "coach",
      body: "Great session today!",
      createdAt: "2026-06-14T18:00:00.000Z",
    };
    vi.spyOn(api, "sendMessage").mockResolvedValue(persisted);

    const { result } = renderHook(() => useSendMessage(CLIENT_ID), {
      wrapper: makeWrapper(qc),
    });

    act(() => {
      result.current.mutate("Great session today!");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const thread = qc.getQueryData<Message[]>(messagesKey) ?? [];
    expect(thread).toHaveLength(2);
    // The temporary optimistic id is gone, replaced by the server's row.
    expect(thread[1].id).toBe("m_real_123");
    expect(thread.some((m) => m.id.startsWith("optimistic_"))).toBe(false);
  });
});
