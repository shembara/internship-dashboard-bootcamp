export const managerTheme = {
  page: "-mx-5 -mb-5 min-h-[calc(100vh-4rem)] space-y-6 bg-[#0d1117] px-5 pb-5 pt-1 text-white sm:-mx-8 sm:-mb-8 sm:px-8 sm:pb-8",
  card: "rounded-2xl border border-white/10 bg-[#161b22]",
  cardAccent:
    "rounded-2xl border border-emerald-500/20 bg-[#161b22] shadow-[0_0_32px_rgba(16,185,129,0.12)]",
  label:
    "text-xs font-medium uppercase tracking-[0.08em] text-[#8b949e]",
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
