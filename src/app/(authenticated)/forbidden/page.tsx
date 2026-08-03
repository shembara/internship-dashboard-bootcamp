import { ShieldX } from "lucide-react";

import { SignOutButton } from "@/features/auth/SignOutButton";

export default function ForbiddenPage() {
  return (
    <section className="rounded-3xl border bg-card p-8">
      <ShieldX className="size-10 text-destructive" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Access not granted</h1>
      <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
        Your authenticated account does not have the application role required for this
        workspace.
      </p>
      <div className="mt-7">
        <SignOutButton />
      </div>
    </section>
  );
}
