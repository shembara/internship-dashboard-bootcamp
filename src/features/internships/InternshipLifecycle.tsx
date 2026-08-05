import { Check, Circle, CircleDot } from "lucide-react";

import {
  internshipStages,
  internshipStatuses,
  type InternshipLifecycle as InternshipLifecycleData,
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

  if (!statusOption || currentStageIndex === -1) {
    throw new Error("Invalid internship lifecycle data.");
  }

  return (
    <section
      aria-labelledby="internship-lifecycle-heading"
      className="rounded-2xl border border-white/[0.08] bg-[#121a20] p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="internship-lifecycle-heading" className="text-lg font-semibold">
            Internship lifecycle
          </h2>
        </div>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <dt className="text-[#9ca3af]">Status</dt>
            <dd>
              <span className="inline-flex rounded-full border border-[#00e5a3]/20 bg-[#00e5a3]/10 px-2.5 py-1 font-medium text-[#00e5a3]">
                {statusOption.label}
              </span>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-[#9ca3af]">Current stage</dt>
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

          return (
            <li
              key={stage.value}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-start gap-3 rounded-xl border p-3",
                state === "completed" && "border-[#00e5a3]/20 bg-[#00e5a3]/10",
                state === "current" && "border-[#00e5a3] bg-[#19242c] shadow-sm",
                state === "upcoming" && "border-white/[0.08] bg-[#19242c]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  state === "completed" &&
                    "border-[#00e5a3] bg-[#00e5a3] text-[#0b1014]",
                  state === "current" && "border-[#00e5a3] bg-[#19242c] text-[#00e5a3]",
                  state === "upcoming" && "border-white/[0.16] text-[#9ca3af]",
                )}
              >
                <StateIcon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium leading-snug">{stage.label}</h3>
                <p className="mt-1 text-xs text-[#9ca3af]">
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
      {checklist && internshipId ? (
        <StageChecklist internshipId={internshipId} checklist={checklist} />
      ) : null}
    </section>
  );
}
