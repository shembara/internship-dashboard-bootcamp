import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { ProvisionUserForm } from "@/features/assignments/ProvisionUserForm";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { listEligibleUsers } from "@/server/assignments/service";

export default async function PeoplePage() {
  await requireManagerPage();
  const [interns, teammates] = await Promise.all([
    listEligibleUsers("intern"),
    listEligibleUsers("teammate"),
  ]);
  return (
    <section className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--brand-strong)]">
            Manager workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">People &amp; Access</h1>
          <p className="mt-2 text-muted-foreground">
            Provision interns and teammates before their first sign-in.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/manager/internships" />}
          variant="outline"
        >
          Internships
        </Button>
      </div>
      <ProvisionUserForm />
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Interns</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {interns.map((person) => (
              <li key={person.id}>
                {person.displayName}{" "}
                <span className="text-muted-foreground">
                  {person.identityState === "pending" ? "Awaiting sign-in" : "Linked"}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border p-4">
          <h2 className="font-semibold">Teammates</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {teammates.map((person) => (
              <li key={person.id}>
                {person.displayName}{" "}
                <span className="text-muted-foreground">
                  {person.identityState === "pending" ? "Awaiting sign-in" : "Linked"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
