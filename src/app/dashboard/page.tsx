import DashboardActivity from "@/components/sections/dashboard/DashboardActivity";
import DashboardForms from "@/components/sections/dashboard/DashboardForms";
import DashboardHeader from "@/components/sections/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/sections/dashboard/DashboardSidebar";
import DashboardStats from "@/components/sections/dashboard/DashboardStats";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 space-y-8 px-6 py-8">
            <DashboardStats />
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <DashboardForms />
              <DashboardActivity />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
