import { Rocket, User, Building2, TrendingUp, Calendar } from "lucide-react";

interface StartupDNACardProps {
  founderNames?: string[] | null;
  founderPreviousCompanies?: string[] | null;
  fundingStage?: string | null;
  foundedYear?: number | null;
  companyName: string;
}

export function StartupDNACard({
  founderNames,
  founderPreviousCompanies,
  fundingStage,
  foundedYear,
  companyName,
}: StartupDNACardProps) {
  const hasData = founderNames?.length || fundingStage || foundedYear;
  if (!hasData) return null;

  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Rocket className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
          Startup DNA
        </span>
      </div>
      <div className="p-5 space-y-4">
        {founderNames?.length ? (
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <div className="font-mono text-xs uppercase text-muted-foreground mb-1">Founded by</div>
              <div className="text-sm text-foreground">{founderNames.join(", ")}</div>
            </div>
          </div>
        ) : null}

        {founderPreviousCompanies?.length ? (
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <div className="font-mono text-xs uppercase text-muted-foreground mb-1">Previously at</div>
              <div className="flex flex-wrap gap-1.5">
                {founderPreviousCompanies.map((c) => (
                  <span key={c} className="text-xs bg-muted px-2 py-0.5 text-foreground">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {fundingStage && (
            <div className="bg-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Funding</span>
              </div>
              <div className="text-sm font-semibold text-foreground">{fundingStage}</div>
            </div>
          )}
          {foundedYear && (
            <div className="bg-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Founded</span>
              </div>
              <div className="text-sm font-semibold text-foreground">{foundedYear}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
