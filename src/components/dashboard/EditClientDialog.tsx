"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useUpdateClient } from "@/lib/api/hooks";
import type { ClientDetail } from "@/lib/api/schemas";
import { ResponsiveModal } from "./ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditClientDialog({
  client,
  open,
  onOpenChange,
}: {
  client: ClientDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateClient(client.id);
  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [goals, setGoals] = useState<string[]>(client.goals);
  const [thingsToKnow, setThingsToKnow] = useState(client.thingsToKnow);

  function submit() {
    update.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        goals: goals.map((g) => g.trim()).filter(Boolean),
        thingsToKnow,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const canSubmit = firstName.trim() && lastName.trim();

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit client info"
      description="Update goals, notes, and the things to keep in mind."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) submit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Goals</Label>
          <div className="space-y-2">
            {goals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) =>
                    setGoals((g) => g.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  placeholder="e.g. Run a sub-4:00 marathon"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setGoals((g) => g.filter((_, j) => j !== i))}
                  aria-label="Remove goal"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGoals((g) => [...g, ""])}
              className="gap-1.5"
            >
              <Plus className="size-4" /> Add goal
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="thingsToKnow">Things to know</Label>
          <Textarea
            id="thingsToKnow"
            value={thingsToKnow}
            onChange={(e) => setThingsToKnow(e.target.value)}
            rows={4}
            placeholder="Injuries, preferences, scheduling constraints…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
