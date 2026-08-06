"use client";

import { useState } from "react";
import { ChevronRight, Edit2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { SKILLS, type SkillRatingDTO } from "@/lib/skills/types";
import { cn } from "@/lib/utils";


const MOCK_CURRENT_WEEK: SkillRatingDTO = {
  weekKey: "2026-W32",
  ratings: {
    "Technical Skills": 8,
    "Problem Solving": 7,
    "Communication": 9,
    "Teamwork": 8,
    "Autonomy": 6,
  },
};

const MOCK_PREVIOUS_WEEK: SkillRatingDTO = {
  weekKey: "2026-W31",
  ratings: {
    "Technical Skills": 7,
    "Problem Solving": 7,
    "Communication": 8,
    "Teamwork": 9,
    "Autonomy": 5,
  },
};

interface SkillMatrixProps {
  isMentor?: boolean;
  onEditClick?: () => void;
}

export function SkillMatrix({ isMentor = true, onEditClick }: SkillMatrixProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>("2026-W32");


  const currentRatings = MOCK_CURRENT_WEEK.ratings;
  const previousRatings = MOCK_PREVIOUS_WEEK.ratings;

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
            <option value="2026-W32">Week 32 (Current)</option>
            <option value="2026-W31">Week 31</option>
          </select>


          {isMentor && (
            <button
              type="button"
              onClick={onEditClick}
              className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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


                  <span className="font-bold">{currentScore}/10</span>
                </div>
              </div>


              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">

                <div
                  className="absolute left-0 top-0 h-full bg-[var(--brand-soft)] opacity-60 transition-all duration-300"
                  style={{ width: `${(previousScore / 10) * 100}%` }}
                />

                <div
                  className="absolute left-0 top-0 h-full bg-[var(--brand)] transition-all duration-300"
                  style={{ width: `${(currentScore / 10) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
