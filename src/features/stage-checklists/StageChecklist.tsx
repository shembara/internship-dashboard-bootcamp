"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type {
  StageChecklistDto,
  StageChecklistItemDto,
} from "@/lib/stage-checklists/types";

function ChecklistSection({
  title,
  items,
  renderAction,
}: {
  title: string;
  items: StageChecklistItemDto[];
  renderAction: (item: StageChecklistItemDto) => React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-[#f3f4f6]">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-[#19242c] p-3 text-sm"
          >
            <span>
              {item.label}
              <span className="text-[#9ca3af]">
                {" "}
                · {item.completed ? "Completed" : "Not completed"}
              </span>
            </span>
            {renderAction(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StageChecklist({
  internshipId,
  checklist,
}: {
  internshipId: string;
  checklist: StageChecklistDto;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  const renderedChecklist = useRef(checklist);
  const isPending = Boolean(pending);

  useEffect(() => {
    if (renderedChecklist.current !== checklist) {
      renderedChecklist.current = checklist;
      setPending(undefined);
    }
  }, [checklist]);

  async function mutate(url: string, body: object, key: string) {
    if (pending) return;
    setPending(key);
    setError("");
    try {
      const response = await fetch(url, {
        method: key === "stage" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => undefined)) as
          { error?: string } | undefined;
        throw new Error(body?.error ?? "Could not update the checklist.");
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update the checklist.",
      );
      setPending(undefined);
    }
  }
  return (
    <section
      className="mt-6 space-y-5 border-t border-white/[0.08] pt-5"
      aria-labelledby="stage-checklist-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="stage-checklist-heading" className="text-lg font-semibold">
            {checklist.stageLabel} checklist
          </h2>
          <p className="text-sm text-[#9ca3af]">
            {checklist.requiredCompletedCount} of {checklist.requiredTotalCount}{" "}
            required tasks completed
          </p>
          {checklist.isStageCompleted ? (
            <p className="mt-1 text-sm font-medium text-[#00e5a3]">
              Stage completed
              {checklist.stage === "finalReview"
                ? ". All lifecycle stages are complete and the internship is awaiting a manager status decision."
                : "."}
            </p>
          ) : null}
        </div>
        {checklist.canCompleteStage ? (
          <div className="space-y-1 text-right">
            <Button
              type="button"
              disabled={!checklist.readyToComplete || isPending}
              onClick={() =>
                mutate(
                  `/api/internships/${internshipId}/stage-checklist/complete`,
                  { stage: checklist.stage },
                  "stage",
                )
              }
            >
              {pending === "stage" ? "Completing…" : "Complete stage"}
            </Button>
            {!checklist.readyToComplete ? (
              <p className="text-xs text-[#9ca3af]">
                Complete all required tasks to advance.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[#27343c]"
        aria-label={`${checklist.requiredCompletedCount} of ${checklist.requiredTotalCount} required tasks completed`}
      >
        <div
          className="h-full bg-[#00e5a3]"
          style={{
            width: `${
              checklist.requiredTotalCount
                ? (checklist.requiredCompletedCount / checklist.requiredTotalCount) *
                  100
                : 100
            }%`,
          }}
        />
      </div>
      <ChecklistSection
        title="Required"
        items={checklist.requiredItems}
        renderAction={(item) =>
          item.canComplete ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/[0.12] bg-[#121a20] text-[#f3f4f6] hover:bg-[#27343c] hover:text-[#f3f4f6]"
              disabled={isPending}
              onClick={() =>
                mutate(
                  `/api/internships/${internshipId}/stage-checklist/items`,
                  {
                    stage: checklist.stage,
                    itemKey: item.key,
                    completed: !item.completed,
                  },
                  item.key,
                )
              }
            >
              {pending === item.key
                ? "Saving…"
                : item.completed
                  ? "Reopen"
                  : "Complete"}
            </Button>
          ) : null
        }
      />
      <ChecklistSection
        title="Recommended"
        items={checklist.recommendedItems}
        renderAction={(item) =>
          item.canComplete ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/[0.12] bg-[#121a20] text-[#f3f4f6] hover:bg-[#27343c] hover:text-[#f3f4f6]"
              disabled={isPending}
              onClick={() =>
                mutate(
                  `/api/internships/${internshipId}/stage-checklist/items`,
                  {
                    stage: checklist.stage,
                    itemKey: item.key,
                    completed: !item.completed,
                  },
                  item.key,
                )
              }
            >
              {pending === item.key
                ? "Saving…"
                : item.completed
                  ? "Reopen"
                  : "Complete"}
            </Button>
          ) : null
        }
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
