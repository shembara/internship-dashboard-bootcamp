import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { requireTeammatePage } from "@/server/assignments/page-auth";
import { listTeammateInternships } from "@/server/assignments/service";

export default async function TeammatePage() {
  const context = await requireTeammatePage();
  const internships = await listTeammateInternships(context.userId);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Breadcrumbs items={[{ label: "Internships" }]} />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Teammate workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Internships</h1>
        <p className="mt-2 text-muted-foreground">
          Internships where you have a teammate assignment.
        </p>
      </div>
      {internships.length ? (
        <div className="grid gap-3">
          {internships.map((internship) => (
            <Link
              key={internship.id}
              href={`/teammate/internships/${internship.id}`}
              className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-[var(--brand)]"
            >
              <p className="font-semibold">{internship.internName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {internship.status} internship · View workspace
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">No internships assigned</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your assigned internships will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
