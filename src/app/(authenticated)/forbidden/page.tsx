import { CircleAlert } from "lucide-react";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export default async function ForbiddenPage() {
  const user = await getOptionalAuthenticatedUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1014] p-5 sm:p-8">
      <section className="w-full max-w-[420px] rounded-[24px] border border-white/[0.08] bg-[#121a20] p-7 text-center text-[#f3f4f6] shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:p-9">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#f87171]/70 bg-[#ea4335]/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <CircleAlert className="size-6 text-[#f87171]" />
        </div>
        <p className="mx-auto mt-5 w-fit rounded-full border border-[#f87171] bg-[#19242c] px-3 py-1 text-xs tracking-[0.05em] text-[#f87171] uppercase">
          No linked person
        </p>
        <h1 className="mt-5 text-[22px] leading-[1.11] font-medium tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm leading-[1.6] text-[#9ca3af]">
          {user?.email ? (
            <>
              This account has signed in successfully, but{" "}
              <strong className="font-medium text-[#f3f4f6]">{user.email}</strong>{" "}
              isn&apos;t linked to an Intern or Teammate profile yet. Ask your manager
              or workspace admin to provision access for your email address.
            </>
          ) : (
            <>
              This account has signed in successfully, but it isn&apos;t linked to an
              Intern or Teammate profile yet. Ask your manager or workspace admin to
              provision access for your email address.
            </>
          )}
        </p>
        <div className="mt-7">
          <SignOutButton
            showLabel
            className="h-12 w-full rounded-xl border-white/[0.08] bg-[#19242c] text-[15px] font-bold text-[#f3f4f6] hover:bg-[#23313a] hover:text-[#f3f4f6]"
          />
        </div>
      </section>
    </main>
  );
}
