"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  achievementCategories,
  type AchievementListDto,
} from "@/lib/achievements/types";

export function Achievements({
  internshipId,
  data,
}: {
  internshipId: string;
  data: AchievementListDto;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<(typeof achievementCategories)[number]["value"]>("milestone");
  const [achievedOn, setAchievedOn] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function save() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/internships/${internshipId}/achievements`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, category, achievedOn }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not save achievement.");
      setPending(false);
      return;
    }
    setTitle("");
    setAchievedOn("");
    router.refresh();
  }
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Achievements</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Meaningful outcomes and milestones from this internship.
        </p>
      </div>
      {data.canCreate ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_160px_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Achievement title"
            className="h-10 rounded-lg border bg-background px-3"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
            className="h-10 rounded-lg border bg-background px-3"
          >
            {achievementCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={achievedOn}
            onChange={(event) => setAchievedOn(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3"
          />
          <Button
            type="button"
            disabled={pending || !title.trim() || !achievedOn}
            onClick={save}
          >
            {pending ? "Saving…" : "Add achievement"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Achievements are read-only for this internship.
        </p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {data.achievements.length ? (
        <ul className="space-y-2">
          {data.achievements.map((achievement) => (
            <li key={achievement.id} className="rounded-xl border p-3">
              <p className="font-medium">{achievement.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {achievement.category} · {achievement.achievedOn} ·{" "}
                {achievement.author.displayName}
              </p>
              {achievement.description ? (
                <p className="mt-2 text-sm">{achievement.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No achievements yet.</p>
      )}
    </section>
  );
}
