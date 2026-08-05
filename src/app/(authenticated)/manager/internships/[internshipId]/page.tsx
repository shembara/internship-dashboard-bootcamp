import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InternshipLifecycle } from "@/features/internships/InternshipLifecycle";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagerPortfolioDetail } from "@/server/manager-portfolio/service";

function dateLabel(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Ongoing";
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ internshipId: string }>;
}) {
  const { internshipId } = await params;
  const context = await requireManagerPage();
  const detail = await getManagerPortfolioDetail(internshipId, context.userId);

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Internships", href: "/manager/internships" },
            { label: detail.internship.intern.displayName },
          ]}
        />
        <p className="text-sm font-medium text-[var(--brand-strong)]">
          Manager workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {detail.internship.intern.displayName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dateLabel(detail.internship.startsAt)} to{" "}
          {dateLabel(detail.internship.endsAt)}
        </p>
      </div>

      <InternshipLifecycle
        status={detail.internship.status}
        currentStage={detail.internship.currentStage}
      />
    </section>
  );
}
