import { DashboardStats } from "./DashboardStats";
import { DashboardOnboarding } from "./DashboardOnboarding";

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <DashboardStats />
      <DashboardOnboarding onNavigate={onNavigate} />
    </div>
  );
}
