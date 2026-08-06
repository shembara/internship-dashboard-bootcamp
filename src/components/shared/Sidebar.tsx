"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  getSidebarRoleForPath,
  sidebarConfigByRole,
  type SidebarGroup,
  type SidebarRole,
} from "@/config/sidebar.config";
import { cn } from "@/lib/utils";

type SidebarProps = {
  roles: string[];
};

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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

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

          const isExpanded = expandedGroups[group.label] ?? groupActive;

          return (
            <div
              key={group.label}
              className="min-w-56 shrink-0 rounded-xl md:min-w-0"
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isExpanded}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors cursor-pointer",
                  groupActive
                    ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <GroupIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>

              {isExpanded ? (
                <div className="pt-1">
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
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
