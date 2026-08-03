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
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-3xl border bg-card p-9 text-center">
        <ShieldAlert className="mx-auto size-12 text-destructive" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Account disabled</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
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
