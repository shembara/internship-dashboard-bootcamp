import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { ProvisionUserForm } from "@/features/assignments/ProvisionUserForm";
import { ManagerWorkspaceShell } from "@/features/manager-portfolio/ManagerWorkspaceShell";
import {
  managerIdentityBadge,
  managerTheme,
} from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { listEligibleUsers } from "@/server/assignments/service";

function PersonRow({
  name,
  identityState,
}: {
  name: string;
  identityState: "pending" | "linked";
}) {
  const pending = identityState === "pending";
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm">
      <span className="text-[#c9d1d9]">{name}</span>
      <span className={managerIdentityBadge(pending ? "pending" : "linked")}>
        {pending ? "Awaiting sign-in" : "Linked"}
      </span>
    </li>
  );
}

export default async function PeoplePage() {
  await requireManagerPage();
  const [managers, interns, teammates] = await Promise.all([
    listEligibleUsers("manager"),
    listEligibleUsers("intern"),
    listEligibleUsers("teammate"),
  ]);

  return (
    <ManagerWorkspaceShell className="max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={managerTheme.eyebrow}>Manager workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            People &amp; Access
          </h1>
          <p className={cn("mt-2 text-sm leading-6", managerTheme.muted)}>
            Provision managers, interns, and teammates/mentors before their first
            sign-in.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/manager/internships" />}
          variant="outline"
          className={managerTheme.outlineButton}
        >
          ← Internships
        </Button>
      </div>
      <ProvisionUserForm variant="dark" />
      <div className="grid gap-4 sm:grid-cols-3">
        <section className={cn(managerTheme.card, "p-4")}>
          <h2 className={managerTheme.label}>Managers</h2>
          <ul className="mt-3 space-y-2">
            {managers.map((person) => (
              <PersonRow
                key={person.id}
                name={person.displayName}
                identityState={person.identityState}
              />
            ))}
          </ul>
        </section>
        <section className={cn(managerTheme.card, "p-4")}>
          <h2 className={managerTheme.label}>Interns</h2>
          <ul className="mt-3 space-y-2">
            {interns.map((person) => (
              <PersonRow
                key={person.id}
                name={person.displayName}
                identityState={person.identityState}
              />
            ))}
          </ul>
        </section>
        <section className={cn(managerTheme.card, "p-4")}>
          <h2 className={managerTheme.label}>Teammates / Mentors</h2>
          <ul className="mt-3 space-y-2">
            {teammates.map((person) => (
              <PersonRow
                key={person.id}
                name={person.displayName}
                identityState={person.identityState}
              />
            ))}
          </ul>
        </section>
      </div>
    </ManagerWorkspaceShell>
  );
}
