import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { workspaceStyles } from "@/lib/manager-workspace/theme";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { listTeammateInternships } from "@/server/assignments/service";

export default async function TeammatePage() {
  const context = await requireTeammatePage();
  const internships = await listTeammateInternships(context.userId);
  const styles = workspaceStyles("dark");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Breadcrumbs variant="dark" items={[{ label: "Internships" }]} />
        <p className={styles.eyebrow}>Teammate workspace</p>
        <h1 className={styles.pageHeading}>Internships</h1>
        <p className={styles.description}>
          Internships where you have a teammate assignment.
        </p>
      </div>
      {internships.length ? (
        <div className="grid gap-3">
          {internships.map((internship) => (
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
          <h2 className="font-semibold text-white">No internships assigned</h2>
          <p className="mt-2 text-sm text-[#8b949e]">
            Your assigned internships will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
