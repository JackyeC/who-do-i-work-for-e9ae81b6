import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, Heart, Users, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const MOCK_COMPANIES = [
  {
    name: "Lattice",
    industry: "HR Technology",
    overview: "People management platform for performance, engagement, and growth",
    valuesMatch: 91,
    hiringSignal: "Hiring 12 roles in Talent & People Ops",
    valuesSignals: ["Strong DEI programs", "Remote-first culture", "Employee development focus"],
    talentSignals: ["Growing People Analytics team", "New VP People role posted"],
    slug: "lattice",
  },
  {
    name: "Patagonia",
    industry: "Retail / Outdoor",
    overview: "Outdoor apparel company known for environmental activism and worker benefits",
    valuesMatch: 88,
    hiringSignal: "Expanding HR team across retail locations",
    valuesSignals: ["Climate commitment", "Living wage policy", "Activism-friendly culture"],
    talentSignals: ["New talent strategy roles", "Internal mobility program"],
    slug: "patagonia",
  },
  {
    name: "Stripe",
    industry: "Fintech",
    overview: "Financial infrastructure platform for internet businesses",
    valuesMatch: 84,
    hiringSignal: "5 open Recruiting roles in North America",
    valuesSignals: ["Pay transparency", "Remote flexibility", "Strong engineering culture"],
    talentSignals: ["Scaling recruiting operations", "New talent analytics function"],
    slug: "stripe",
  },
  {
    name: "Greenhouse",
    industry: "HR Technology",
    overview: "Hiring platform built for structured, fair recruiting processes",
    valuesMatch: 82,
    hiringSignal: "Customer Success + Product roles open",
    valuesSignals: ["Anti-bias hiring framework", "Diversity advocacy", "Transparent culture"],
    talentSignals: ["Product team growth", "DE&I consulting arm expanding"],
    slug: "greenhouse",
  },
  {
    name: "Gusto",
    industry: "HR / Payroll Tech",
    overview: "All-in-one people platform for small businesses",
    valuesMatch: 79,
    hiringSignal: "Building out People Analytics",
    valuesSignals: ["Small business support", "Benefits equity", "Worker-first philosophy"],
    talentSignals: ["New workforce intelligence unit", "Engineering expansion"],
    slug: "gusto",
  },
];

export function AICompanyDiscoveryStep() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          These companies were identified using your skills, values, industry background, and career anchors.
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_COMPANIES.map(company => (
          <Card key={company.name} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-base font-semibold text-foreground">{company.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{company.industry}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{company.overview}</p>

                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3 h-3 text-[hsl(var(--civic-green))]" />
                    <span className="text-xs text-[hsl(var(--civic-green))] font-medium">{company.hiringSignal}</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Heart className="w-3 h-3" /> Values Signals
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {company.valuesSignals.map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Talent Signals
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {company.talentSignals.map(s => (
                          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center shrink-0">
                  <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center mb-1.5">
                    <span className="text-lg font-bold text-primary">{company.valuesMatch}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">values match</p>
                  <Link to={`/company/${company.slug}`}>
                    <Button variant="ghost" size="sm" className="mt-2 text-[10px] gap-1 h-7">
                      Dossier <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
