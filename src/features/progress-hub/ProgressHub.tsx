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

type TextFields = Record<string, string>;

function Field({
  label,
  value,
  onChange,
  disabled,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={3}
        className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function stateLabel(state: ReflectionState | CheckInState | "missing") {
  return state === "missing" ? "Missing" : state[0].toUpperCase() + state.slice(1);
}

function Summary({ hub }: { hub: ProgressHubDto }) {
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
    >
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-muted/30 p-3">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.nextDueAction ? (
        <p className="text-sm text-muted-foreground">
          Next due:{" "}
          <span className="font-medium text-foreground">
            {summary.nextDueAction.title}
          </span>{" "}
          by {summary.nextDueAction.dueDate}.
        </p>
      ) : null}
    </Section>
  );
}

function ReflectionForm({
  reflection,
  disabled,
  onSave,
}: {
  reflection?: WeeklyReflectionDto;
  disabled: boolean;
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
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Accomplishments"
          value={values.accomplishments}
          onChange={setField("accomplishments")}
          disabled={!editable}
        />
        <Field
          label="Learnings"
          value={values.learnings}
          onChange={setField("learnings")}
          disabled={!editable}
        />
        <Field
          label="Challenges"
          value={values.challenges}
          onChange={setField("challenges")}
          disabled={!editable}
        />
        <Field
          label="Next-week focus"
          value={values.nextWeekFocus}
          onChange={setField("nextWeekFocus")}
          disabled={!editable}
        />
        <Field
          label="Support needed"
          value={values.supportNeeded}
          onChange={setField("supportNeeded")}
          disabled={!editable}
        />
      </div>
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onSave("draft", values)}
          >
            Save draft
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onSave("submitted", values)}
          >
            Submit reflection
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">This reflection is read-only.</p>
      )}
    </Section>
  );
}

function CheckInForm({
  checkIn,
  disabled,
  onSave,
}: {
  checkIn?: MentorCheckInDto;
  disabled: boolean;
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
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Progress summary"
          value={values.progressSummary}
          onChange={setField("progressSummary")}
          disabled={!editable}
        />
        <Field
          label="Strengths observed"
          value={values.strengthsObserved}
          onChange={setField("strengthsObserved")}
          disabled={!editable}
        />
        <Field
          label="Areas to improve"
          value={values.areasToImprove}
          onChange={setField("areasToImprove")}
          disabled={!editable}
        />
        <Field
          label="Support needed"
          value={values.supportNeeded}
          onChange={setField("supportNeeded")}
          disabled={!editable}
        />
        <Field
          label="Next-week focus"
          value={values.nextWeekFocus}
          onChange={setField("nextWeekFocus")}
          disabled={!editable}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Need to keep a private note? Use the mentor-private notes section below — this
        check-in is shared with the manager.
      </p>
      {checkIn ? (
        <p className="text-xs text-muted-foreground">
          Original author: {checkIn.createdBy} · Last updated by: {checkIn.updatedBy}
        </p>
      ) : null}
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onSave("draft", values)}
          >
            Save draft
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onSave("shared", values)}
          >
            Share check-in
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">This check-in is read-only.</p>
      )}
    </Section>
  );
}

