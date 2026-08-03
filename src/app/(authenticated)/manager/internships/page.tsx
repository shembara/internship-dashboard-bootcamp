import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CreateInternshipDialog } from "@/features/assignments/CreateInternshipDialog";
import { ManagerPortfolio } from "@/features/manager-portfolio/ManagerPortfolio";
import { listAvailableInterns, listEligibleUsers } from "@/server/assignments/service";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagerPortfolio } from "@/server/manager-portfolio/service";

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ManagerInternshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireManagerPage();
  const params = await searchParams;
  const [portfolio, interns, teammates] = await Promise.all([
    getManagerPortfolio(
      context.userId,
      Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, queryValue(value)]),
      ),
    ),
    listAvailableInterns(),
    listEligibleUsers("teammate"),
  ]);
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs items={[{ label: "Internships" }]} />
          <p className="text-sm font-medium text-[var(--brand-strong)]">
            Manager workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Internships</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor lifecycle, operational progress, and assignment coverage for your
            interns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/manager/people" />}
            variant="outline"
          >
            People &amp; Access
          </Button>
          <CreateInternshipDialog interns={interns} teammates={teammates} />
        </div>
      </div>
      <ManagerPortfolio portfolio={portfolio} />
    </section>
  );
}
