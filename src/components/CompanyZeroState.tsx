import { IntelligenceRequestCard } from "@/components/IntelligenceRequestCard";

interface CompanyZeroStateProps {
  companyName: string;
  companyId?: string;
  onDiscovered?: (companyId: string, slug: string) => void;
}

export function CompanyZeroState({ companyName, companyId, onDiscovered }: CompanyZeroStateProps) {
  return (
    <IntelligenceRequestCard
      companyName={companyName}
      companyId={companyId}
      onDiscovered={onDiscovered}
    />
  );
}
