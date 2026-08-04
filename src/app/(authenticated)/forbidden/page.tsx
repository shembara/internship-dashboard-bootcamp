import { ShieldX } from "lucide-react";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export default async function ForbiddenPage() {
  const user = await getOptionalAuthenticatedUser();

  return (
    <section className="rounded-3xl border bg-card p-8">
      <ShieldX className="size-10 text-destructive" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Account not invited
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
        {user?.email ? (
          <>
            The account <strong className="font-medium text-foreground">{user.email}</strong> was not invited to this workspace. Please ask a manager to provision access for this email.
          </>
        ) : (
          <>
            Your authenticated account was not invited to this workspace. Please ask a manager to provision access for your email.
          </>
        )}
      </p>
      <div className="mt-7">
        <SignOutButton />
      </div>
    </section>
  );
}
