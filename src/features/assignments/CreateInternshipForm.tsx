"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { ApplicationUserOption, TeamOption } from "@/lib/assignments/types";
import { managerTheme } from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

export function CreateInternshipForm({
  interns,
  teammates,
  onSuccess,
  variant,
}: {
  interns: ApplicationUserOption[];
  teammates: ApplicationUserOption[];
  onSuccess?: () => void;
  variant?: "dark";
}) {
  const router = useRouter();
  const [internId, setInternId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [initialMentorUserId, setInitialMentorUserId] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dark = variant === "dark";
  const inputClass = dark
    ? managerTheme.input
    : "h-10 rounded-lg border bg-background px-3";
  const labelClass = dark ? managerTheme.label : "text-sm font-medium";

  useEffect(() => {
    void fetch("/api/manager/team-options")
      .then((response) => response.json())
      .then((body) => setTeams(body.teams ?? []));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const matchedTeam = teams.find(
      (team) => team.title.toLowerCase() === teamName.trim().toLowerCase(),
    );
    const response = await fetch("/api/manager/internships", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        internId,
        team: matchedTeam ? { teamId: matchedTeam.id } : { newTeamName: teamName },
        startsAt: new Date(`${startsAt}T00:00:00.000Z`).toISOString(),
        ...(endsAt
          ? { endsAt: new Date(`${endsAt}T00:00:00.000Z`).toISOString() }
          : {}),
        ...(initialMentorUserId ? { initialMentorUserId } : {}),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Unable to create the internship.");
      setSubmitting(false);
      return;
    }
    onSuccess?.();
    router.push(`/manager/internships/${body.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2">
        <span className={labelClass}>Intern</span>
        <select
          name="internId"
          required
          value={internId}
          onChange={(event) => setInternId(event.target.value)}
          className={inputClass}
        >
          <option value="">Select an intern</option>
          {interns.map((intern) => (
            <option key={intern.id} value={intern.id}>
              {intern.displayName} — {intern.email}
              {intern.identityState === "pending" ? " (awaiting sign-in)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Team</span>
        <input
          required
          list="team-options"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Select or enter a Team name"
          className={inputClass}
        />
        <datalist id="team-options">
          {teams.map((team) => (
            <option key={team.id} value={team.title} />
          ))}
        </datalist>
        <span
          className={cn(
            "text-xs font-normal",
            dark ? managerTheme.muted : "text-muted-foreground",
          )}
        >
          A new name creates a Team when you submit.
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Placement start date</span>
          <input
            name="startsAt"
            type="date"
            required
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Expected end date</span>
          <input
            name="endsAt"
            type="date"
            value={endsAt}
            min={startsAt || undefined}
            onChange={(event) => setEndsAt(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="grid gap-2">
        <span className={labelClass}>Initial mentor</span>
        <select
          value={initialMentorUserId}
          onChange={(event) => setInitialMentorUserId(event.target.value)}
          className={inputClass}
        >
          <option value="">Assign later</option>
          {teammates.map((teammate) => (
            <option key={teammate.id} value={teammate.id}>
              {teammate.displayName} — {teammate.email}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={submitting}
        className={dark ? cn(managerTheme.primaryButton, "h-10 w-full") : "w-full"}
      >
        {submitting ? "Creating…" : "Create internship"}
      </Button>
    </form>
  );
}
