import { DollarSign } from "lucide-react";

interface Props {
  companyName?: string;
}

export function FollowTheMoneyHeader({ companyName }: Props) {
  return (
    <header className="space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Follow the Money
        </h1>
      </div>
      <p className="text-sm font-medium text-foreground/90 max-w-2xl">
        {companyName
          ? `See the federal political contribution footprint connected to ${companyName} across recent election cycles.`
          : "See the federal political contribution footprint connected to this employer name across recent election cycles."}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
        This page summarizes federal campaign contributions where this employer was reported on FEC filings.
        It is designed to show patterns of political activity connected to a company's network, not to imply
        that every contribution reflects an official corporate position.
      </p>
    </header>
  );
}
