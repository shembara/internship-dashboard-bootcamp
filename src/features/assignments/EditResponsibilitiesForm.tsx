"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { teammateResponsibilities } from "@/lib/teammate-responsibilities";
export function EditResponsibilitiesForm({
  internshipId,
  assignmentId,
  selected,
  onSuccess,
}: {
  internshipId: string;
  assignmentId: string;
  selected: string[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responsibilities, setResponsibilities] = useState(selected);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    return fetch(
      `/api/manager/internships/${internshipId}/teammate-assignments/${assignmentId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          responsibilities,
        }),
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not save responsibilities.");
        }
        onSuccess?.();
        router.refresh();
      })
      .catch(() => setError("Could not save responsibilities. Please try again."))
      .finally(() => setPending(false));
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 text-sm">
      <span className="text-muted-foreground">Responsibilities:</span>
      <div className="flex flex-col gap-2">
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
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Saving…" : "Save"}
      </Button>
      {error ? <p className="text-destructive">{error}</p> : null}
    </form>
  );
}
