"use client";

import { useEffect, useRef, useState } from "react";
import { useMessages, useSendMessage } from "@/lib/hooks/useApi";
import type { Message } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatSkeleton } from "./Skeletons";

interface ChatBubbleProps {
  message: Message;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isCoach = message.sender === "coach";
  const isPending = message.id.startsWith("optimistic_");
  return (
    <div className={cn("flex", isCoach ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          isCoach
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm",
          isPending && "opacity-60",
        )}
      >
        <p className="wrap-break-word whitespace-pre-wrap">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isCoach ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {isPending ? "Sending…" : formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  clientId: string;
}

export function ChatPanel({ clientId }: ChatPanelProps) {
  const { data: messages, isLoading, isError, refetch } = useMessages(clientId);
  const sendMessage = useSendMessage(clientId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stick to the bottom as messages arrive (including optimistic ones).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  function send() {
    const body = draft.trim();
    if (!body) {
      return;
    }
    setDraft("");
    sendMessage.mutate(body);
  }

  return (
    <div className='flex h-full flex-col'>
      <div ref={scrollRef} className='flex-1 space-y-3 overflow-y-auto p-4'>
        {isLoading && <ChatSkeleton />}

        {isError && (
          <div className='text-muted-foreground py-8 text-center text-sm'>
            <p>Couldn&apos;t load the conversation.</p>
            <button
              onClick={() => refetch()}
              className='text-foreground mt-2 underline underline-offset-4'
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && messages?.length === 0 && (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            No messages yet. Say hello 👋
          </p>
        )}

        {messages?.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
      </div>

      <form
        className='flex items-end gap-2 border-t p-3'
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder='Message your client…  (Enter to send, Shift+Enter for newline)'
          rows={1}
          className='max-h-32 min-h-10 flex-1 resize-none'
          aria-label='Message'
        />
        <Button className="w-20 min-h-10" type='submit' size='icon' disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
