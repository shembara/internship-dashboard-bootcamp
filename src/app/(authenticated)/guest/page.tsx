import { GuestDashboard } from "@/features/guest-dashboard/GuestDashboard";
import { getGuestDashboard } from "@/server/guest-dashboard/service";

export default async function GuestPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b1014] py-6 md:py-10">
      <GuestDashboard dashboard={await getGuestDashboard()} />
    </div>
  );
}
