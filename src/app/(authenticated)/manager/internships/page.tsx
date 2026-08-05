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
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs items={[{ label: "Internships" }]} />
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Manager Workspace
          </h1>
          <p className="mt-2 text-[#9ca3af]">
            Monitor lifecycle, operational progress, and assignment coverage for your
            interns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/manager/people" />}
            variant="outline"
            className="h-10 rounded-xl border-white/[0.08] bg-[#19242c] text-[#f3f4f6] hover:bg-[#23313a] hover:text-[#f3f4f6]"
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
