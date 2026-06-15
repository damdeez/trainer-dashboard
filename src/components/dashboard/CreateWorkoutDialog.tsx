"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Search, X } from "lucide-react";
import { useCreateWorkout, useExercises } from "@/lib/api/hooks";
import type { WorkoutExerciseInput } from "@/lib/api/schemas";
import { ResponsiveModal } from "./ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Picked = WorkoutExerciseInput & { exerciseId: string };

export function CreateWorkoutDialog({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateWorkout(clientId);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const { data: results, isLoading } = useExercises({ q: query.trim() || undefined });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function add(ex: { id: string; name: string }) {
    if (picked.some((p) => p.exerciseId === ex.id)) return;
    setPicked((p) => [...p, { exerciseId: ex.id, name: ex.name, sets: 3, reps: 10 }]);
  }

  function update(id: string, patch: Partial<Picked>) {
    setPicked((p) => p.map((x) => (x.exerciseId === id ? { ...x, ...patch } : x)));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setPicked((items) => {
        const from = items.findIndex((i) => i.exerciseId === active.id);
        const to = items.findIndex((i) => i.exerciseId === over.id);
        return arrayMove(items, from, to);
      });
    }
  }

  function reset() {
    setTitle("");
    setQuery("");
    setPicked([]);
  }

  function submit() {
    if (!title.trim() || picked.length === 0) return;
    create.mutate(
      {
        title: title.trim(),
        status: "draft",
        exercises: picked.map(({ exerciseId, name, sets, reps }) => ({
          exerciseId,
          name,
          sets,
          reps,
        })),
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  const canSubmit = !!title.trim() && picked.length > 0;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create a workout"
      description="Assemble exercises into a plan. Drag to reorder."
      className="sm:max-w-lg"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan-title">Plan title</Label>
          <Input
            id="plan-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lower body strength — week 3"
          />
        </div>

        {/* Selected exercises (sortable) */}
        <div className="space-y-1.5">
          <Label>
            Exercises{" "}
            {picked.length > 0 && (
              <span className="text-muted-foreground">({picked.length})</span>
            )}
          </Label>
          {picked.length === 0 ? (
            <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
              Search below and add exercises to build the plan.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={picked.map((p) => p.exerciseId)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {picked.map((p) => (
                    <SortableExercise
                      key={p.exerciseId}
                      item={p}
                      onChange={(patch) => update(p.exerciseId, patch)}
                      onRemove={() =>
                        setPicked((cur) =>
                          cur.filter((x) => x.exerciseId !== p.exerciseId),
                        )
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Exercise picker */}
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises…"
              className="pl-8"
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-md border">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : results && results.length > 0 ? (
              <ul className="divide-y">
                {results.slice(0, 30).map((ex) => {
                  const already = picked.some((p) => p.exerciseId === ex.id);
                  return (
                    <li
                      key={ex.id}
                      className="flex items-center justify-between gap-2 p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate">{ex.name}</p>
                        {ex.muscleGroups.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {ex.muscleGroups.slice(0, 3).map((m) => (
                              <Badge
                                key={m}
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {m}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        disabled={already}
                        onClick={() => add(ex)}
                        aria-label={`Add ${ex.name}`}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground p-4 text-center text-sm">
                No exercises found.
              </p>
            )}
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
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? "Creating…" : "Create plan"}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function SortableExercise({
  item,
  onChange,
  onRemove,
}: {
  item: Picked;
  onChange: (patch: Partial<Picked>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.exerciseId });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cnDrag(isDragging)}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
      <NumberField
        label="sets"
        value={item.sets}
        onChange={(v) => onChange({ sets: v })}
      />
      <span className="text-muted-foreground text-xs">×</span>
      <NumberField
        label="reps"
        value={item.reps}
        onChange={(v) => onChange({ reps: v })}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={onRemove}
        aria-label={`Remove ${item.name}`}
      >
        <X className="size-4" />
      </Button>
    </li>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Input
      type="number"
      min={1}
      value={value}
      onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
      className="h-7 w-14 px-2 text-center text-sm"
      aria-label={label}
    />
  );
}

function cnDrag(isDragging: boolean) {
  return [
    "bg-background flex items-center gap-2 rounded-md border p-2",
    isDragging ? "relative z-10 shadow-md" : "",
  ].join(" ");
}
