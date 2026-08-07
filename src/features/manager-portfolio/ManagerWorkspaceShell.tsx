import type { ReactNode } from "react";

import { managerTheme } from "@/lib/manager-workspace/theme";
import { cn } from "@/lib/utils";

export function ManagerWorkspaceShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn(managerTheme.page, className)}>{children}</section>;
}

export const WorkspaceShell = ManagerWorkspaceShell;
