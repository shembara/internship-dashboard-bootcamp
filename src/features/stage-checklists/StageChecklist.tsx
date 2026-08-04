"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type {
  StageChecklistDto,
  StageChecklistItemDto,
} from "@/lib/stage-checklists/types";

const columns = [
  { status: "todo", title: "To do" },
  { status: "inProgress", title: "In progress" },
  { status: "done", title: "Done" },
] as const;

function TaskCard({
  item,
  onStatusChange,
  pending,
}: {
  item: StageChecklistItemDto;
  onStatusChange: (status: StageChecklistItemDto["status"]) => void;
  pending: boolean;
}) {
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
      {item.reviewedAt ? (
        <p className="mt-3 text-xs font-medium text-[var(--brand-strong)]">
          Mentor reviewed
        </p>
      ) : null}
      {item.canComplete ? (
      <p className="mt-3 text-xs text-muted-foreground">
        Drag this task to another column to change its status.
      </p>
    ) : null}
      {item.lockedForIntern ? (
        <p className="mt-3 text-xs text-muted-foreground">
          This mentor-reviewed task is locked.
        </p>
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
  onSubmit: (label: string, type: "required" | "recommended") => Promise<boolean>;
  pending: boolean;
  close: () => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"required" | "recommended">("required");
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await onSubmit(label, type)) close();
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

  async function mutate(url: string, body: object, key: string) {
    if (pending) return false;
    setPending(key);
    setError("");
    try {
      const response = await fetch(url, {
        method: key === "stage" || key === "add" ? "POST" : "PATCH",
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
                  onSubmit={(label, type) =>
                    mutate(
                      `/api/internships/${internshipId}/stage-checklist/tasks`,
                      { stage: checklist.stage, label, type },
                      "add",
                    )
                  }
                />
              )}
            </Modal>
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
      {!checklist.readyToComplete && checklist.canCompleteStage ? (
        <p className="text-sm text-muted-foreground">
          All required tasks must be in Done before the next stage can be approved.
        </p>
      ) : null}
      {checklist.latestReviewRequest ? (
        <p className="rounded-lg border border-[var(--brand-soft)] bg-[var(--brand-soft)]/35 p-3 text-sm">
          <span className="font-medium">Latest mentor feedback:</span>{" "}
          {checklist.latestReviewRequest}
        </p>
      ) : null}
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
                    pending={pending === item.key}
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
              {column.status === "done" && checklist.canReviewDoneTasks ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={isPending}
                    onClick={() =>
                      mutate(
                        `/api/internships/${internshipId}/stage-checklist/items/review`,
                        { stage: checklist.stage, action: "approve" },
                        "review-done",
                      )
                    }
                  >
                    {pending === "review-done" ? "Saving…" : "Confirm mentor review"}
                  </Button>
                  <Modal
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
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
                              action: "requestChanges",
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
