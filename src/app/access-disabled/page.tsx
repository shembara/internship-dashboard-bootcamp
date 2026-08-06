import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { getAuthorizationContext } from "@/server/authorization/context";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export default async function AccessDisabledPage() {
  const user = await getOptionalAuthenticatedUser();
  if (!user) {
    redirect("/sign-in");
  }

  const context = await getAuthorizationContext(user);
  if (context.access !== "disabled") {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d1117] p-6 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#161b22] p-9 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <ShieldAlert className="mx-auto size-12 text-red-400" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Account disabled</h1>
        <p className="mt-3 leading-7 text-[#8b949e]">
          Your application-user account is disabled. Contact an administrator if you
          believe this is unexpected.
        </p>
        <div className="mt-7 flex justify-center">
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
