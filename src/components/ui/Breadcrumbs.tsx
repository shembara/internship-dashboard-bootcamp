import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link
            href="/"
            aria-label="Home"
            className="flex rounded-md p-1 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
          >
            <Home className="size-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.href ?? item.label} className="flex items-center gap-1">
            <ChevronRight aria-hidden="true" className="size-4" />
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-md px-1 py-1 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === items.length - 1 ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
