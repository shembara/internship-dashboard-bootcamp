import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { workspaceStyles } from "@/lib/manager-workspace/theme";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { listTeammateInternships } from "@/server/assignments/service";

export default async function TeammatePage() {
  const context = await requireTeammatePage();
  const mentorInternships = await listTeammateInternships(context.userId);

  const styles = workspaceStyles("dark");

  return (
    <section className="workspace-page space-y-6">
      <div className="space-y-2">
        <Breadcrumbs variant="dark" items={[{ label: "Internships" }]} />
        <p className={styles.eyebrow}>Mentor workspace</p>
        <h1 className={styles.pageHeading}>Internships</h1>
        <p className={styles.description}>
          Interns assigned to you as a mentor.
        </p>
      </div>
      {mentorInternships.length ? (
        <div className="grid gap-3">
          {mentorInternships.map((internship) => (
            <Link
              key={internship.id}
              href={`/teammate/internships/${internship.id}`}
              className={styles.linkCard}
            >
              <p className="font-semibold">{internship.internName}</p>
              <p className="mt-1 text-sm text-[#8b949e]">
                {internship.status} internship · View workspace
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className="font-semibold text-white">No interns assigned</h2>
          <p className="mt-2 text-sm text-[#8b949e]">
            Interns assigned to you as a mentor will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
