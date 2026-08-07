"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApplicationUserOption } from "@/lib/assignments/types";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

function AddManagerForm({
  internshipId,
  managers,
  close,
  variant = "default",
}: {
  internshipId: string;
  managers: ApplicationUserOption[];
  close: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
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
      <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
        Manager
        <select
          value={managerUserId}
          onChange={(event) => setManagerUserId(event.target.value)}
          required
          className={styles.select}
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
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending || !managerUserId}
        className={styles.primaryButton}
      >
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
  variant = "default",
}: {
  internshipId: string;
  managerUserId: string;
  managers: ApplicationUserOption[];
  close: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
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
      <p className={cn("text-sm", variant === "dark" ? "text-[#c9d1d9]" : undefined)}>
        Ending this assignment removes this manager&apos;s access. Select a replacement
        when this is the final current manager.
      </p>
      <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
        Replacement manager (if needed)
        <select
          value={replacementManagerUserId}
          onChange={(event) => setReplacementManagerUserId(event.target.value)}
          className={styles.select}
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
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        className={styles.outlineButton}
      >
        {pending ? "Ending…" : "Confirm end assignment"}
      </Button>
    </form>
  );
}

export function ManagerAssignmentActions({
  internshipId,
  managerUserId,
  managers,
  variant = "default",
}: {
  internshipId: string;
  managerUserId?: string;
  managers: ApplicationUserOption[];
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const modalVariant = variant === "dark" ? "dark" : undefined;

  if (!managerUserId)
    return (
      <Modal
        variant={modalVariant}
        trigger={
          <Button type="button" size="sm" className={styles.primaryButton}>
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
            variant={variant}
          />
        )}
      </Modal>
    );
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
          variant={variant}
        />
      )}
    </Modal>
  );
}
