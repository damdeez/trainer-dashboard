import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeletons for the dashboard's data-driven views, kept together so
 * their shapes stay consistent and easy to tweak in one place.
 */

/** Directory list — avatar + two text lines per row. */
export function DirectorySkeleton() {
  return (
    <ul className="space-y-1" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Client context pane — header avatar/name + a few content lines. */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </div>
      <Skeleton className="h-8 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

/** Chat thread — alternating left/right message bubbles. */
export function ChatSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="ml-auto h-10 w-40" />
      <Skeleton className="h-14 w-56" />
      <Skeleton className="ml-auto h-10 w-44" />
    </div>
  );
}

/** Exercise picker results — a couple of placeholder rows. */
export function ExercisePickerSkeleton() {
  return (
    <div className="space-y-2 p-2" aria-hidden>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
