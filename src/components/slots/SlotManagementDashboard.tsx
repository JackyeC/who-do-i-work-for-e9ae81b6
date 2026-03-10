import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { SlotTracker } from "./SlotTracker";
import { TrackedCompanyCard } from "./TrackedCompanyCard";
import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function SlotManagementDashboard() {
  const { trackedCompanies, isLoading, untrackCompany, isPremium } = useTrackedCompanies();
  const navigate = useNavigate();

  if (!isPremium) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Track Companies</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Subscribe to track companies and unlock full intelligence dossiers.
        </p>
        <Button onClick={() => navigate("/login")}>Get Started</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SlotTracker />

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tracked companies...</div>
      ) : trackedCompanies.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/40 rounded-2xl">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-semibold text-foreground mb-1">No companies tracked yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Search for a company and track it to unlock the full intelligence dossier.
          </p>
          <Button size="sm" onClick={() => navigate("/browse")}>
            Browse Companies
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trackedCompanies.map((tc) => (
            <TrackedCompanyCard
              key={tc.id}
              tracked={tc}
              onUntrack={(companyId) => untrackCompany.mutate(companyId)}
              isUntracking={untrackCompany.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
