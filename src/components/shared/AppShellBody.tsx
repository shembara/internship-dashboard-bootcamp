"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/shared/Sidebar";
import { shouldShowSidebar } from "@/config/sidebar.config";
import { cn } from "@/lib/utils";

export function AppShellBody({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname, roles);
  const isGuestWorkspace = pathname.startsWith("/guest");
  const isManagerHub =
    pathname === "/manager/internships" || pathname === "/manager/people";

  return (
    <div
      className={cn(
        "grid gap-8 p-5 sm:p-8",
        showSidebar && "md:grid-cols-[240px_minmax(0,1fr)]",
        (isGuestWorkspace || isManagerHub) && "bg-[#0d1117]",
      )}
    >
      <Sidebar roles={roles} />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
