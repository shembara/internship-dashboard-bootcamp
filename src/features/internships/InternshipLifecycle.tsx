"use client";

import { useState } from "react";
import { Check, Circle, CircleDot, Lock } from "lucide-react";

import {
  internshipStages,
  internshipStatuses,
  type InternshipLifecycle as InternshipLifecycleData,
  type InternshipStage,
} from "@/lib/internships/types";
import type { StageChecklistDto } from "@/lib/stage-checklists/types";
import { cn } from "@/lib/utils";
import { StageChecklist } from "@/features/stage-checklists/StageChecklist";

export function InternshipLifecycle({
  status,
  currentStage,
  checklist,
  internshipId,
}: InternshipLifecycleData & { checklist?: StageChecklistDto; internshipId?: string }) {
  const statusOption = internshipStatuses.find((option) => option.value === status);
  const currentStageIndex = internshipStages.findIndex(
    (stage) => stage.value === currentStage,
  );
  const lifecycleComplete =
    currentStage === "finalReview" && checklist?.isStageCompleted;
  const [selectedStage, setSelectedStage] = useState<InternshipStage>();
  const [loadedChecklist, setLoadedChecklist] = useState<StageChecklistDto>();
  const [loadingStage, setLoadingStage] = useState<InternshipStage>();
  const selectedChecklist =
    selectedStage && selectedStage !== checklist?.stage ? loadedChecklist : checklist;

  async function selectStage(stage: InternshipStage) {
    if (!internshipId || loadingStage || selectedChecklist?.stage === stage) return;
    setSelectedStage(stage);
    if (stage === checklist?.stage) {
      setLoadedChecklist(undefined);
      return;
    }
    setLoadingStage(stage);
    try {
      const response = await fetch(
        `/api/internships/${internshipId}/stage-checklist?stage=${stage}`,
      );
      if (!response.ok) throw new Error("Could not load this stage.");
      setLoadedChecklist((await response.json()) as StageChecklistDto);
    } finally {
      setLoadingStage(undefined);
    }
  }

  if (!statusOption || currentStageIndex === -1) {
    throw new Error("Invalid internship lifecycle data.");
  }

  return (
    <section
      aria-labelledby="internship-lifecycle-heading"
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="internship-lifecycle-heading" className="text-lg font-semibold">
            Internship lifecycle
          </h2>
        </div>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <span className="inline-flex rounded-full border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-2.5 py-1 font-medium text-[var(--brand-strong)]">
                {statusOption.label}
              </span>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Current stage</dt>
            <dd className="font-medium">{internshipStages[currentStageIndex].label}</dd>
          </div>
        </dl>
      </div>

      <ol
        aria-label="Internship stage progression"
        className="mt-6 grid gap-3 sm:grid-cols-5"
      >
        {internshipStages.map((stage, index) => {
          const state =
            index < currentStageIndex ||
            (lifecycleComplete && index === currentStageIndex)
              ? "completed"
              : index === currentStageIndex
                ? "current"
                : "upcoming";
          const StateIcon =
            state === "completed" ? Check : state === "current" ? CircleDot : Circle;

          const locked =
            state === "upcoming" && checklist && !checklist.canViewAllStages;
          return (
            <li
              key={stage.value}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-start gap-3 rounded-xl border p-3 text-left",
                !locked && "cursor-pointer transition-colors hover:bg-muted/60",
                locked && "cursor-not-allowed opacity-65",
                state === "completed" &&
                  "border-[var(--brand-soft)] bg-[var(--brand-soft)]/45",
                state === "current" &&
                  "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm",
                state === "upcoming" && "bg-muted/35",
              )}
              onClick={() => !locked && selectStage(stage.value)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  state === "completed" &&
                    "border-[var(--brand)] bg-[var(--brand)] text-white",
                  state === "current" &&
                    "border-[var(--brand)] bg-white text-[var(--brand-strong)]",
                  state === "upcoming" &&
                    "border-muted-foreground/40 text-muted-foreground",
                )}
              >
                <StateIcon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="flex items-center gap-1.5 text-sm font-medium leading-snug">
                  {stage.label}
                  {locked ? <Lock className="size-3.5" aria-label="Locked" /> : null}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state === "completed"
                    ? "Completed"
                    : state === "current"
                      ? "Current"
                      : "Upcoming"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {selectedChecklist && internshipId ? (
        <div aria-busy={Boolean(loadingStage)}>
          <StageChecklist internshipId={internshipId} checklist={selectedChecklist} />
        </div>
      ) : null}
    </section>
  );
}
