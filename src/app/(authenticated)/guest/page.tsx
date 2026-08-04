import { GuestDashboard } from "@/features/guest-dashboard/GuestDashboard";
import { getGuestDashboard } from "@/server/guest-dashboard/service";

export default async function GuestPage() {
  return <GuestDashboard dashboard={await getGuestDashboard()} />;
}
