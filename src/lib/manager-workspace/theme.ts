import { cn } from "@/lib/utils";

export type WorkspaceVariant = "default" | "dark";

export const managerTheme = {
  page: "-mx-5 -mb-5 min-h-[calc(100vh-4rem)] space-y-6 bg-transparent px-5 pb-5 pt-1 text-white sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8",
  card: "rounded-2xl border border-white/10 bg-[#161b22]",
  cardAccent:
    "rounded-2xl border border-emerald-500/20 bg-[#161b22] shadow-[0_0_32px_rgba(16,185,129,0.12)]",
  label: "text-xs font-medium uppercase tracking-[0.08em] text-[#8b949e]",
  muted: "text-[#8b949e]",
  mutedDim: "text-[#6e7681]",
  input:
    "h-10 w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 text-sm text-white outline-none transition placeholder:text-[#6e7681] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20",
  primaryButton:
    "bg-emerald-400 text-black hover:bg-emerald-300 focus-visible:ring-emerald-400/40",
  outlineButton:
    "border-white/15 bg-[#161b22] text-white hover:border-white/25 hover:bg-white/5",
  ghostButton: "text-[#8b949e] hover:bg-white/5 hover:text-white",
  eyebrow: "text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400",
} as const;

export const managerStatusPillStyles: Record<string, string> = {
  active: "border-emerald-500/50 text-emerald-400",
  cancelled: "border-red-500/50 text-red-400",
  completed: "border-violet-500/50 text-violet-400",
  paused: "border-amber-500/50 text-amber-400",
};

export function managerIdentityBadge(state: "pending" | "linked") {
  return state === "pending"
    ? "rounded-full border border-amber-500/50 px-2.5 py-0.5 text-xs font-medium text-amber-400"
    : "rounded-full border border-emerald-500/50 px-2.5 py-0.5 text-xs font-medium text-emerald-400";
}

