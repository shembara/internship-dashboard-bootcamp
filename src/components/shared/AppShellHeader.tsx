"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { cn } from "@/lib/utils";

export function AppShellHeader({
  identityName,
  rolesLabel,
}: {
  identityName: string;
  rolesLabel: string;
}) {
  const pathname = usePathname();
  const isDark = pathname.startsWith("/guest");

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b backdrop-blur-xl",
        isDark
          ? "border-white/10 bg-[#0d1117]/95 text-white"
          : "border-border bg-background/90",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white",
              isDark
                ? "bg-gradient-to-br from-teal-400 to-cyan-600 shadow-[0_0_16px_rgba(45,212,191,0.25)]"
                : "bg-[var(--brand)]",
            )}
          >
            F
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-semibold">
              Internship Dashboard
            </span>
            <span
              className={cn(
                "block text-xs",
                isDark ? "text-[#8b949e]" : "text-muted-foreground",
              )}
            >
              Fluxon
            </span>
          </span>
        </Link>

        <div className="ml-auto min-w-0 text-right">
          <p className="truncate text-sm font-medium">{identityName}</p>
          <p
            className={cn(
              "truncate text-xs",
              isDark ? "text-[#8b949e]" : "text-muted-foreground",
            )}
          >
            {rolesLabel}
          </p>
        </div>

        <SignOutButton tone={isDark ? "dark" : "default"} />
      </div>
    </header>
  );
}
