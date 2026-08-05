import type { TimelineDto } from "@/lib/timeline/types";
import { formatDate } from "@/lib/utils";
export function InternshipTimeline({ timeline }: { timeline: TimelineDto }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#121a20] p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Internship timeline</h2>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Chronological milestones from authorized internship records.
        </p>
      </div>
      {timeline.events.length ? (
        <ol className="space-y-3">
          {timeline.events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-white/[0.08] bg-[#19242c] p-3"
            >
              <p className="font-medium">{event.title}</p>
              <p className="mt-1 text-sm text-[#9ca3af]">
                {formatDate(event.occurredAt)}
                {event.description ? ` · ${event.description}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-[#9ca3af]">No timeline events yet.</p>
      )}
    </section>
  );
}
