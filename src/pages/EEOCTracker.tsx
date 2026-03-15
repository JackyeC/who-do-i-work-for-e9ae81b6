import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale, AlertTriangle, ExternalLink, MapPin, Calendar,
  Shield, Gavel, Building2, Users, ChevronRight
} from "lucide-react";

interface EEOCCase {
  id: string;
  company_name: string;
  company_id: string | null;
  case_name: string;
  case_number: string | null;
  court_name: string | null;
  discrimination_type: string;
  discrimination_category: string;
  eeoc_filing_date: string | null;
  eeoc_drop_date: string | null;
  action_type: string;
  status: string;
  state: string | null;
  summary: string | null;
  source_url: string | null;
  court_filing_url: string | null;
  eeoc_litigation_url: string | null;
  confidence: string;
  detection_method: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  moved_to_dismiss: { label: "Moved to Dismiss", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  withdrew: { label: "Withdrew", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  settled: { label: "Settled", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  dismissed: { label: "Dismissed", color: "text-muted-foreground border-border bg-muted/50" },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof Users }> = {
  gender_identity: { label: "Gender Identity / LGBTQ+", icon: Users },
  race: { label: "Race Discrimination", icon: Users },
  sex: { label: "Sex Discrimination", icon: Users },
  disability: { label: "Disability", icon: Users },
  age: { label: "Age Discrimination", icon: Users },
  retaliation: { label: "Retaliation", icon: Shield },
  disparate_impact: { label: "Disparate Impact", icon: Scale },
};

export default function EEOCTracker() {
  usePageSEO({
    title: "EEOC Case Tracker — Dropped & Withdrawn Lawsuits | Who Do I Work For?",
    description: "Track EEOC lawsuits that were dropped, dismissed, or withdrawn. Transparency on federal enforcement shifts affecting workers.",
  });

  const { data: cases, isLoading } = useQuery({
    queryKey: ["eeoc-dropped-cases"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("eeoc_dropped_cases")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as EEOCCase[];
    },
  });

  const totalCases = cases?.length || 0;
  const byCategory = cases?.reduce((acc, c) => {
    acc[c.discrimination_category] = (acc[c.discrimination_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const byAction = cases?.reduce((acc, c) => {
    acc[c.action_type] = (acc[c.action_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <Gavel className="w-6 h-6 text-red-400" />
            </div>
            <Badge variant="outline" className="text-[10px] font-mono tracking-wider border-red-500/30 text-red-400">
              ENFORCEMENT TRACKER
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            EEOC Dropped & Withdrawn Cases
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Tracking federal employment discrimination lawsuits where the EEOC moved to dismiss or 
            withdrew participation. These shifts in enforcement directly affect worker protections.
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-4 italic flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Data sourced from court filings, AP reporting, and public records. A documented filing does not establish wrongdoing.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-foreground">{totalCases}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Cases Tracked</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-red-400">{byAction["moved_to_dismiss"] || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Moved to Dismiss</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{byAction["withdrew"] || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Withdrew</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-3xl font-bold text-foreground">{Object.keys(byCategory).length}</p>
              <p className="text-xs text-muted-foreground mt-1">Categories Affected</p>
            </CardContent>
          </Card>
        </div>

        {/* Case list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {cases?.map((c, i) => {
              const action = ACTION_LABELS[c.action_type] || ACTION_LABELS.dismissed;
              const cat = CATEGORY_LABELS[c.discrimination_category] || { label: c.discrimination_category, icon: Users };
              const CatIcon = cat.icon;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Left: Icon */}
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0 self-start">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>

                        {/* Center: Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{c.company_name}</h3>
                            <Badge variant="outline" className={`text-[10px] ${action.color}`}>
                              {action.label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              <CatIcon className="w-3 h-3 mr-1" />
                              {cat.label}
                            </Badge>
                          </div>

                          <p className="text-sm text-foreground/80 font-medium">{c.case_name}</p>

                          {c.summary && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{c.summary}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium">{c.discrimination_type}</span>
                            {c.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {c.state}
                              </span>
                            )}
                            {c.eeoc_drop_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Dropped {new Date(c.eeoc_drop_date).toLocaleDateString()}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {c.confidence.toUpperCase()} CONFIDENCE
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {c.source_url && (
                              <a href={c.source_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Source
                              </a>
                            )}
                            {c.court_filing_url && (
                              <a href={c.court_filing_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Scale className="w-3 h-3" /> Court Filing
                              </a>
                            )}
                            {c.eeoc_litigation_url && (
                              <a href={c.eeoc_litigation_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Gavel className="w-3 h-3" /> EEOC Record
                              </a>
                            )}
                            {c.company_id && (
                              <Link to={`/company/${c.company_id}`}
                                className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Company Profile <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Methodology card */}
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Data Sources & Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Cases are reconstructed from court motions (CourtListener/PACER), EEOC litigation records, 
              AP reporting, and watchdog trackers (Public Citizen). The EEOC does not publish a single 
              official dataset of dropped cases.
            </p>
            <p>
              Each case is verified against multiple sources and assigned a confidence level. 
              New cases are automatically discovered via court filing and news monitoring.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="https://www.eeoc.gov/litigation" target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> EEOC Litigation Database
              </a>
              <a href="https://www.courtlistener.com" target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> CourtListener / RECAP
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
