import {
  type WorkspaceVariant,
  workspaceStyles,
} from "@/lib/manager-workspace/theme";
import type { TimelineDto } from "@/lib/timeline/types";
import { cn } from "@/lib/utils";

export function InternshipTimeline({
  timeline,
  variant = "default",
}: {
  timeline: TimelineDto;
  variant?: WorkspaceVariant;
}) {
  const styles = workspaceStyles(variant);

  return (
    <section
      id="internship-timeline"
      className={cn(styles.section, "scroll-mt-24")}
    >
      <div>
        <h2 className={styles.heading}>Internship timeline</h2>
        <p className={styles.description}>
          Chronological milestones from authorized internship records.
        </p>
      </div>
      {timeline.events.length ? (
        <ol className="space-y-3">
          {timeline.events.map((event) => (
            <li key={event.id} className={styles.innerCard}>
              <p className="font-medium">{event.title}</p>
              <p className={cn("mt-1 text-sm", styles.muted)}>
                {new Date(event.occurredAt).toLocaleDateString()}
                {event.description ? ` · ${event.description}` : ""}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={cn("text-sm", styles.muted)}>No timeline events yet.</p>
      )}
    </section>
  );
}
