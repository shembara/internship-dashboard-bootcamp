"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

function dateValue(value: string | undefined) {
  return value?.slice(0, 10) ?? "";
}

export function ExpectedEndDateAction({
  internshipId,
  startsAt,
  endsAt,
  variant = "default",
}: {
  internshipId: string;
  startsAt: string;
  endsAt?: string;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const modalVariant = variant === "dark" ? "dark" : undefined;

  return (
    <Modal
      variant={modalVariant}
      trigger={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={styles.outlineButton}
        >
          Edit expected end
        </Button>
      }
      title="Edit expected end date"
      description="This changes planning information only; it does not complete the internship."
    >
      {(close) => (
        <ExpectedEndDateForm
          internshipId={internshipId}
          startsAt={startsAt}
          endsAt={endsAt}
          close={close}
          variant={variant}
        />
      )}
    </Modal>
  );
}

function ExpectedEndDateForm({
  internshipId,
  startsAt,
  endsAt,
  close,
  variant = "default",
}: {
  internshipId: string;
  startsAt: string;
  endsAt?: string;
  close: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const router = useRouter();
  const [value, setValue] = useState(dateValue(endsAt));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(
      `/api/manager/internships/${internshipId}/expected-end-date`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value ? { endsAt: value } : {}),
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not update the expected end date.");
      setPending(false);
      return;
    }
    close();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
        Expected end date
        <input
          type="date"
          value={value}
          min={dateValue(startsAt)}
          onChange={(event) => setValue(event.target.value)}
          className={styles.input}
        />
      </label>
      <p className={cn("text-xs", styles.muted)}>
        Clear the date and save to remove the estimate.
      </p>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className={styles.primaryButton}>
        {pending ? "Saving…" : "Save expected end"}
      </Button>
    </form>
  );
}
