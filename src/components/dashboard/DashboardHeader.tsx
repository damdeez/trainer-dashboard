"use client";

import Link from "next/link";
import { Dumbbell, Search } from "lucide-react";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const [open, setOpen] = useCommandPalette();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Link href="/clients" className="flex items-center gap-2 font-semibold">
        <Dumbbell className="size-5" />
        <span>Trainer Dashboard</span>
      </Link>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground gap-2"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="bg-muted hidden rounded px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </header>
  );
}
