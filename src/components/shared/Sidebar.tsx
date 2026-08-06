"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  isSidebarRole,
  sidebarConfigByRole,
  type SidebarGroup,
  type SidebarRole,
} from "@/config/sidebar.config";
import { cn } from "@/lib/utils";

type SidebarProps = {
  roles: string[];
};

function getSidebarRoleForPath(pathname: string, roles: string[]): SidebarRole | null {
  const sidebarRoles = roles.filter(isSidebarRole);

  if (pathname.startsWith("/intern") && sidebarRoles.includes("intern")) {
    return "intern";
  }

  if (
    /^\/manager\/internships\/[^/]+/.test(pathname) &&
    sidebarRoles.includes("manager")
  ) {
    return "manager";
  }

  if (pathname.startsWith("/teammate") && sidebarRoles.includes("teammate")) {
    return "teammate";
  }

  return null;
}

function getInternshipId(pathname: string, role: SidebarRole | null) {
  if (role === "manager") {
    return pathname.match(/^\/manager\/internships\/([^/]+)/)?.[1] ?? null;
  }

  if (role === "teammate") {
    return pathname.match(/^\/teammate\/internships\/([^/]+)/)?.[1] ?? null;
  }

  return null;
}

function isWorkspaceSegment(href: string) {
  return !href.startsWith("/") && !href.startsWith("#");
}

function resolveHref({
  href,
  pathname,
  role,
  internshipId,
}: {
  href: string;
  pathname: string;
  role: SidebarRole | null;
  internshipId: string | null;
}) {
  if (role === "manager" && internshipId && isWorkspaceSegment(href)) {
    return `/manager/internships/${internshipId}/${href}`;
  }

  // Mentor / teammate workspace relative route resolution
  if (role === "teammate" && internshipId) {
    if (href.startsWith("#")) {
      return `/teammate/internships/${internshipId}${href}`;
    }
    if (isWorkspaceSegment(href)) {
      return `/teammate/internships/${internshipId}/${href}`;
    }
  }

  if (href.startsWith("#")) {
    return `${pathname}${href}`;
  }

  return href;
}

function getHrefParts(href: string) {
  const [path, hash] = href.split("#");

  return {
    path,
    hash: hash ? `#${hash}` : "",
  };
}

function isItemActive({
  href,
  pathname,
  hash,
}: {
  href: string;
  pathname: string;
  hash: string;
}) {
  const { path, hash: itemHash } = getHrefParts(href);

  if (itemHash) {
    return pathname === path && hash === itemHash;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive({
  group,
  pathname,
  hash,
  role,
  internshipId,
}: {
  group: SidebarGroup;
  pathname: string;
  hash: string;
  role: SidebarRole | null;
  internshipId: string | null;
}) {
  return group.items.some((item) => {
    const resolvedHref = resolveHref({
      href: item.href,
      pathname,
      role,
      internshipId,
    });

    return isItemActive({
      href: resolvedHref,
      pathname,
      hash,
    });
  });
}

export function Sidebar({ roles }: SidebarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const role = getSidebarRoleForPath(pathname, roles);
  const internshipId = getInternshipId(pathname, role);

  const groups = useMemo<SidebarGroup[]>(() => {
    if (!role) return [];

    const config = sidebarConfigByRole[role];
    if (!config) return [];

    if ((role === "manager" || role === "teammate") && internshipId) {
      return config.workspace ?? config.general;
    }

    return config.general;
  }, [role, internshipId]);

  if (!role || !groups.length) return null;

  const config = sidebarConfigByRole[role];

  return (
    <aside className="md:sticky md:top-24 md:self-start">
      <nav
        aria-label={config?.label ?? "Sidebar navigation"}
        className="flex gap-3 overflow-x-auto rounded-2xl border bg-card p-3 shadow-sm md:max-h-[calc(100vh-7rem)] md:flex-col md:overflow-y-auto"
      >
        {groups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = isGroupActive({
            group,
            pathname,
            hash,
            role,
            internshipId,
          });

          return (
            <div
              key={group.label}
              className="group/sidebar-folder min-w-56 shrink-0 rounded-xl md:min-w-0"
            >
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors",
                  groupActive
                    ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <GroupIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                <ChevronDown
                  className="size-4 shrink-0 transition-transform group-hover/sidebar-folder:rotate-180 group-focus-within/sidebar-folder:rotate-180"
                  aria-hidden="true"
                />
              </div>

              <div className="hidden pt-1 group-hover/sidebar-folder:block group-focus-within/sidebar-folder:block">
                <div className="ml-5 space-y-1 border-l border-border/80 pl-3">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    const href = resolveHref({
                      href: item.href,
                      pathname,
                      role,
                      internshipId,
                    });
                    const active = isItemActive({ href, pathname, hash });

                    return (
                      <Link
                        key={`${group.label}-${item.href}-${item.label}-${itemIndex}`}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                            : "text-muted-foreground hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
