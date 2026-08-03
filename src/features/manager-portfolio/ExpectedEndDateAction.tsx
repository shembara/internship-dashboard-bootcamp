"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

function dateValue(value: string | undefined) {
  return value?.slice(0, 10) ?? "";
}

export function ExpectedEndDateAction({
  internshipId,
  startsAt,
  endsAt,
}: {
  internshipId: string;
  startsAt: string;
  endsAt?: string;
}) {
  return (
    <Modal
      trigger={
        <Button type="button" size="sm" variant="outline">
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
}: {
  internshipId: string;
  startsAt: string;
  endsAt?: string;
  close: () => void;
}) {
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
      <label className="grid gap-1 text-sm font-medium">
        Expected end date
        <input
          type="date"
          value={value}
          min={dateValue(startsAt)}
          onChange={(event) => setValue(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Clear the date and save to remove the estimate.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save expected end"}
      </Button>
    </form>
  );
}
