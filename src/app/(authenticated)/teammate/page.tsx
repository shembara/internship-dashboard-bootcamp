import Link from "next/link";

import { requireTeammatePage } from "@/server/assignments/page-auth";
import { listTeammateInternships } from "@/server/assignments/service";

export default async function TeammatePage() {
  const context = await requireTeammatePage();
  const internships = await listTeammateInternships(context.userId);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#00e5a3]">Teammate workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Internships</h1>
        <p className="mt-2 text-[#9ca3af]">
          Internships where you have a teammate assignment.
        </p>
      </div>
      {internships.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {internships.map((internship) => (
            <Link
              key={internship.id}
              href={`/teammate/internships/${internship.id}`}
              className="rounded-2xl border border-white/[0.08] bg-[#121a20] p-5 shadow-sm transition hover:border-[#00e5a3]/60 hover:bg-[#172229]"
            >
              <p className="font-semibold">{internship.internName}</p>
              <p className="mt-1 text-sm text-[#9ca3af]">
                {internship.status} internship · View workspace
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.16] bg-[#121a20] p-8 text-center">
          <h2 className="font-semibold">No internships assigned</h2>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Your assigned internships will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
