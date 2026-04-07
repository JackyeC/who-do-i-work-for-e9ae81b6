import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";

export function FullyAuditedShowcase() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["fully-audited-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry, logo_url, employer_clarity_score, description")
        .eq("vetted_status", "fully_audited")
        .order("employer_clarity_score", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="px-6 lg:px-16 py-16 bg-card/30 border-y border-border/30">
        <div className="max-w-[1100px] mx-auto">
          <Skeleton className="h-6 w-48 mb-8 mx-auto" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!companies || companies.length === 0) return null;

  return (
    <section className="px-6 lg:px-16 py-20 lg:py-28 bg-card/30 border-y border-border/30">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[hsl(var(--civic-green))]/60" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--civic-green))]/60">
              Fully Audited
            </p>
          </div>
          <h2
            className="font-sans text-foreground text-center mb-3"
            style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, letterSpacing: "-0.5px" }}
          >
            Start here: verified employer intelligence
          </h2>
          <p className="text-sm text-muted-foreground max-w-[50ch] mx-auto leading-relaxed">
            These companies have complete identity, multi-source claims, and full attribution.
            Every claim links to a public record.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              to={`/company/${company.slug}`}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border/40 bg-card hover:border-[hsl(var(--civic-green))]/30 hover:shadow-[0_0_16px_hsl(var(--civic-green)/0.08)] transition-all"
            >
              {company.logo_url ? (
              <CompanyLogo
                  companyId={company.id}
                  logoUrl={company.logo_url}
                  companyName={company.name}
                  size="sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground/60" />
                </div>
              )}
              <div className="text-center min-w-0 w-full">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-[hsl(var(--civic-green))] transition-colors">
                  {company.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{company.industry}</p>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] gap-1 px-1.5 py-0 border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/[0.06]"
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                Audited
              </Badge>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/browse?filter=fully_audited"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            View all audited companies <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
