"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "./DashboardHeader";
import { ClientDirectory } from "./ClientDirectory";

/**
 * Responsive list-detail shell. One component tree, breakpoint-driven:
 *  - Desktop (md+): directory is a persistent left sidebar, detail on the right.
 *  - Mobile: directory is the home screen; selecting a client swaps to a
 *    full-screen detail view (and the back link in the detail returns here).
 * Selection lives in the URL (`/clients/[clientId]`), so it survives reload
 * and is shareable. We read the active segment to toggle mobile visibility.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  // null on /clients, the clientId on /clients/[clientId].
  const hasSelection = useSelectedLayoutSegment() !== null;

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader />
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "bg-background w-full shrink-0 md:w-80 md:border-r",
            hasSelection && "hidden md:block",
          )}
        >
          <ClientDirectory />
        </aside>
        <main className={cn("min-w-0 flex-1", !hasSelection && "hidden md:block")}>
          {children}
        </main>
      </div>
    </div>
  );
}
