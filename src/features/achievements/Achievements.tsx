"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  achievementCategories,
  type AchievementListDto,
} from "@/lib/achievements/types";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

export function Achievements({
  internshipId,
  data,
  variant = "default",
}: {
  internshipId: string;
  data: AchievementListDto;
  variant?: WorkspaceVariant;
}) {
  const router = useRouter();
  const styles = workspaceStyles(variant);
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
    <section id="achievements" className={cn(styles.section, "scroll-mt-24")}>
      <div>
        <h2 className={styles.heading}>Achievements</h2>
        <p className={styles.description}>
          Meaningful outcomes and milestones from this internship.
        </p>
      </div>
      {data.canCreate ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_160px_160px_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Achievement title"
            className={cn(styles.input, "h-10")}
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
            className={cn(styles.select, "h-10")}
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
            className={cn(styles.input, "h-10")}
          />
          <Button
            type="button"
            disabled={pending || !title.trim() || !achievedOn}
            onClick={save}
            className={styles.primaryButton}
          >
            {pending ? "Saving…" : "Add achievement"}
          </Button>
        </div>
      ) : (
        <p className={cn("text-sm", styles.muted)}>
          Achievements are read-only for this internship.
        </p>
      )}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {data.achievements.length ? (
        <ul className="space-y-2">
          {data.achievements.map((achievement) => (
            <li key={achievement.id} className={styles.innerCard}>
              <p className="font-medium">{achievement.title}</p>
              <p className={cn("mt-1 text-sm", styles.muted)}>
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
        <p className={cn("text-sm", styles.muted)}>No achievements yet.</p>
      )}
    </section>
  );
}
