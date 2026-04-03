import { DollarSign } from "lucide-react";

interface Props {
  companyName?: string;
}

export function FollowTheMoneyHeader({ companyName }: Props) {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Follow the Money
        </h1>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
        {companyName
          ? `Where ${companyName}'s political dollars go — PAC contributions, lobbying, and dark money channels traced from FEC filings and Senate LDA disclosures.`
          : "Trace corporate political spending from PAC contributions to Congress. Built from FEC filings, Senate LDA disclosures, and verified public records."}
      </p>
    </header>
  );
}
