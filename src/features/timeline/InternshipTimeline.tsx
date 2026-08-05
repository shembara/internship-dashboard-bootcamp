import type { TimelineDto } from "@/lib/timeline/types";

export function InternshipTimeline({ timeline }: { timeline: TimelineDto }) {
  return (
    <section id="internship-timeline" className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm scroll-mt-24">
      <div>
        <h2 className="text-lg font-semibold">Internship timeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chronological milestones from authorized internship records.
        </p>
      </div>
      {timeline.events.length ? (
        <ol className="space-y-3">
          {timeline.events.map((event) => (
            <li key={event.id} className="rounded-xl border p-3">
              <p className="font-medium">{event.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(event.occurredAt).toLocaleDateString()}
                {event.description ? ` · ${event.description}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No timeline events yet.</p>
      )}
    </section>
  );
}
