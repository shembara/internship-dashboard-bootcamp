"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit2, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";
import { SKILLS, type SkillRatings } from "@/lib/skills/types";
import { cn } from "@/lib/utils";
import { getCurrentWeek } from "@/lib/progress-hub/week";
import { EditSkillsModal } from "./EditSkillsModal";

const CURRENT_WEEK_KEY = getCurrentWeek().key;

interface SkillMatrixProps {
  internshipId: string;
  isMentor?: boolean;
}

export function SkillMatrix({ internshipId, isMentor = true }: SkillMatrixProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>(CURRENT_WEEK_KEY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [weeklyRatings, setWeeklyRatings] = useState<Record<string, SkillRatings>>({});

  const isCurrentWeek = selectedWeek === CURRENT_WEEK_KEY;
  const canEdit = Boolean(isMentor && isCurrentWeek);

  const fetchSkillRatings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/internships/${internshipId}/skills`);
      if (response.ok) {
        const rawData = await response.json();
        const mapped: Record<string, SkillRatings> = {};

        if (Array.isArray(rawData)) {
          rawData.forEach((item: any) => {
            if (item && item.weekKey && item.ratings) {
              mapped[item.weekKey] = item.ratings;
            }
          });
        }
        else if (rawData && typeof rawData === "object") {
          if (rawData.weekKey && rawData.ratings) {
            mapped[rawData.weekKey] = rawData.ratings;
          } else if (rawData.ratings) {
            mapped[selectedWeek] = rawData.ratings;
          }
        }

        setWeeklyRatings(mapped);
      }
    } catch (error) {
      console.error("Failed to load skill ratings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [internshipId, selectedWeek]);

  useEffect(() => {
    fetchSkillRatings();
  }, [fetchSkillRatings]);

  const getPreviousWeekKey = (weekKey: string) => {
    const match = weekKey.match(/^(\d{4})-W(\d+)$/);
    if (!match) return undefined;
    const year = match[1];
    const weekNum = parseInt(match[2], 10);
    return weekNum > 1 ? `${year}-W${String(weekNum - 1).padStart(2, "0")}` : undefined;
  };

  const previousWeekKey = getPreviousWeekKey(selectedWeek);

  const formatWeekLabel = (weekKey: string) => {
    const match = weekKey.match(/W(\d+)$/);
    return match ? `Week ${parseInt(match[1], 10)}` : weekKey;
  };

  const currentRatings: SkillRatings = (weeklyRatings[selectedWeek] || {}) as SkillRatings;
  const previousRatings: SkillRatings = previousWeekKey ? ((weeklyRatings[previousWeekKey] || {}) as SkillRatings) : ({} as SkillRatings);
  const handleSaveRatings = async (updatedRatings: SkillRatings) => {
    try {
      const response = await fetch(`/api/internships/${internshipId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekKey: selectedWeek,
          ratings: updatedRatings,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save ratings");
      }

      setWeeklyRatings((prev) => ({
        ...prev,
        [selectedWeek]: updatedRatings,
      }));

      setIsModalOpen(false);
      await fetchSkillRatings();
    } catch (error: any) {
      console.error("Error saving ratings:", error);
      alert(`Помилка збереження: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border bg-card p-6 shadow-sm">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Skill Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Progress and evaluation across key competencies
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            <option value={CURRENT_WEEK_KEY}>
              {formatWeekLabel(CURRENT_WEEK_KEY)} (Current)
            </option>
            {previousWeekKey && (
              <option value={previousWeekKey}>
                {formatWeekLabel(previousWeekKey)}
              </option>
            )}
          </select>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Edit2 className="size-4" />
              Edit Ratings
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {SKILLS.map((skill) => {
          const currentScore = currentRatings[skill] ?? 0;
          const previousScore = previousRatings[skill] ?? 0;
          const diff = currentScore - previousScore;

          return (
            <div key={skill} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{skill}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                      diff > 0 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                      diff < 0 && "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
                      diff === 0 && "bg-muted text-muted-foreground"
                    )}
                  >
                    {diff > 0 && <TrendingUp className="mr-1 size-3" />}
                    {diff < 0 && <TrendingDown className="mr-1 size-3" />}
                    {diff === 0 && <Minus className="mr-1 size-3" />}
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                  <span className="font-bold">{currentScore}/100</span>
                </div>
              </div>

              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute left-0 top-0 h-full bg-[var(--brand-soft)] opacity-60 transition-all duration-300"
                  style={{ width: `${previousScore}%` }}
                />
                <div
                  className="absolute left-0 top-0 h-full bg-[var(--brand)] transition-all duration-300"
                  style={{ width: `${currentScore}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && (
        <EditSkillsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          weekKey={selectedWeek}
          initialRatings={currentRatings}
          onSave={handleSaveRatings}
        />
      )}
    </div>
  );
}
