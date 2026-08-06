"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type {
  StageChecklistDto,
  StageChecklistItemDto,
} from "@/lib/stage-checklists/types";
import {
  customTaskPointLimits,
  internshipSkills,
  type InternshipSkill,
} from "@/lib/skills/types";

const columns = [
  { status: "todo", title: "To do" },
  { status: "inProgress", title: "In progress" },
  { status: "done", title: "Done" },
] as const;

function TaskCard({
  item,
  onStatusChange,
  onDelete,
  pending,
}: {
  item: StageChecklistItemDto;
  onStatusChange: (status: StageChecklistItemDto["status"]) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const nextStatus =
    item.status === "todo"
      ? "inProgress"
      : item.status === "inProgress"
        ? "done"
        : "todo";
  const actionLabel =
    item.status === "todo"
      ? "Start"
      : item.status === "inProgress"
        ? "Mark done"
        : "Reopen";
  return (
    <article
      draggable={item.canComplete && !pending}
      className="cursor-grab rounded-xl border bg-card p-3 shadow-sm active:cursor-grabbing"
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.key);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{item.label}</p>
        <span
          className={
            item.type === "required"
              ? "shrink-0 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-strong)]"
              : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
          }
        >
          {item.type === "required" ? "Required" : "Recommended"}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {item.skills
          .map((skill) => internshipSkills.find((option) => option.value === skill)?.label)
          .filter(Boolean)
          .join(" · ")}
      </p>
      {item.canComplete ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Drag to another column or use the button.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onStatusChange(nextStatus)}
          >
            {pending ? "Saving…" : actionLabel}
          </Button>
        </div>
      ) : null}
      {item.canDelete ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={pending}
          onClick={onDelete}
        >
          {pending ? "Deleting…" : "Delete task"}
        </Button>
      ) : null}
    </article>
  );
}

function RequestChangesForm({
  onSubmit,
  pending,
  close,
}: {
  onSubmit: (comment: string) => Promise<boolean>;
  pending: boolean;
  close: () => void;
}) {
  const [comment, setComment] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await onSubmit(comment)) close();
      }}
    >
      <label className="block space-y-1.5 text-sm font-medium">
        Requested changes
        <textarea
          className="min-h-28 w-full rounded-lg border bg-background px-3 py-2 font-normal"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          required
          maxLength={1000}
        />
      </label>
      <Button type="submit" disabled={pending || !comment.trim()}>
        {pending ? "Sending…" : "Request changes"}
      </Button>
    </form>
  );
}

