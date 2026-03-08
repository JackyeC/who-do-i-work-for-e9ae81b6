import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { formatCurrency, type Company } from "@/data/sampleData";
import { Building2, ArrowRight } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link to={`/company/${company.id}`}>
      <Card className="group hover:shadow-elevated transition-all duration-200 hover:border-primary/15 cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-muted-foreground/70" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {company.name}
                </h3>
                <p className="text-caption text-muted-foreground">
                  {company.industry} · {company.state}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0 mt-1" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
            <span className="text-micro text-muted-foreground">
              {company.totalPacSpending > 0
                ? `PAC: ${formatCurrency(company.totalPacSpending)}`
                : "No PAC spending"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
