"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type {
  ActionItemDto,
  CheckInState,
  MentorCheckInDto,
  ProgressHubDto,
  ReflectionState,
  WeeklyReflectionDto,
} from "@/lib/progress-hub/types";
import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

type TextFields = Record<string, string>;
type Styles = ReturnType<typeof workspaceStyles>;

function Field({
  label,
  value,
  onChange,
  disabled,
  styles,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  styles: Styles;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={3}
        className={styles.textarea}
      />
    </label>
  );
}

function Section({
  title,
  description,
  styles,
  children,
}: {
  title: string;
  description: string;
  styles: Styles;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div>
        <h2 className={styles.heading}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      {children}
    </section>
  );
}

function stateLabel(state: ReflectionState | CheckInState | "missing") {
  return state === "missing" ? "Missing" : state[0].toUpperCase() + state.slice(1);
}

function Summary({ hub, styles }: { hub: ProgressHubDto; styles: Styles }) {
  const { summary } = hub;
  const items = [
    ["Intern reflection", stateLabel(summary.reflectionState)],
    ["Mentor check-in", stateLabel(summary.mentorCheckInState)],
    ["Open actions", String(summary.openActionItems)],
    ["Overdue actions", String(summary.overdueActionItems)],
    ["Open agenda", String(summary.unresolvedAgendaItems)],
    ["Checklist", `${summary.checklistCompleted}/${summary.checklistTotal} required`],
  ];
  return (
    <Section
      title="Weekly overview"
      description={`${hub.currentWeek.label} · ${hub.currentWeek.state} week`}
      styles={styles}
    >
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className={styles.statCard}>
            <dt className={cn("text-xs font-medium", styles.muted)}>{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.nextDueAction ? (
        <p className={cn("text-sm", styles.muted)}>
          Next due:{" "}
          <span className="font-medium text-inherit">{summary.nextDueAction.title}</span>{" "}
          by {summary.nextDueAction.dueDate}.
        </p>
      ) : null}
    </Section>
  );
}

