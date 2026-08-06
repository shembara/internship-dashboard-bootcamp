import { ShieldX } from "lucide-react";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export default async function ForbiddenPage() {
  const user = await getOptionalAuthenticatedUser();

  return (
    <section className="rounded-3xl border border-white/10 bg-[#161b22] p-8 text-white shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
      <ShieldX className="size-10 text-red-400" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Account not invited
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-[#8b949e]">
        {user?.email ? (
          <>
            The account <strong className="font-medium text-white">{user.email}</strong>{" "}
            was not invited to this workspace. Please ask a manager to provision access
            for this email.
          </>
        ) : (
          <>
            Your authenticated account was not invited to this workspace. Please ask a
            manager to provision access for your email.
          </>
        )}
      </p>
      <div className="mt-7">
        <SignOutButton />
      </div>
    </section>
  );
}