function AddTaskForm({
  onSubmit,
  pending,
  close,
}: {
  onSubmit: (
    label: string,
    type: "required" | "recommended",
    skills: InternshipSkill[],
    weight: number,
  ) => Promise<boolean>;
  pending: boolean;
  close: () => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"required" | "recommended">("required");
  const [primarySkill, setPrimarySkill] = useState<InternshipSkill>("technical");
  const [secondarySkill, setSecondarySkill] = useState<InternshipSkill | "">("");
  const [weight, setWeight] = useState("1");
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const skills = [primarySkill, secondarySkill].filter(
          (skill): skill is InternshipSkill => Boolean(skill),
        );
        if (await onSubmit(label, type, skills, Number(weight))) close();
      }}
    >
      <label className="block space-y-1.5 text-sm font-medium">
        Task name
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
          maxLength={160}
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Primary skill
        <select
          className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          value={primarySkill}
          onChange={(event) => setPrimarySkill(event.target.value as InternshipSkill)}
        >
          {internshipSkills.map((skill) => (
            <option key={skill.value} value={skill.value}>{skill.label}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Secondary skill (optional)
        <select
          className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          value={secondarySkill}
          onChange={(event) => setSecondarySkill(event.target.value as InternshipSkill | "")}
        >
          <option value="">None</option>
          {internshipSkills.filter((skill) => skill.value !== primarySkill).map((skill) => (
            <option key={skill.value} value={skill.value}>{skill.label}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Weight
        <input
          type="number"
          min={customTaskPointLimits.min}
          max={customTaskPointLimits.max}
          className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          required
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Type
        <select
          className="w-full rounded-lg border bg-background px-3 py-2 font-normal"
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
        >
          <option value="required">Required</option>
          <option value="recommended">Recommended</option>
        </select>
      </label>
      <Button type="submit" disabled={pending || !label.trim()}>
        {pending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}

export function StageChecklist({
  internshipId,
  checklist,
}: {
  internshipId: string;
  checklist: StageChecklistDto;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  const renderedChecklist = useRef(checklist);
  const isPending = Boolean(pending);
  const requiredProgress =
    checklist.requiredTotalCount === 0
      ? 0
      : Math.round(
          (checklist.requiredCompletedCount / checklist.requiredTotalCount) * 100,
        );

  useEffect(() => {
    if (renderedChecklist.current !== checklist) {
      renderedChecklist.current = checklist;
      setPending(undefined);
    }
  }, [checklist]);

  async function mutate(
    url: string,
    body: object,
    key: string,
    method: "POST" | "PATCH" | "DELETE" = "PATCH",
  ) {
    if (pending) return false;
    setPending(key);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => undefined)) as
          { error?: string } | undefined;
        throw new Error(data?.error ?? "Could not update the task board.");
      }
      router.refresh();
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update the task board.",
      );
      setPending(undefined);
      return false;
    }
  }

  return (
    <section
      className="mt-6 space-y-5 border-t pt-5"
      aria-labelledby="stage-checklist-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="stage-checklist-heading" className="text-lg font-semibold">
            {checklist.stageLabel} tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            {checklist.requiredCompletedCount} of {checklist.requiredTotalCount}{" "}
            required tasks done
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--brand-strong)]">
            {checklist.reviewStatus === "underReview"
              ? "Under mentor review"
              : checklist.reviewStatus === "completed"
                ? "Completed"
                : "Active"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {checklist.canAddTasks ? (
            <Modal
              trigger={
                <Button type="button" variant="outline">
                  Add task
                </Button>
              }
              title="Add a task"
              description="Add a task for this stage."
            >
              {(close) => (
                <AddTaskForm
                  close={close}
                  pending={isPending}
                  onSubmit={(label, type, skills, weight) =>
                    mutate(
                      `/api/internships/${internshipId}/stage-checklist/tasks`,
                      { stage: checklist.stage, label, type, skills, weight },
                      "add",
                      "POST",
                    )
                  }
                />
              )}
            </Modal>
          ) : null}
          {checklist.canCompleteStage ? (
            <div className="flex gap-2">
              <Modal
                trigger={
                  <Button type="button" variant="outline">
                    Request changes
                  </Button>
                }
                title="Request changes"
                description="Explain what the intern needs to change."
              >
                {(close) => (
                  <RequestChangesForm
                    close={close}
                    pending={isPending}
                    onSubmit={(comment) =>
                      mutate(
                        `/api/internships/${internshipId}/stage-checklist/items/review`,
                        {
                          stage: checklist.stage,
                          comment,
                        },
                        "request-changes",
                      )
                    }
                  />
                )}
              </Modal>
            </div>
          ) : null}
          {checklist.canCompleteStage ? (
            <Button
              type="button"
              disabled={!checklist.readyToComplete || isPending}
              onClick={() =>
                mutate(
                  `/api/internships/${internshipId}/stage-checklist/complete`,
                  { stage: checklist.stage },
                  "stage",
                  "POST",
                )
              }
            >
              {pending === "stage" ? "Approving…" : "Approve next stage"}
            </Button>
          ) : null}
        </div>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Required task progress"
        aria-valuemin={0}
        aria-valuemax={checklist.requiredTotalCount}
        aria-valuenow={checklist.requiredCompletedCount}
        aria-valuetext={`${checklist.requiredCompletedCount} of ${checklist.requiredTotalCount} required tasks done`}
      >
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-[width]"
          style={{ width: `${requiredProgress}%` }}
        />
      </div>
      {checklist.reviewStatus === "active" && checklist.canCompleteStage ? (
        <p className="text-sm text-muted-foreground">
          Move every Required task to Done to send this stage to mentor review.
        </p>
      ) : null}
      {checklist.latestReviewRequest ? (
        <p className="rounded-lg border border-[var(--brand-soft)] bg-[var(--brand-soft)]/35 p-3 text-sm">
          <span className="font-medium">Latest mentor feedback:</span>{" "}
          {checklist.latestReviewRequest}
        </p>
      ) : null}
      <section className="rounded-xl border bg-muted/30 p-3" aria-label="Skill progress">
        <h3 className="font-semibold">Skill progress</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {checklist.skillProgress.map((skill) => (
            <div key={skill.skill} className="flex items-center justify-between gap-2 text-sm">
              <span>{skill.label}</span>
              <span className="text-muted-foreground">
                {skill.completedPoints}/{skill.maxPoints} · {skill.percentage}%
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((column) => {
          const items = checklist.items.filter((item) => item.status === column.status);
          return (
            <section
              key={column.status}
              className="min-h-48 rounded-xl border bg-muted/30 p-3"
              aria-label={column.title}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const itemKey = event.dataTransfer.getData("text/plain");
                const item = checklist.items.find(
                  (candidate) => candidate.key === itemKey,
                );
                if (item && item.status !== column.status && item.canComplete) {
                  mutate(
                    `/api/internships/${internshipId}/stage-checklist/items`,
                    { stage: checklist.stage, itemKey, status: column.status },
                    itemKey,
                  );
                }
              }}
            >
              <h3 className="mb-3 font-semibold">
                {column.title}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {items.length}
                </span>
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <TaskCard
                    key={item.key}
                    item={item}
                    pending={pending === item.key || pending === `delete-${item.key}`}
                    onDelete={() =>
                      mutate(
                        `/api/internships/${internshipId}/stage-checklist/tasks`,
                        { stage: checklist.stage, itemKey: item.key },
                        `delete-${item.key}`,
                        "DELETE",
                      )
                    }
                    onStatusChange={(status) =>
                      mutate(
                        `/api/internships/${internshipId}/stage-checklist/items`,
                        { stage: checklist.stage, itemKey: item.key, status },
                        item.key,
                      )
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
