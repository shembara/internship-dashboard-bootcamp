"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { ApplicationUserOption, TeamOption } from "@/lib/assignments/types";

export function CreateInternshipForm({
  interns,
  teammates,
  onSuccess,
}: {
  interns: ApplicationUserOption[];
  teammates: ApplicationUserOption[];
  onSuccess?: () => void;
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
      <label className="grid gap-2 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        Intern
        <select
          name="internId"
          required
          value={internId}
          onChange={(event) => setInternId(event.target.value)}
          className="h-11 rounded-xl border border-white/[0.08] bg-[#19242c] px-3 text-sm font-normal normal-case text-[#f3f4f6]"
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
      <label className="grid gap-2 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        Team
        <input
          required
          list="team-options"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Select or enter a Team name"
          className="h-11 rounded-xl border border-white/[0.08] bg-[#19242c] px-3 text-sm font-normal normal-case text-[#f3f4f6] placeholder:text-[#757575]"
        />
        <datalist id="team-options">
          {teams.map((team) => (
            <option key={team.id} value={team.title} />
          ))}
        </datalist>
        <span className="text-xs font-normal normal-case text-[#9ca3af]">
          A new name creates a Team when you submit.
        </span>
      </label>
      <label className="grid gap-2 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        Placement start date
        <input
          name="startsAt"
          type="date"
          required
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          className="h-11 rounded-xl border border-white/[0.08] bg-[#19242c] px-3 text-sm font-normal normal-case text-[#f3f4f6]"
        />
      </label>
      <label className="grid gap-2 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        Expected end date
        <input
          name="endsAt"
          type="date"
          value={endsAt}
          min={startsAt || undefined}
          onChange={(event) => setEndsAt(event.target.value)}
          className="h-11 rounded-xl border border-white/[0.08] bg-[#19242c] px-3 text-sm font-normal normal-case text-[#f3f4f6]"
        />
      </label>
      <label className="grid gap-2 text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        Initial mentor
        <select
          value={initialMentorUserId}
          onChange={(event) => setInitialMentorUserId(event.target.value)}
          className="h-11 rounded-xl border border-white/[0.08] bg-[#19242c] px-3 text-sm font-normal normal-case text-[#f3f4f6]"
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
        <p className="text-sm text-[#f87171]" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-xl bg-[#00e5a3] px-5 font-semibold text-[#0b1014] hover:bg-[#00c98f]"
      >
        {submitting ? "Creating…" : "Create internship"}
      </Button>
    </form>
  );
}
