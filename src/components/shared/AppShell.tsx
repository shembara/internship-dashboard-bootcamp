import Link from "next/link";
import type { AuthorizationContext } from "@/server/authorization/context";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { applicationRoles } from "@/lib/users/roles";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  context,
}: {
  children: React.ReactNode;
  context: AuthorizationContext;
}) {
  if (context.access === "notInvited") {
    return <>{children}</>;
  }

  const identityName =
    context.access === "appUser"
      ? context.appUser.displayName
      : (context.user.displayName ?? context.user.email);
  const roleLabels =
    context.access === "appUser"
      ? context.appUser.roles.map(
          (role) =>
            applicationRoles.find((option) => option.value === role)?.label ?? role,
        )
      : [];
  const isDarkWorkspace =
    context.access === "appUser" &&
    (context.appUser.roles.includes("guest") ||
      context.appUser.roles.includes("manager") ||
      context.appUser.roles.includes("intern") ||
      context.appUser.roles.includes("teammate"));
  return (
    <div
      className={cn(
        "min-h-screen",
        isDarkWorkspace && "dark bg-[#0b1014] text-[#f3f4f6]",
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-20 border-b backdrop-blur-xl",
          isDarkWorkspace ? "border-white/[0.08] bg-[#0b1014]/95" : "bg-background/90",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-bold text-white">
              F
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-semibold">
                Internship Dashboard
              </span>
              <span className="block text-xs text-muted-foreground">Fluxon</span>
            </span>
          </Link>

          <div className="ml-auto min-w-0 text-right">
            <p className="truncate text-sm font-medium">{identityName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {context.access === "appUser"
                ? roleLabels.join(" · ")
                : context.access === "disabled"
                  ? "disabled"
                  : "Not invited"}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div
        className={cn(
          "px-4 py-6 sm:px-6 md:py-10",
          isDarkWorkspace ? "mx-auto w-full" : "mx-auto max-w-6xl",
        )}
      >
        <main>{children}</main>
      </div>
    </div>
  );
}
