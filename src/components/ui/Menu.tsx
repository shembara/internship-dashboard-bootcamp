"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type MenuItem = {
  href: string;
  label: string;
};

export function Menu({
  items,
  label,
  className,
}: {
  items: MenuItem[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <nav aria-label={label} className={cn("flex gap-2 overflow-x-auto", className)}>
      {items.map((item, index) => {
        const active = item.href.startsWith("#")
          ? hash
            ? hash === item.href
            : index === 0
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                : "text-muted-foreground hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
