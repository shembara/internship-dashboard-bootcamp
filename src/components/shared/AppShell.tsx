import type { AuthorizationContext } from "@/server/authorization/context";

import { AppShellBody } from "@/components/shared/AppShellBody";
import { AppShellHeader } from "@/components/shared/AppShellHeader";

export function AppShell({
  children,
  context,
}: {
  children: React.ReactNode;
  context: AuthorizationContext;
}) {
  const identityName =
    context.access === "appUser"
      ? context.appUser.displayName
      : (context.user.displayName ?? context.user.email);

  const roles = context.access === "appUser" ? context.appUser.roles : [];
  const rolesLabel =
    context.access === "appUser"
      ? context.appUser.roles.join(" · ")
      : context.access === "disabled"
        ? "disabled"
        : "Not invited";

  return (
    <div className="min-h-screen">
      <AppShellHeader identityName={identityName} rolesLabel={rolesLabel} />

      <AppShellBody roles={roles}>{children}</AppShellBody>
    </div>
  );
}
