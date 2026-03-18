import { User, Building2, Calendar, TrendingUp, Users, Briefcase, Shield, Scan } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PrivateCompanyIdentityCardProps {
  companyName: string;
  founderNames?: string[] | null;
  founderPreviousCompanies?: string[] | null;
  foundedYear?: number | null;
  fundingStage?: string | null;
  parentCompany?: string | null;
  employeeCount?: string | null;
  description?: string | null;
  ownershipStructure?: string | null;
  onTriggerScan?: () => void;
  isScanLoading?: boolean;
}

export function PrivateCompanyIdentityCard({
  companyName,
  founderNames,
  founderPreviousCompanies,
  foundedYear,
  fundingStage,
  parentCompany,
  employeeCount,
  description,
  ownershipStructure,
  onTriggerScan,
  isScanLoading,
}: PrivateCompanyIdentityCardProps) {
  const hasFounderData = founderNames && founderNames.length > 0;
  const hasAnyData = hasFounderData || foundedYear || parentCompany || employeeCount || description || ownershipStructure;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Shield className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary font-semibold">
          Who Runs {companyName}
        </span>
      </div>
      <CardContent className="p-5 space-y-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}

        {/* Founders / Owners */}
        {hasFounderData ? (
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
               <div className="font-mono text-xs uppercase text-muted-foreground mb-1 tracking-wider">
                Founders / Owners
              </div>
              <div className="text-sm font-medium text-foreground">{founderNames!.join(", ")}</div>
            </div>
          </div>
        ) : null}

        {/* Founder backgrounds */}
        {founderPreviousCompanies && founderPreviousCompanies.length > 0 && (
          <div className="flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
               <div className="font-mono text-xs uppercase text-muted-foreground mb-1 tracking-wider">
                Previously At
              </div>
              <div className="flex flex-wrap gap-1.5">
                {founderPreviousCompanies.map((c) => (
                  <span key={c} className="text-xs bg-muted px-2 py-0.5 text-foreground rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Parent company */}
        {parentCompany && (
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
               <div className="font-mono text-xs uppercase text-muted-foreground mb-1 tracking-wider">
                Parent Company
              </div>
              <div className="text-sm font-medium text-foreground">{parentCompany}</div>
            </div>
          </div>
        )}

        {/* Ownership structure */}
        {ownershipStructure && (
          <div className="flex items-start gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <div className="font-mono text-xs uppercase text-muted-foreground mb-1 tracking-wider">
                Ownership Structure
              </div>
              <div className="text-sm text-foreground">{ownershipStructure}</div>
            </div>
          </div>
        )}

        {/* Grid: stats */}
        {(foundedYear || fundingStage || employeeCount) && (
          <div className="grid grid-cols-3 gap-px bg-border border border-border rounded">
            {foundedYear && (
              <div className="bg-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-xs uppercase text-muted-foreground">Founded</span>
                </div>
                <div className="text-sm font-semibold text-foreground">{foundedYear}</div>
              </div>
            )}
            {fundingStage && (
              <div className="bg-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-xs uppercase text-muted-foreground">Stage</span>
                </div>
                <div className="text-sm font-semibold text-foreground">{fundingStage}</div>
              </div>
            )}
            {employeeCount && (
              <div className="bg-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">Employees</span>
                </div>
                <div className="text-sm font-semibold text-foreground">{employeeCount}</div>
              </div>
            )}
          </div>
        )}

        {/* No data state */}
        {!hasAnyData && (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ownership and founder data not yet available for {companyName}.
            </p>
            {onTriggerScan && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTriggerScan}
                disabled={isScanLoading}
                className="gap-2"
              >
                <Scan className="w-3.5 h-3.5" />
                {isScanLoading ? "Scanning…" : "Run Private Company Scan"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
