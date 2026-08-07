"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { TeamOption } from "@/lib/assignments/types";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

export function TeamPlacementForm({
  internshipId,
  onSuccess,
  variant = "default",
}: {
  internshipId: string;
  onSuccess?: () => void;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);
  const router = useRouter();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamName, setTeamName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    void fetch("/api/manager/team-options")
      .then((response) => response.json())
      .then((body) => setTeams(body.teams ?? []));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const match = teams.find(
      (team) => team.title.toLowerCase() === teamName.trim().toLowerCase(),
    );
    const response = await fetch(
      `/api/manager/internships/${internshipId}/team-placements`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          team: match ? { teamId: match.id } : { newTeamName: teamName },
          startsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString(),
        }),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to add Team Placement.");
      setPending(false);
      return;
    }
    onSuccess?.();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
        Team
        <input
          list="placement-team-options"
          required
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Select or enter Team"
          className={styles.input}
        />
        <datalist id="placement-team-options">
          {teams.map((team) => (
            <option key={team.id} value={team.title} />
          ))}
        </datalist>
      </label>
      <label className={cn("grid gap-1 text-sm", styles.fieldLabel)}>
        Start date
        <input
          name="startsAt"
          type="date"
          required
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className={styles.input}
        />
      </label>
      <Button type="submit" disabled={pending} className={styles.primaryButton}>
        {pending ? "Saving…" : "Save Team"}
      </Button>
      {error ? (
        <p className={cn("basis-full text-sm", styles.error)} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
