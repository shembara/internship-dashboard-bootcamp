import { GuestDashboard } from "@/features/guest-dashboard/GuestDashboard";
import { getGuestDashboard } from "@/server/guest-dashboard/service";
import { requireGuestPage } from "@/server/assignments/page-auth";

export default async function GuestPage() {
  await requireGuestPage();
  return <GuestDashboard dashboard={await getGuestDashboard()} />;
}
