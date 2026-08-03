import Link from "next/link";
import type { AuthorizationContext } from "@/server/authorization/context";

import { SignOutButton } from "@/features/auth/SignOutButton";

export function AppShell({
  children,
  context,
}: {
  children: React.ReactNode;
  context: AuthorizationContext;
}) {
  const identityName =
    context.access === "appUser"
      ? context.appUser.displayName
      : (context.user.displayName ?? context.user.email);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
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
                ? context.appUser.roles.join(" · ")
                : context.access}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
        <main>{children}</main>
      </div>
    </div>
  );
}
