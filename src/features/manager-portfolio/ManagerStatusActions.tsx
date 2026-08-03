"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { InternshipStatus } from "@/lib/internships/types";

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
}: {
  internshipId: string;
  action: StatusAction;
  close: () => void;
}) {
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
      <p className="text-sm">{actionCopy[action].consequence}</p>
      {action === "cancel" || action === "pause" ? (
        <label className="grid gap-1 text-sm font-medium">
          Reason{" "}
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="rounded-lg border bg-background p-2"
          />
        </label>
      ) : null}
      {action === "complete" ? (
        <label className="grid gap-1 text-sm font-medium">
          Completion date{" "}
          <input
            type="date"
            value={completionDate}
            onChange={(event) => setCompletionDate(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          />
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : `Confirm ${actionCopy[action].label.toLowerCase()}`}
      </Button>
    </form>
  );
}

export function ManagerStatusActions({
  internshipId,
  status,
}: {
  internshipId: string;
  status: InternshipStatus;
}) {
  const actions: StatusAction[] =
    status === "active"
      ? ["pause", "cancel", "complete"]
      : status === "paused"
        ? ["resume", "cancel", "complete"]
        : [];
  if (!actions.length)
    return (
      <p className="text-sm text-muted-foreground">
        This historical internship is read-only.
      </p>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Modal
          key={action}
          trigger={
            <Button
              type="button"
              size="sm"
              variant={action === "cancel" ? "outline" : "default"}
            >
              {actionCopy[action].label}
            </Button>
          }
          title={`${actionCopy[action].label} internship`}
          description="Confirm this status change."
        >
          {(close) => (
            <StatusForm internshipId={internshipId} action={action} close={close} />
          )}
        </Modal>
      ))}
    </div>
  );
}