function ReflectionForm({
  reflection,
  disabled,
  styles,
  onSave,
}: {
  reflection?: WeeklyReflectionDto;
  disabled: boolean;
  styles: Styles;
  onSave: (state: ReflectionState, values: TextFields) => void;
}) {
  const [values, setValues] = useState<TextFields>({
    accomplishments: reflection?.accomplishments ?? "",
    learnings: reflection?.learnings ?? "",
    challenges: reflection?.challenges ?? "",
    nextWeekFocus: reflection?.nextWeekFocus ?? "",
    supportNeeded: reflection?.supportNeeded ?? "",
  });
  const setField = (key: string) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const editable = Boolean(reflection?.canEdit ?? true) && !disabled;

  return (
    <Section
      title="My weekly reflection"
      description="Capture progress, learning, and where you need support. Drafts are private to you."
      styles={styles}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Accomplishments"
          value={values.accomplishments}
          onChange={setField("accomplishments")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Learnings"
          value={values.learnings}
          onChange={setField("learnings")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Challenges"
          value={values.challenges}
          onChange={setField("challenges")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Next-week focus"
          value={values.nextWeekFocus}
          onChange={setField("nextWeekFocus")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Support needed"
          value={values.supportNeeded}
          onChange={setField("supportNeeded")}
          disabled={!editable}
          styles={styles}
        />
      </div>
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={styles.outlineButton}
            onClick={() => onSave("draft", values)}
          >
            Save draft
          </Button>
          <Button
            type="button"
            disabled={disabled}
            className={styles.primaryButton}
            onClick={() => onSave("submitted", values)}
          >
            Submit reflection
          </Button>
        </div>
      ) : (
        <p className={cn("text-sm", styles.muted)}>This reflection is read-only.</p>
      )}
    </Section>
  );
}

function CheckInForm({
  checkIn,
  disabled,
  styles,
  onSave,
}: {
  checkIn?: MentorCheckInDto;
  disabled: boolean;
  styles: Styles;
  onSave: (state: CheckInState, values: TextFields) => void;
}) {
  const [values, setValues] = useState<TextFields>({
    progressSummary: checkIn?.progressSummary ?? "",
    strengthsObserved: checkIn?.strengthsObserved ?? "",
    areasToImprove: checkIn?.areasToImprove ?? "",
    supportNeeded: checkIn?.supportNeeded ?? "",
    nextWeekFocus: checkIn?.nextWeekFocus ?? "",
  });
  const setField = (key: string) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const editable = Boolean(checkIn?.canEdit ?? true) && !disabled;

  return (
    <Section
      title="Mentor weekly check-in"
      description="Operational coaching notes, not formal performance feedback. The private note is never shown to the intern."
      styles={styles}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Progress summary"
          value={values.progressSummary}
          onChange={setField("progressSummary")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Strengths observed"
          value={values.strengthsObserved}
          onChange={setField("strengthsObserved")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Areas to improve"
          value={values.areasToImprove}
          onChange={setField("areasToImprove")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Support needed"
          value={values.supportNeeded}
          onChange={setField("supportNeeded")}
          disabled={!editable}
          styles={styles}
        />
        <Field
          label="Next-week focus"
          value={values.nextWeekFocus}
          onChange={setField("nextWeekFocus")}
          disabled={!editable}
          styles={styles}
        />
      </div>
      <p className={cn("text-xs", styles.muted)}>
        Need to keep a private note? Use the mentor-private notes section below — this
        check-in is shared with the manager.
      </p>
      {checkIn ? (
        <p className={cn("text-xs", styles.muted)}>
          Original author: {checkIn.createdBy} · Last updated by: {checkIn.updatedBy}
        </p>
      ) : null}
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={styles.outlineButton}
            onClick={() => onSave("draft", values)}
          >
            Save draft
          </Button>
          <Button
            type="button"
            disabled={disabled}
            className={styles.primaryButton}
            onClick={() => onSave("shared", values)}
          >
            Share check-in
          </Button>
        </div>
      ) : (
        <p className={cn("text-sm", styles.muted)}>This check-in is read-only.</p>
      )}
    </Section>
  );
}

function Agenda({
  hub,
  disabled,
  styles,
  onSave,
}: {
  hub: ProgressHubDto;
  disabled: boolean;
  styles: Styles;
  onSave: (body: object) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  return (
    <Section
      title="Shared 1:1 agenda"
      description="Keep topics visible until they are resolved."
      styles={styles}
    >
      {hub.capabilities.canCreateAgendaItem ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            className={cn(styles.input, "min-w-0 flex-1")}
            placeholder="Add an agenda topic"
          />
          <Button
            type="button"
            disabled={disabled || !text.trim()}
            className={styles.primaryButton}
            onClick={() => {
              void (async () => {
                if (await onSave({ text })) setText("");
              })();
            }}
          >
            Add topic
          </Button>
        </div>
      ) : null}
      {hub.agendaItems.length ? (
        <ul className="space-y-2">
          {hub.agendaItems.map((item) => (
            <li key={item.id} className={cn(styles.listItem, "flex items-center justify-between gap-3")}>
              <span className={item.resolved ? cn(styles.muted, "line-through") : ""}>
                {item.text}
              </span>
              {item.canResolve ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  className={styles.outlineButton}
                  onClick={() =>
                    onSave({ id: item.id, text: item.text, resolved: !item.resolved })
                  }
                >
                  {item.resolved ? "Reopen" : "Resolve"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm", styles.muted)}>No agenda topics yet.</p>
      )}
    </Section>
  );
}

function Notes({
  title,
  description,
  notes,
  canCreate,
  disabled,
  styles,
  onSave,
}: {
  title: string;
  description: string;
  notes: ProgressHubDto["sharedNotes"];
  canCreate: boolean;
  disabled: boolean;
  styles: Styles;
  onSave: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  return (
    <Section title={title} description={description} styles={styles}>
      {canCreate ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            rows={3}
            className={styles.textarea}
            placeholder="Write a note"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !text.trim()}
            className={styles.outlineButton}
            onClick={() => {
              void (async () => {
                if (await onSave(text)) setText("");
              })();
            }}
          >
            Save note
          </Button>
        </div>
      ) : null}
      {notes.length ? (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className={styles.listItem}>
              <p className="whitespace-pre-wrap">{note.text}</p>
              <p className={cn("mt-2 text-xs", styles.muted)}>
                {note.weekKey} · updated {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm", styles.muted)}>No notes yet.</p>
      )}
    </Section>
  );
}

function ActionItems({
  hub,
  disabled,
  styles,
  onSave,
  onToggle,
}: {
  hub: ProgressHubDto;
  disabled: boolean;
  styles: Styles;
  onSave: (body: object) => Promise<boolean>;
  onToggle: (item: ActionItemDto) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [ownerUserId, setOwnerUserId] = useState(hub.viewerUserId);
  const owner =
    hub.actionOwners.find((option) => option.userId === ownerUserId) ??
    hub.actionOwners[0];
  return (
    <Section
      title="Action items"
      description="Shared follow-ups with server-derived due and overdue states."
      styles={styles}
    >
      {hub.capabilities.canCreateActionItem ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_170px_220px_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={disabled}
            className={styles.input}
            placeholder="Action item"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={disabled}
            className={styles.input}
          />
          <select
            value={owner?.userId ?? ""}
            onChange={(event) => setOwnerUserId(event.target.value)}
            disabled={disabled}
            className={styles.select}
            aria-label="Action owner"
          >
            {hub.actionOwners.map((option) => (
              <option key={option.userId} value={option.userId}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={disabled || !title.trim() || !dueDate || !owner}
            className={styles.primaryButton}
            onClick={() => {
              void (async () => {
                if (
                  await onSave({
                    title,
                    dueDate,
                    ownerType: owner.ownerType,
                    ownerUserId: owner.userId,
                  })
                ) {
                  setTitle("");
                  setDueDate("");
                }
              })();
            }}
          >
            Add action
          </Button>
        </div>
      ) : null}
      {hub.actionItems.length ? (
        <ul className="space-y-2">
          {hub.actionItems.map((item) => (
            <li
              key={item.id}
              className={cn(
                styles.listItem,
                "flex flex-wrap items-center justify-between gap-3",
              )}
            >
              <div>
                <p
                  className={
                    item.status === "completed"
                      ? cn(styles.muted, "line-through")
                      : "font-medium"
                  }
                >
                  {item.title}
                </p>
                <p className={cn("mt-1 text-xs", styles.muted)}>
                  Due {item.dueDate}
                  {item.overdue ? " · Overdue" : ""}
                </p>
              </div>
              {item.canToggle ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  className={styles.outlineButton}
                  onClick={() => onToggle(item)}
                >
                  {item.status === "completed" ? "Reopen" : "Complete"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm", styles.muted)}>No action items yet.</p>
      )}
    </Section>
  );
}

function SubmittedReflections({
  reflections,
  styles,
}: {
  reflections: WeeklyReflectionDto[];
  styles: Styles;
}) {
  const fields = [
    ["Accomplishments", "accomplishments"],
    ["Learnings", "learnings"],
    ["Challenges", "challenges"],
    ["Next-week focus", "nextWeekFocus"],
    ["Support needed", "supportNeeded"],
  ] as const;

  return (
    <Section
      title="Intern reflections"
      description="Submitted weekly reflections from the intern. Drafts are private to the intern."
      styles={styles}
    >
      {reflections.length ? (
        <ol className="space-y-3">
          {reflections.map((reflection) => (
            <li key={reflection.weekKey} className={cn(styles.innerCard, "p-4")}>
              <h3 className="font-medium">{reflection.weekKey}</h3>
              <dl className="mt-3 grid gap-3 md:grid-cols-2">
                {fields.map(([label, key]) => (
                  <div key={key}>
                    <dt className={cn("text-xs font-medium", styles.muted)}>{label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm">
                      {reflection[key] || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <p className={cn("text-sm", styles.muted)}>No submitted reflections yet.</p>
      )}
    </Section>
  );
}

function History({ hub, styles }: { hub: ProgressHubDto; styles: Styles }) {
  const records =
    hub.viewer === "intern"
      ? hub.reflectionHistory
      : hub.viewer === "mentor"
        ? hub.checkInHistory
        : hub.mentorCheckIns;
  return (
    <Section
      title="History"
      description="Recent weekly records are ordered from newest to oldest."
      styles={styles}
    >
      {records.length ? (
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record.weekKey}
              className={cn(styles.listItem, "flex items-center justify-between")}
            >
              <span>{record.weekKey}</span>
              <span className={styles.muted}>{stateLabel(record.state)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm", styles.muted)}>No weekly history yet.</p>
      )}
    </Section>
  );
}

function FeedbackCycles({ styles }: { styles: Styles }) {
  return (
    <Section
      title="Feedback cycles"
      description="Start and publish feedback cycles for this internship."
      styles={styles}
    >
      <div className={styles.dashedPlaceholder}>
        Feedback cycle management will be added here.
      </div>
    </Section>
  );
}

export type ProgressHubSection =
  | "weekly-overview"
  | "my-weekly-reflection"
  | "mentor-weekly-check-in"
  | "intern-reflections"
  | "shared-one-on-one-agenda"
  | "shared-notes"
  | "my-private-notes"
  | "mentor-private-notes"
  | "action-items"
  | "history"
  | "feedback-cycles";

export function ProgressHub({
  internshipId,
  hub,
  visibleSection,
  variant = "default",
}: {
  internshipId: string;
  hub: ProgressHubDto;
  visibleSection?: ProgressHubSection;
  variant?: WorkspaceVariant;
}) {
  const router = useRouter();
  const styles = workspaceStyles(variant);
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  const renderedHub = useRef(hub);
  const pendingMutation = Boolean(pending);

  useEffect(() => {
    if (renderedHub.current !== hub) {
      renderedHub.current = hub;
      setPending(undefined);
    }
  }, [hub]);

  async function mutate(
    path: string,
    body: object,
    key: string,
    method = "POST",
  ): Promise<boolean> {
    if (pending) return false;
    setPending(key);
    setError("");
    try {
      const response = await fetch(
        `/api/internships/${internshipId}/progress-hub/${path}`,
        {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => undefined)) as
          { error?: string } | undefined;
        throw new Error(payload?.error ?? "Could not save the Progress Hub update.");
      }
      router.refresh();
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save the Progress Hub update.",
      );
      setPending(undefined);
      return false;
    }
  }

  const weekKey = hub.currentWeek.key;

  const sections: Array<{
    id: ProgressHubSection;
    node: React.ReactNode;
  }> = [
    {
      id: "weekly-overview",
      node: <Summary hub={hub} styles={styles} />,
    },
    ...(hub.viewer === "intern"
      ? [
          {
            id: "my-weekly-reflection" as const,
            node: (
              <ReflectionForm
                reflection={hub.reflection}
                disabled={pendingMutation || !hub.capabilities.canSaveReflection}
                styles={styles}
                onSave={(state, values) =>
                  mutate(
                    "reflection",
                    { weekKey, state, ...values },
                    `reflection-${state}`,
                  )
                }
              />
            ),
          },
        ]
      : []),
    ...(hub.viewer === "mentor"
      ? [
          {
            id: "mentor-weekly-check-in" as const,
            node: (
              <CheckInForm
                checkIn={hub.checkIn}
                disabled={pendingMutation || !hub.capabilities.canSaveCheckIn}
                styles={styles}
                onSave={(state, values) =>
                  mutate("check-in", { weekKey, state, ...values }, `check-in-${state}`)
                }
              />
            ),
          },
        ]
      : []),
    ...(hub.viewer !== "intern"
      ? [
          {
            id: "intern-reflections" as const,
            node: <SubmittedReflections reflections={hub.reflections} styles={styles} />,
          },
        ]
      : []),
    {
      id: "shared-one-on-one-agenda",
      node: (
        <Agenda
          hub={hub}
          disabled={pendingMutation}
          styles={styles}
          onSave={(body) => mutate("agenda", body, "agenda")}
        />
      ),
    },
    {
      id: "shared-notes",
      node: (
        <Notes
          title="Shared notes"
          description="Visible to the intern, current mentors, and assigned managers."
          notes={hub.sharedNotes}
          canCreate={hub.capabilities.canCreateSharedNote}
          disabled={pendingMutation}
          styles={styles}
          onSave={(text) => mutate("notes/shared", { weekKey, text }, "shared-note")}
        />
      ),
    },
    ...(hub.viewer === "intern"
      ? [
          {
            id: "my-private-notes" as const,
            node: (
              <Notes
                title="My private notes"
                description="Visible only to you."
                notes={hub.privateInternNotes}
                canCreate={hub.capabilities.canCreatePrivateInternNote}
                disabled={pendingMutation}
                styles={styles}
                onSave={(text) =>
                  mutate("notes/private-intern", { weekKey, text }, "private-intern-note")
                }
              />
            ),
          },
        ]
      : []),
    ...(hub.viewer !== "intern"
      ? [
          {
            id: "mentor-private-notes" as const,
            node: (
              <Notes
                title="Mentor-private notes"
                description="Visible to authorized mentors and assigned managers, never to the intern."
                notes={hub.privateMentorNotes}
                canCreate={hub.capabilities.canCreatePrivateMentorNote}
                disabled={pendingMutation}
                styles={styles}
                onSave={(text) =>
                  mutate("notes/private-mentor", { weekKey, text }, "private-mentor-note")
                }
              />
            ),
          },
        ]
      : []),
    {
      id: "action-items",
      node: (
        <ActionItems
          hub={hub}
          disabled={pendingMutation}
          styles={styles}
          onSave={(body) => mutate("action-items", body, "action-item")}
          onToggle={(item) =>
            mutate(
              "action-items",
              { id: item.id, completed: item.status !== "completed" },
              `action-${item.id}`,
              "PATCH",
            )
          }
        />
      ),
    },
    {
      id: "history",
      node: <History hub={hub} styles={styles} />,
    },
    {
      id: "feedback-cycles",
      node: <FeedbackCycles styles={styles} />,
    },
  ];

  const visibleSections = visibleSection
    ? sections.filter((section) => section.id === visibleSection)
    : sections;

  return (
    <section className="space-y-6" aria-labelledby="progress-hub-heading">
      {visibleSection ? null : (
        <div>
          <p className={styles.eyebrow}>Intern Progress Hub</p>
          <h1 id="progress-hub-heading" className={cn("mt-1", styles.subheading)}>
            Weekly progress and 1:1 workspace
          </h1>
        </div>
      )}

      {visibleSections.map((section) => (
        <div key={section.id} id={section.id} className="scroll-mt-24">
          {section.node}
        </div>
      ))}

      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
