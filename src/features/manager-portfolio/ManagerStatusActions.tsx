"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { InternshipStatus } from "@/lib/internships/types";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

type StatusAction = "pause" | "resume" | "cancel" | "complete";

const actionCopy: Record<StatusAction, { label: string; consequence: string }> = {
  pause: {
    label: "Pause",
    consequence:
      "Checklist and Progress Hub updates will become read-only until the internship is resumed.",
  },
  resume: {
    label: "Resume",
    consequence: "Checklist and Progress Hub updates will become available again.",
  },
  cancel: {
    label: "Cancel",
    consequence:
      "Cancellation is terminal. This internship cannot be resumed in this version.",
  },
  complete: {
    label: "Complete internship",
    consequence:
      "Completion is terminal and preserves Final Review and all historical records as read-only.",
  },
};

function StatusForm({
  internshipId,
  action,
  close,
  variant = "default",
}: {
  internshipId: string;
  action: StatusAction;
  close: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`/api/manager/internships/${internshipId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        ...(reason.trim() ? { reason } : {}),
        ...(completionDate ? { completionDate } : {}),
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not update internship status.");
      setPending(false);
      return;
    }
    close();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className={cn("text-sm", variant === "dark" ? "text-[#c9d1d9]" : undefined)}>
        {actionCopy[action].consequence}
      </p>
      {action === "cancel" || action === "pause" ? (
        <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
          Reason{" "}
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className={styles.textarea}
          />
        </label>
      ) : null}
      {action === "complete" ? (
        <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
          Completion date{" "}
          <input
            type="date"
            value={completionDate}
            onChange={(event) => setCompletionDate(event.target.value)}
            className={styles.input}
          />
        </label>
      ) : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className={styles.primaryButton}>
        {pending ? "Saving…" : `Confirm ${actionCopy[action].label.toLowerCase()}`}
      </Button>
    </form>
  );
}

export function ManagerStatusActions({
  internshipId,
  status,
  variant = "default",
}: {
  internshipId: string;
  status: InternshipStatus;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const modalVariant = variant === "dark" ? "dark" : undefined;
  const actions: StatusAction[] =
    status === "active"
      ? ["pause", "cancel", "complete"]
      : status === "paused"
        ? ["resume", "cancel", "complete"]
        : [];
  if (!actions.length)
    return (
      <p className={cn("text-sm", styles.muted)}>
        This historical internship is read-only.
      </p>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Modal
          key={action}
          variant={modalVariant}
          trigger={
            <Button
              type="button"
              size="sm"
              variant={action === "cancel" ? "outline" : "default"}
              className={
                action === "cancel" ? styles.outlineButton : styles.primaryButton
              }
            >
              {actionCopy[action].label}
            </Button>
          }
          title={`${actionCopy[action].label} internship`}
          description="Confirm this status change."
        >
          {(close) => (
            <StatusForm
              internshipId={internshipId}
              action={action}
              close={close}
              variant={variant}
            />
          )}
        </Modal>
      ))}
    </div>
  );
}
