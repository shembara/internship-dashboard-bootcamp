import type { LucideIcon } from "lucide-react";

export function WorkspacePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <section>
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{description}</p>

      <div className="mt-8 rounded-3xl border bg-card p-8 shadow-[0_18px_60px_rgba(22,78,63,0.06)]">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon className="size-6" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Foundation ready</h2>
        <p className="mt-2 max-w-xl leading-6 text-muted-foreground">
          This workspace intentionally contains no internship features in version 0.0.1.
          Its purpose is to verify authentication, authorization, navigation, and
          deployment configuration.
        </p>
      </div>
    </section>
  );
}
