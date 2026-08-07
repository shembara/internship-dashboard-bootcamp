import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CreateInternshipDialog } from "@/features/assignments/CreateInternshipDialog";
import { ManagerPortfolio } from "@/features/manager-portfolio/ManagerPortfolio";
import { ManagerWorkspaceShell } from "@/features/manager-portfolio/ManagerWorkspaceShell";
import { managerTheme } from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";
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
    <ManagerWorkspaceShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Breadcrumbs
            variant="dark"
            className="text-[#8b949e]"
            items={[{ label: "Internships" }]}
          />
          <h1 className="text-3xl font-semibold tracking-tight">Manager workspace</h1>
          <p className={cn("max-w-2xl text-sm leading-6", managerTheme.muted)}>
            Monitor lifecycle, operational progress, and assignment coverage for your
            interns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/manager/people" />}
            variant="outline"
            className={managerTheme.outlineButton}
          >
            People &amp; Access
          </Button>
          <CreateInternshipDialog interns={interns} teammates={teammates} />
        </div>
      </div>
      <ManagerPortfolio portfolio={portfolio} />
    </ManagerWorkspaceShell>
  );
}
