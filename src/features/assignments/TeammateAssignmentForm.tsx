"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { ApplicationUserOption } from "@/lib/assignments/types";
import { teammateResponsibilities } from "@/lib/teammate-responsibilities";

export function TeammateAssignmentForm({
  internshipId,
  teamId,
  teammates,
  onSuccess,
}: {
  internshipId: string;
  teamId: string;
  teammates: ApplicationUserOption[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [teammateUserId, setTeammateUserId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const response = await fetch(
      `/api/manager/internships/${internshipId}/teammate-assignments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teammateUserId,
          teamId,
          responsibilities,
          startsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString(),
        }),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to assign teammate.");
      setSubmitting(false);
      return;
    }
    onSuccess?.();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium">
        Teammate
        <select
          name="teammateUserId"
          required
          value={teammateUserId}
          onChange={(event) => setTeammateUserId(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        >
          <option value="">Select teammate</option>
          {teammates.map((person) => (
            <option key={person.id} value={person.id}>
              {person.displayName} — {person.email}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Starts
        <input
          name="startsAt"
          type="date"
          required
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="h-10 rounded-lg border bg-background px-3"
        />
      </label>
      <fieldset className="grid gap-1 text-sm font-medium">
        <legend>Responsibilities</legend>
        <div className="flex flex-wrap gap-3 pt-1 text-sm font-normal">
          {teammateResponsibilities.map((responsibility) => (
            <label key={responsibility.value} className="flex items-center gap-1">
              <input
                name="responsibilities"
                type="checkbox"
                value={responsibility.value}
                checked={responsibilities.includes(responsibility.value)}
                onChange={(event) =>
                  setResponsibilities((current) =>
                    event.target.checked
                      ? [...current, responsibility.value]
                      : current.filter((value) => value !== responsibility.value),
                  )
                }
              />{" "}
              {responsibility.label}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Assigning…" : "Assign teammate"}
        </Button>
      </div>
    </form>
  );
}
