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
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

const columns = [
  { status: "todo", title: "To do", toneKey: "kanbanColumnTodo" as const },
  { status: "inProgress", title: "In progress", toneKey: "kanbanColumnProgress" as const },
  { status: "done", title: "Done", toneKey: "kanbanColumnDone" as const },
] as const;

function TaskCard({
  item,
  onStatusChange,
  onDelete,
  pending,
  variant = "default",
}: {
  item: StageChecklistItemDto;
  onStatusChange: (status: StageChecklistItemDto["status"]) => void;
  onDelete: () => void;
  pending: boolean;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
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
      className={cn(
        "cursor-grab rounded-xl border p-3 active:cursor-grabbing",
        variant === "dark"
          ? "border-white/10 bg-[#161b22]"
          : "border-border bg-card shadow-sm",
      )}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.key);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{item.label}</p>
        <span
          className={
            item.type === "required" ? styles.requiredBadge : styles.recommendedBadge
          }
        >
          {item.type === "required" ? "Required" : "Recommended"}
        </span>
      </div>
      {item.canComplete ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className={cn("text-xs", styles.muted)}>
            Drag to another column or use the button.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onStatusChange(nextStatus)}
            className={styles.outlineButton}
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
          className={cn("mt-3", styles.outlineButton)}
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
  variant = "default",
}: {
  onSubmit: (comment: string) => Promise<boolean>;
  pending: boolean;
  close: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const [comment, setComment] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await onSubmit(comment)) close();
      }}
    >
      <label className={cn("block space-y-1.5 text-sm", styles.fieldLabel)}>
        Requested changes
        <textarea
          className={cn(styles.textarea, "min-h-28 font-normal")}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          required
          maxLength={1000}
        />
      </label>
      <Button
        type="submit"
        disabled={pending || !comment.trim()}
        className={styles.primaryButton}
      >
        {pending ? "Sending…" : "Request changes"}
      </Button>
    </form>
  );
}

function AddTaskForm({
  onSubmit,
  pending,
  close,
  variant = "default",
}: {
  onSubmit: (label: string, type: "required" | "recommended") => Promise<boolean>;
  pending: boolean;
  close: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
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
      <label className={cn("block space-y-1.5 text-sm", styles.fieldLabel)}>
        Task name
        <input
          className={cn(styles.input, "font-normal")}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
          maxLength={160}
        />
      </label>
      <label className={cn("block space-y-1.5 text-sm", styles.fieldLabel)}>
        Type
        <select
          className={cn(styles.select, "font-normal")}
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
        >
          <option value="required">Required</option>
          <option value="recommended">Recommended</option>
        </select>
      </label>
      <Button
        type="submit"
        disabled={pending || !label.trim()}
        className={styles.primaryButton}
      >
        {pending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}

export function StageChecklist({
  internshipId,
  checklist,
  variant = "default",
}: {
  internshipId: string;
  checklist: StageChecklistDto;
  variant?: WorkspaceVariant;
}) {
  const router = useRouter();
  const styles = workspaceStyles(variant);
  const modalVariant = variant === "dark" ? "dark" : undefined;
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
          | { error?: string }
          | undefined;
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
      className={cn("mt-6 space-y-5 border-t pt-5", styles.borderDivider)}
      aria-labelledby="stage-checklist-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="stage-checklist-heading" className={styles.heading}>
            {checklist.stageLabel} tasks
          </h2>
          <p className={cn("text-sm", styles.muted)}>
            {checklist.requiredCompletedCount} of {checklist.requiredTotalCount}{" "}
            required tasks done
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-medium",
              variant === "dark" ? "text-emerald-400" : "text-[var(--brand-strong)]",
            )}
          >
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
              variant={modalVariant}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className={styles.outlineButton}
                >
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
                  variant={variant}
                  onSubmit={(label, type) =>
                    mutate(
                      `/api/internships/${internshipId}/stage-checklist/tasks`,
                      { stage: checklist.stage, label, type },
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
                variant={modalVariant}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className={styles.outlineButton}
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
                    variant={variant}
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
              className={styles.primaryButton}
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
        className={styles.progressBar}
        role="progressbar"
        aria-label="Required task progress"
        aria-valuemin={0}
        aria-valuemax={checklist.requiredTotalCount}
        aria-valuenow={checklist.requiredCompletedCount}
        aria-valuetext={`${checklist.requiredCompletedCount} of ${checklist.requiredTotalCount} required tasks done`}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${requiredProgress}%` }}
        />
      </div>
      {checklist.reviewStatus === "active" && checklist.canCompleteStage ? (
        <p className={cn("text-sm", styles.muted)}>
          Move every Required task to Done to send this stage to mentor review.
        </p>
      ) : null}
      {checklist.latestReviewRequest ? (
        <p className={styles.reviewFeedback}>
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
              className={styles.kanbanColumn}
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
              <h3 className={cn("mb-3 font-semibold uppercase tracking-wide", styles[column.toneKey])}>
                {column.title}{" "}
                <span className={cn("text-sm font-normal normal-case", styles.muted)}>
                  {items.length}
                </span>
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <TaskCard
                    key={item.key}
                    item={item}
                    variant={variant}
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
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
