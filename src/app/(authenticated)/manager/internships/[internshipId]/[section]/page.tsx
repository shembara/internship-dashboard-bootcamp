import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  ProgressHub,
  type ProgressHubSection,
} from "@/features/progress-hub/ProgressHub";
import { requireManagerPage } from "@/server/assignments/page-auth";
import { getManagerPortfolioDetail } from "@/server/manager-portfolio/service";

const managerProgressHubSections = [
  "weekly-overview",
  "intern-reflections",
  "shared-one-on-one-agenda",
  "shared-notes",
  "mentor-private-notes",
  "action-items",
  "history",
] satisfies ProgressHubSection[];

function isManagerProgressHubSection(
  section: string,
): section is (typeof managerProgressHubSections)[number] {
  return managerProgressHubSections.includes(section as ProgressHubSection);
}

function titleFromSection(section: string) {
  return section
    .split("-")
    .map((part) => (part === "one" ? "1" : part))
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace("1 On 1", "1:1");
}

function dateLabel(value: string | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Ongoing";
}

export default async function ManagerInternshipSectionPage({
  params,
}: {
  params: Promise<{ internshipId: string; section: string }>;
}) {
  const { internshipId, section } = await params;

  if (!isManagerProgressHubSection(section)) {
    notFound();
  }

  const context = await requireManagerPage();
  const detail = await getManagerPortfolioDetail(internshipId, context.userId);

  if (!detail.internship.progressHub) {
    notFound();
  }

  const sectionTitle = titleFromSection(section);

  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Internships", href: "/manager/internships" },
            {
              label: detail.internship.intern.displayName,
              href: `/manager/internships/${internshipId}`,
            },
            { label: sectionTitle },
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

      <ProgressHub
        internshipId={internshipId}
        hub={detail.internship.progressHub}
        visibleSection={section}
      />
    </section>
  );
}
