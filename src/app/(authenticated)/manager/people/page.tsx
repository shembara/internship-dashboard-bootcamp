import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { ProvisionUserForm } from "@/features/assignments/ProvisionUserForm";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { listEligibleUsers } from "@/server/assignments/service";

function PersonList({
  title,
  people,
}: {
  title: string;
  people: Awaited<ReturnType<typeof listEligibleUsers>>;
}) {
  return (
    <section>
      <h2 className="text-[11px] font-medium tracking-[0.08em] text-[#9ca3af] uppercase">
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {people.length ? (
          people.map((person) => {
            const linked = person.identityState === "linked";
            return (
              <li
                key={person.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#121a20] px-4 py-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-[#f3f4f6]">
                  {person.displayName}
                </span>
                <span
                  className={
                    linked
                      ? "shrink-0 rounded-full border border-[#00e5a3]/20 bg-[#00e5a3]/10 px-2 py-0.5 text-xs text-[#00e5a3]"
                      : "shrink-0 rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-2 py-0.5 text-xs text-[#fbbf24]"
                  }
                >
                  {linked ? "Linked" : "Awaiting sign-in"}
                </span>
              </li>
            );
          })
        ) : (
          <li className="rounded-xl border border-dashed border-white/[0.12] px-4 py-3 text-sm text-[#9ca3af]">
            No people yet.
          </li>
        )}
      </ul>
    </section>
  );
}

export default async function PeoplePage() {
  await requireManagerPage();
  const [interns, teammates] = await Promise.all([
    listEligibleUsers("intern"),
    listEligibleUsers("teammate"),
  ]);

  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#9ca3af]">Manager workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            People &amp; Access
          </h1>
          <p className="mt-2 text-[#9ca3af]">
            Provision interns and teammates before their first sign-in.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/manager/internships" />}
          variant="outline"
          className="h-10 rounded-xl border-white/[0.08] bg-[#19242c] text-[#f3f4f6] hover:bg-[#23313a] hover:text-[#f3f4f6]"
        >
          ← Internships
        </Button>
      </div>

      <ProvisionUserForm availableRoles={["intern", "teammate"]} />

      <div className="grid max-w-4xl gap-6 sm:grid-cols-2">
        <PersonList title="Interns" people={interns} />
        <PersonList title="Teammates" people={teammates} />
      </div>
    </section>
  );
}
