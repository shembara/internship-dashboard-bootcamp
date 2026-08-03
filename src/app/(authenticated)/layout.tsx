import { redirect } from "next/navigation";

import { AppShell } from "@/components/shared/AppShell";
import { getAuthorizationContext } from "@/server/authorization/context";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalAuthenticatedUser();
  if (!user) {
    redirect("/sign-in");
  }

  const context = await getAuthorizationContext(user);
  if (context.access === "disabled") {
    redirect("/access-disabled");
  }

  return <AppShell context={context}>{children}</AppShell>;
}
