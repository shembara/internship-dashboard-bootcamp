"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { SKILLS, type SkillRatings } from "@/lib/skills/types";

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekKey: string;
  initialRatings: SkillRatings;
  onSave: (updatedRatings: SkillRatings) => Promise<void> | void;
}

export function EditSkillsModal({
  isOpen,
  onClose,
  weekKey,
  initialRatings,
  onSave,
}: EditSkillsModalProps) {
  const [ratings, setRatings] = useState<SkillRatings>(initialRatings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRatings(initialRatings);
    }
  }, [initialRatings, isOpen]);

  if (!isOpen) return null;

  const handleSliderChange = (skill: keyof SkillRatings, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [skill]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(ratings);
      onClose();
    } catch (error) {
      console.error("Failed to save ratings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-lg space-y-6">

        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-bold">Edit Skill Ratings</h3>
            <p className="text-sm text-muted-foreground">Week: {weekKey}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {SKILLS.map((skill) => {
              const currentValue = ratings[skill] ?? 50;

              return (
                <div key={skill} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor={`skill-${skill}`} className="font-semibold">
                      {skill}
                    </label>
                    <span className="font-bold text-[var(--brand)]">{currentValue} / 100</span>
                  </div>
                  <input
                    id={`skill-${skill}`}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentValue}
                    onChange={(e) => handleSliderChange(skill, Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-[var(--brand)]"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save className="size-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
