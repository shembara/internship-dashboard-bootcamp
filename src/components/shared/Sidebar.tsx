"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  if (pathname.startsWith("/manager") && sidebarRoles.includes("manager")) {
    return "manager";
  }

  if (pathname.startsWith("/teammate") && sidebarRoles.includes("teammate")) {
    return "teammate";
  }

  return sidebarRoles[0] ?? null;
}

function getTeammateInternshipId(pathname: string) {
  const match = pathname.match(/^\/teammate\/internships\/([^/]+)/);
  return match?.[1] ?? null;
}

function resolveHref(href: string, pathname: string, internshipId: string | null) {
  if (!href.startsWith("#")) return href;

  if (internshipId) {
    return `/teammate/internships/${internshipId}${href}`;
  }

  return `${pathname}${href}`;
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
    const targetPath = path || pathname;
    return pathname === targetPath && hash === itemHash;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
  const internshipId = getTeammateInternshipId(pathname);

  const groups = useMemo<SidebarGroup[]>(() => {
    if (!role) return [];

    const config = sidebarConfigByRole[role];
    if (!config) return [];

    if (role === "teammate" && internshipId && config.workspace) {
      return config.workspace;
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

          return (
            <div key={group.label} className="min-w-56 shrink-0 md:min-w-0">
              <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                <GroupIcon className="size-3.5" aria-hidden="true" />
                <span className="truncate">{group.label}</span>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const href = resolveHref(item.href, pathname, internshipId);
                  const active = isItemActive({ href, pathname, hash });

                  return (
                    <Link
                      key={`${group.label}-${item.href}`}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
          );
        })}
      </nav>
    </aside>
  );
}
