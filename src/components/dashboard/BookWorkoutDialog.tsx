"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCreateWorkout } from "@/lib/hooks/useApi";
import { cn } from "@/lib/utils";
import { ResponsiveModal } from "./ResponsiveModal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BookWorkoutDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookWorkoutDialog({
  clientId,
  open,
  onOpenChange,
}: BookWorkoutDialogProps) {
  const create = useCreateWorkout(clientId);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");

  function reset() {
    setTitle("");
    setDate(undefined);
    setTime("09:00");
  }

  function submit() {
    if (!date || !title.trim()) {
      return;
    }
    const [h, m] = time.split(":").map(Number);
    const when = new Date(date);
    when.setHours(h ?? 9, m ?? 0, 0, 0);
    create.mutate(
      { title: title.trim(), date: when.toISOString(), status: "scheduled" },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  const canSubmit = !!date && !!title.trim();

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Book a workout"
      description="Schedule a session at a specific date and time."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) {
            submit();
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="workout-title">Session title</Label>
          <Input
            id="workout-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tempo run + posterior chain"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-start gap-2 font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-4" />
                {date ? format(date, "MMM d, yyyy") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={{ before: new Date() }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workout-time">Time</Label>
            <Input
              id="workout-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Booking…" : "Book session"}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
