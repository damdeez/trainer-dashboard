"use client";

import { useState } from "react";
import Link from "next/link";
import { CommandPalette } from "./CommandPalette";
import { FutureLogo } from "./FutureLogo";
import { UserMenu } from "./UserMenu";

export function DashboardHeader() {
  // The ⌘K command palette has no on-screen trigger — the directory's own
  // search field is the primary affordance, so the palette stays as a
  // keyboard-only power-user shortcut to avoid a second visible "search".
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Link href="/clients" className="flex items-center gap-2.5 font-semibold">
        <FutureLogo className="h-6 w-auto" />
        <span>Dashboard</span>
      </Link>

      <UserMenu />

      <CommandPalette open={open} onOpenChange={setOpen} />
    </header>
  );
}
