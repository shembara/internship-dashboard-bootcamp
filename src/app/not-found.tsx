import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="dark relative grid min-h-screen place-items-center overflow-hidden bg-[#0b1014] px-5 py-10 text-[#f3f4f6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,163,0.13),transparent_34rem)]" />
      <section className="relative w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#121a20]/95 p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#00e5a3]/20 bg-[#00e5a3]/10 text-[#00e5a3]">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-7 text-sm font-semibold tracking-[0.24em] text-[#00e5a3]">
          ERROR 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9ca3af] sm:text-base">
          This page may have been moved, removed, or the link may be incorrect.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00e5a3] px-4 text-sm font-semibold text-[#08100d] transition hover:bg-[#64f3c5]"
          >
            <Home className="size-4" aria-hidden="true" />
            Go to dashboard
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-[#19242c] px-4 text-sm font-semibold text-[#f3f4f6] transition hover:bg-[#27343c]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