export function workspaceStyles(variant: WorkspaceVariant = "default") {
  if (variant === "dark") {
    return {
      section: cn(managerTheme.card, "space-y-4 p-5"),
      sectionFlat: cn(managerTheme.card, "p-5"),
      statCard: "rounded-xl border border-white/10 bg-[#0d1117] p-3",
      innerCard: "rounded-xl border border-white/10 p-3",
      listItem: "rounded-lg border border-white/10 p-3 text-sm text-[#c9d1d9]",
      muted: managerTheme.muted,
      mutedDim: managerTheme.mutedDim,
      label: managerTheme.label,
      fieldLabel: "font-medium text-[#c9d1d9]",
      input: managerTheme.input,
      textarea: cn(
        managerTheme.input,
        "min-h-[80px] resize-y py-2 disabled:cursor-not-allowed disabled:opacity-60",
      ),
      select: managerTheme.input,
      heading: "text-lg font-semibold text-white",
      pageHeading: "text-3xl font-semibold tracking-tight text-white",
      subheading: "text-2xl font-semibold tracking-tight text-white",
      description: cn("mt-1 text-sm", managerTheme.muted),
      eyebrow: managerTheme.eyebrow,
      primaryButton: managerTheme.primaryButton,
      outlineButton: managerTheme.outlineButton,
      dashedPlaceholder:
        "rounded-xl border border-dashed border-white/15 p-6 text-sm text-[#8b949e]",
      error: "text-sm text-red-400",
      borderDivider: "border-white/10",
      kanbanColumn: "min-h-48 rounded-xl border border-white/10 bg-[#0d1117]/60 p-3",
      kanbanColumnTodo: "text-red-400",
      kanbanColumnProgress: "text-amber-400",
      kanbanColumnDone: "text-emerald-400",
      progressBar: "h-3 w-full overflow-hidden rounded-full bg-[#0d1117]",
      progressFill: "h-full rounded-full bg-emerald-500 transition-[width]",
      lifecycleCard: cn(managerTheme.card, "p-5"),
      lifecycleCompleted: "border-emerald-500/30 bg-emerald-500/10",
      lifecycleCurrent:
        "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.15)]",
      lifecycleUpcoming: "border-white/10 bg-[#0d1117]/40 opacity-65",
      lifecycleIconCompleted: "border-emerald-500 bg-emerald-500 text-black",
      lifecycleIconCurrent: "border-emerald-400 bg-[#0d1117] text-emerald-400",
      lifecycleIconUpcoming: "border-[#6e7681] text-[#6e7681]",
      requiredBadge:
        "shrink-0 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-400",
      recommendedBadge:
        "shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400",
      statusPill:
        "inline-flex rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400",
      readOnlyBanner:
        "rounded-xl border border-dashed border-white/15 p-4 text-sm text-[#8b949e]",
      emptyState: "rounded-2xl border border-dashed border-white/15 p-8 text-center",
      reviewFeedback:
        "rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-[#c9d1d9]",
      linkCard:
        "rounded-2xl border border-white/10 bg-[#161b22] p-5 transition hover:border-emerald-500/40",
      valueHighlight: "font-semibold text-emerald-400",
    } as const;
  }

  return {
    section: "space-y-4 rounded-2xl border bg-card p-5 shadow-sm",
    sectionFlat: "rounded-2xl border bg-card p-5 shadow-sm",
    statCard: "rounded-xl border bg-muted/30 p-3",
    innerCard: "rounded-xl border p-3",
    listItem: "rounded-lg border p-3 text-sm",
    muted: "text-muted-foreground",
    mutedDim: "text-muted-foreground",
    label: "text-xs font-medium text-muted-foreground",
    fieldLabel: "font-medium",
    input:
      "rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--brand)]",
    textarea:
      "w-full rounded-lg border bg-background px-3 py-2 outline-none focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60",
    select: "rounded-lg border bg-background px-3 py-2 text-sm",
    heading: "text-lg font-semibold",
    pageHeading: "text-3xl font-semibold tracking-tight",
    subheading: "text-2xl font-semibold tracking-tight",
    description: "mt-1 text-sm text-muted-foreground",
    eyebrow: "text-sm font-medium text-[var(--brand-strong)]",
    primaryButton: undefined,
    outlineButton: undefined,
    dashedPlaceholder:
      "rounded-xl border border-dashed p-6 text-sm text-muted-foreground",
    error: "text-sm text-destructive",
    borderDivider: "border-border",
    kanbanColumn: "min-h-48 rounded-xl border bg-muted/30 p-3",
    kanbanColumnTodo: "",
    kanbanColumnProgress: "",
    kanbanColumnDone: "",
    progressBar: "h-3 w-full overflow-hidden rounded-full bg-muted",
    progressFill: "h-full rounded-full bg-[var(--brand)] transition-[width]",
    lifecycleCard: "rounded-2xl border bg-card p-5 shadow-sm",
    lifecycleCompleted: "border-[var(--brand-soft)] bg-[var(--brand-soft)]/45",
    lifecycleCurrent: "border-[var(--brand)] bg-[var(--brand-soft)] shadow-sm",
    lifecycleUpcoming: "bg-muted/35",
    lifecycleIconCompleted: "border-[var(--brand)] bg-[var(--brand)] text-white",
    lifecycleIconCurrent: "border-[var(--brand)] bg-white text-[var(--brand-strong)]",
    lifecycleIconUpcoming: "border-muted-foreground/40 text-muted-foreground",
    requiredBadge:
      "shrink-0 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-strong)]",
    recommendedBadge:
      "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground",
    statusPill:
      "inline-flex rounded-full border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-2.5 py-1 font-medium text-[var(--brand-strong)]",
    readOnlyBanner: "rounded-xl border border-dashed p-4 text-sm text-muted-foreground",
    emptyState: "rounded-2xl border border-dashed p-8 text-center",
    reviewFeedback:
      "rounded-lg border border-[var(--brand-soft)] bg-[var(--brand-soft)]/35 p-3 text-sm",
    linkCard:
      "rounded-2xl border bg-card p-5 shadow-sm transition hover:border-[var(--brand)]",
    valueHighlight: "font-semibold",
  } as const;
}
