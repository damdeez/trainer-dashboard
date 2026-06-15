"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/lib/api/hooks";
import { initials } from "@/lib/format";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * ⌘K / Ctrl-K command palette — jump straight to any client. Mounted once in
 * the dashboard header; opens via keyboard shortcut or the header button.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data: clients } = useClients();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function go(clientId: string) {
    onOpenChange(false);
    router.push(`/clients/${clientId}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search clients…" />
      <CommandList>
        <CommandEmpty>No clients found.</CommandEmpty>
        <CommandGroup heading="Clients">
          {clients?.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.firstName} ${c.lastName}`}
              onSelect={() => go(c.id)}
            >
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">
                  {initials(c.firstName, c.lastName)}
                </AvatarFallback>
              </Avatar>
              {c.firstName} {c.lastName}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Convenience hook so the header can own the open state. */
export function useCommandPalette() {
  return useState(false);
}
