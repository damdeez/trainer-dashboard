import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

/** "2:30 PM today", "9:00 AM tomorrow", or "Jun 20, 9:00 AM". */
export function formatWorkoutDate(iso: string | null): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  const time = format(d, "h:mm a");
  if (isToday(d)) return `${time} today`;
  if (isTomorrow(d)) return `${time} tomorrow`;
  return format(d, "MMM d, h:mm a");
}

/** "3h ago", "2 days ago". */
export function formatRelative(iso: string | null): string {
  if (!iso) return "";
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

/** "2:30 PM" — for chat bubbles. */
export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
