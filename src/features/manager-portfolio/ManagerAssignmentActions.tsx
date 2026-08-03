"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";

function AddManagerForm({
  internshipId,
  managers,
  close,
}: {
  internshipId: string;
  managers: ApplicationUserOption[];
  close: () => void;
}) {
  const router = useRouter();
  const [managerUserId, setManagerUserId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(
      `/api/manager/internships/${internshipId}/manager-assignments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ managerUserId }),
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not add manager.");
      setPending(false);
      return;
    }
    close();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="grid gap-1 text-sm font-medium">
        Manager
        <select
          value={managerUserId}
          onChange={(event) => setManagerUserId(event.target.value)}
          required
          className="h-10 rounded-lg border bg-background px-3"
        >
          <option value="">Select a manager</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.displayName} · {manager.email}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !managerUserId}>
        {pending ? "Adding…" : "Add manager"}
      </Button>
    </form>
  );
}

function EndManagerForm({
  internshipId,
  managerUserId,
  managers,
  close,
}: {
  internshipId: string;
  managerUserId: string;
  managers: ApplicationUserOption[];
  close: () => void;
}) {
  const router = useRouter();
  const [replacementManagerUserId, setReplacementManagerUserId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(
      `/api/manager/internships/${internshipId}/manager-assignments/${managerUserId}`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(replacementManagerUserId ? { replacementManagerUserId } : {}),
        }),
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not end manager assignment.");
      setPending(false);
      return;
    }
    close();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm">
        Ending this assignment removes this manager&apos;s access. Select a replacement
        when this is the final current manager.
      </p>
      <label className="grid gap-1 text-sm font-medium">
        Replacement manager (if needed)
        <select
          value={replacementManagerUserId}
          onChange={(event) => setReplacementManagerUserId(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        >
          <option value="">No replacement</option>
          {managers
            .filter((manager) => manager.id !== managerUserId)
            .map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.displayName}
              </option>
            ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Ending…" : "Confirm end assignment"}
      </Button>
    </form>
  );
}

export function ManagerAssignmentActions({
  internshipId,
  managerUserId,
  managers,
}: {
  internshipId: string;
  managerUserId?: string;
  managers: ApplicationUserOption[];
}) {
  if (!managerUserId)
    return (
      <Modal
        trigger={
          <Button type="button" size="sm">
            Add manager
          </Button>
        }
        title="Add manager assignment"
        description="The selected active manager will receive access to this internship."
      >
        {(close) => (
          <AddManagerForm
            internshipId={internshipId}
            managers={managers}
            close={close}
          />
        )}
      </Modal>
    );
  return (
    <Modal
      trigger={
        <Button type="button" size="sm" variant="outline">
          End assignment
        </Button>
      }
      title="End manager assignment"
      description="Confirm the access change."
    >
      {(close) => (
        <EndManagerForm
          internshipId={internshipId}
          managerUserId={managerUserId}
          managers={managers}
          close={close}
        />
      )}
    </Modal>
  );
}
