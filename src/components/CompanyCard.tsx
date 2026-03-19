import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { InsiderScorePill } from "@/components/InsiderScorePill";
import { usePersona } from "@/hooks/use-persona";
import { formatCurrency, type Company } from "@/data/sampleData";
import { Building2, ArrowRight } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const { ctaCopy } = usePersona();
  return (
    <Link to={`/company/${company.id}`}>
      <Card className="group hover:border-primary/30 transition-all duration-200 cursor-pointer h-full hover-lift" style={{ borderRadius: '16px', padding: 0 }}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-muted-foreground/70" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-foreground group-hover:text-primary transition-colors truncate" style={{ fontSize: '20px', fontWeight: 600 }}>
                  {company.name}
                </h3>
                <p className="text-label text-muted-foreground">
                  {company.industry} · {company.state}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0 mt-1" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
              <InsiderScorePill score={company.insiderScore ?? null} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted-foreground">
                {company.totalPacSpending > 0
                  ? `PAC: ${formatCurrency(company.totalPacSpending)}`
                  : "No PAC spending"}
              </span>
              <span className="text-caption text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">{ctaCopy} →</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
