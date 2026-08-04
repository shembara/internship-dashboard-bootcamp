"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/shared/Sidebar";
import { cn } from "@/lib/utils";

export function AppShellBody({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) {
  const pathname = usePathname();

  const hasSidebar =
    (roles.includes("intern") && pathname.startsWith("/intern")) ||
    (roles.includes("teammate") && pathname.startsWith("/teammate")) ||
    (roles.includes("manager") &&
      /^\/manager\/internships\/[^/]+/.test(pathname));

  return (
    <div
      className={cn(
        "mx-auto max-w-6xl gap-6 px-4 py-6 sm:px-6 md:py-10",
        hasSidebar && "grid md:grid-cols-[260px_minmax(0,1fr)]",
      )}
    >
      {hasSidebar ? <Sidebar roles={roles} /> : null}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
