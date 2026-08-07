import { GuestDashboard } from "@/features/guest-dashboard/GuestDashboard";
import { getAuthorizationContext } from "@/server/authorization/context";
import { getOptionalAuthenticatedUser } from "@/server/auth/require-user";
import { getGuestDashboard } from "@/server/guest-dashboard/service";

export default async function GuestPage() {
  const user = await getOptionalAuthenticatedUser();
  const context = user ? await getAuthorizationContext(user) : null;
  const guestDisplayName =
    context?.access === "appUser" ? context.appUser.displayName : undefined;

  return (
    <GuestDashboard
      dashboard={await getGuestDashboard()}
      guestDisplayName={guestDisplayName}
    />
  );
}