function Agenda({
  hub,
  disabled,
  onSave,
}: {
  hub: ProgressHubDto;
  disabled: boolean;
  onSave: (body: object) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  return (
    <Section
      title="Shared 1:1 agenda"
      description="Keep topics visible until they are resolved."
    >
      {hub.capabilities.canCreateAgendaItem ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Add an agenda topic"
          />
          <Button
            type="button"
            disabled={disabled || !text.trim()}
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
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <span
                className={item.resolved ? "text-muted-foreground line-through" : ""}
              >
                {item.text}
              </span>
              {item.canResolve ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
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
        <p className="text-sm text-muted-foreground">No agenda topics yet.</p>
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
  onSave,
}: {
  title: string;
  description: string;
  notes: ProgressHubDto["sharedNotes"];
  canCreate: boolean;
  disabled: boolean;
  onSave: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  return (
    <Section title={title} description={description}>
      {canCreate ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Write a note"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !text.trim()}
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
            <li key={note.id} className="rounded-lg border p-3 text-sm">
              <p className="whitespace-pre-wrap">{note.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {note.weekKey} · updated {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      )}
    </Section>
  );
}

function ActionItems({
  hub,
  disabled,
  onSave,
  onToggle,
}: {
  hub: ProgressHubDto;
  disabled: boolean;
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
    >
      {hub.capabilities.canCreateActionItem ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_170px_220px_auto]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={disabled}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Action item"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={disabled}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <select
            value={owner?.userId ?? ""}
            onChange={(event) => setOwnerUserId(event.target.value)}
            disabled={disabled}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div>
                <p
                  className={
                    item.status === "completed"
                      ? "line-through text-muted-foreground"
                      : "font-medium"
                  }
                >
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
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
                  onClick={() => onToggle(item)}
                >
                  {item.status === "completed" ? "Reopen" : "Complete"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No action items yet.</p>
      )}
    </Section>
  );
}

function SubmittedReflections({
  reflections,
  isInternViewer = false,
}: {
  reflections: WeeklyReflectionDto[];
  isInternViewer?: boolean;
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
      title={isInternViewer ? "My reflections" : "Intern reflections"}
      description={
        isInternViewer
          ? "Your weekly reflections history."
          : "Submitted weekly reflections from the intern. Drafts are private to the intern."
      }
    >
      {reflections.length ? (
        <ol className="space-y-3">
          {reflections.map((reflection) => (
            <li key={reflection.weekKey} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{reflection.weekKey}</h3>
                <span className="text-xs text-muted-foreground capitalize">
                  {stateLabel(reflection.state)}
                </span>
              </div>
              <dl className="mt-3 grid gap-3 md:grid-cols-2">
                {fields.map(([label, key]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium text-muted-foreground">
                      {label}
                    </dt>
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
        <p className="text-sm text-muted-foreground">No reflections yet.</p>
      )}
    </Section>
  );
}

function History({ hub }: { hub: ProgressHubDto }) {
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
    >
      {records.length ? (
        <ul className="space-y-2">
          {records.map((record) => (
            <li
              key={record.weekKey}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span>{record.weekKey}</span>
              <span className="text-muted-foreground">{stateLabel(record.state)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No weekly history yet.</p>
      )}
    </Section>
  );
}

export function ProgressHub({
  internshipId,
  hub,
}: {
  internshipId: string;
  hub: ProgressHubDto;
}) {
  const router = useRouter();
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
  return (
    <section className="space-y-6" aria-labelledby="progress-hub-heading">
      <div>
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Intern Progress Hub
        </p>
        <h1
          id="progress-hub-heading"
          className="mt-1 text-2xl font-semibold tracking-tight"
        >
          Weekly progress and 1:1 workspace
        </h1>
      </div>
      <Summary hub={hub} />
      {hub.viewer === "intern" ? (
        <ReflectionForm
          reflection={hub.reflection}
          disabled={pendingMutation || !hub.capabilities.canSaveReflection}
          onSave={(state, values) =>
            mutate("reflection", { weekKey, state, ...values }, `reflection-${state}`)
          }
        />
      ) : null}
      {hub.viewer === "mentor" ? (
        <CheckInForm
          checkIn={hub.checkIn}
          disabled={pendingMutation || !hub.capabilities.canSaveCheckIn}
          onSave={(state, values) =>
            mutate("check-in", { weekKey, state, ...values }, `check-in-${state}`)
          }
        />
      ) : null}
      <SubmittedReflections
        reflections={
          hub.viewer === "intern" ? hub.reflectionHistory : hub.reflections
        }
        isInternViewer={hub.viewer === "intern"}
      />
      <Agenda
        hub={hub}
        disabled={pendingMutation}
        onSave={(body) => mutate("agenda", body, "agenda")}
      />
      <Notes
        title="Shared notes"
        description="Visible to the intern, current mentors, and assigned managers."
        notes={hub.sharedNotes}
        canCreate={hub.capabilities.canCreateSharedNote}
        disabled={pendingMutation}
        onSave={(text) => mutate("notes/shared", { weekKey, text }, "shared-note")}
      />
      {hub.viewer === "intern" ? (
        <Notes
          title="My private notes"
          description="Visible only to you."
          notes={hub.privateInternNotes}
          canCreate={hub.capabilities.canCreatePrivateInternNote}
          disabled={pendingMutation}
          onSave={(text) =>
            mutate("notes/private-intern", { weekKey, text }, "private-intern-note")
          }
        />
      ) : null}
      {hub.viewer !== "intern" ? (
        <Notes
          title="Mentor-private notes"
          description="Visible to authorized mentors and assigned managers, never to the intern."
          notes={hub.privateMentorNotes}
          canCreate={hub.capabilities.canCreatePrivateMentorNote}
          disabled={pendingMutation}
          onSave={(text) =>
            mutate("notes/private-mentor", { weekKey, text }, "private-mentor-note")
          }
        />
      ) : null}
      <ActionItems
        hub={hub}
        disabled={pendingMutation}
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
      <History hub={hub} />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
