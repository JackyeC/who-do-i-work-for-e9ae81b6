import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { TrendingUp, Rocket, Cpu, AlertTriangle, Landmark, Eye, ShieldCheck, ArrowRight } from "lucide-react";

interface PanelCompany {
  id: string;
  name: string;
  slug: string;
  civic_footprint_score: number;
  career_intelligence_score: number | null;
  lobbying_spend: number | null;
  government_contracts: number | null;
  is_startup: boolean | null;
  category_tags: string[] | null;
  industry: string;
}

interface PanelConfig {
  title: string;
  icon: React.ElementType;
  queryKey: string;
  queryFn: () => Promise<PanelCompany[]>;
  metric: (c: PanelCompany) => string;
  metricLabel: string;
}

const fetchPanel = async (
  filter: Record<string, any>,
  orderBy: string,
  ascending: boolean = false,
  limit: number = 10,
  containsTag?: string
) => {
  let query = supabase
    .from("companies")
    .select("id, name, slug, civic_footprint_score, career_intelligence_score, lobbying_spend, government_contracts, is_startup, category_tags, industry")
    .eq("record_status", "published")
    .limit(limit);

  if (containsTag) {
    query = query.contains("category_tags", [containsTag]);
  }

  Object.entries(filter).forEach(([k, v]) => {
    query = query.eq(k, v);
  });

  query = query.order(orderBy, { ascending });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PanelCompany[];
};

const fmt = (n: number | null) => {
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const PANELS: PanelConfig[] = [
  {
    title: "Trending Companies",
    icon: TrendingUp,
    queryKey: "panel-trending",
    queryFn: () => fetchPanel({}, "civic_footprint_score", false, 10),
    metric: (c) => `${c.civic_footprint_score}/10`,
    metricLabel: "CFS",
  },
  {
    title: "Fastest Growing Startups",
    icon: Rocket,
    queryKey: "panel-startups",
    queryFn: () => fetchPanel({ is_startup: true }, "civic_footprint_score", false, 10),
    metric: (c) => c.industry,
    metricLabel: "Industry",
  },
  {
    title: "HR Tech Index",
    icon: Cpu,
    queryKey: "panel-hrtech",
    queryFn: () => fetchPanel({}, "civic_footprint_score", false, 10, "HR Tech"),
    metric: (c) => `${c.career_intelligence_score ?? "—"}/10`,
    metricLabel: "CIS",
  },
  {
    title: "Layoff Watch",
    icon: AlertTriangle,
    queryKey: "panel-layoff",
    queryFn: () => fetchPanel({}, "civic_footprint_score", true, 10),
    metric: (c) => `${c.civic_footprint_score}/10`,
    metricLabel: "Risk",
  },
  {
    title: "High Lobbying Influence",
    icon: Landmark,
    queryKey: "panel-lobbying",
    queryFn: () => fetchPanel({}, "lobbying_spend", false, 10),
    metric: (c) => fmt(c.lobbying_spend),
    metricLabel: "Lobbying",
  },
  {
    title: "Most Transparent Employers",
    icon: Eye,
    queryKey: "panel-transparent",
    queryFn: () => fetchPanel({}, "career_intelligence_score", false, 10),
    metric: (c) => `${c.career_intelligence_score ?? "—"}/10`,
    metricLabel: "CIS",
  },
  {
    title: "Government Contractors",
    icon: ShieldCheck,
    queryKey: "panel-govcon",
    queryFn: () => fetchPanel({}, "government_contracts", false, 10, "Government Contractors"),
    metric: (c) => fmt(c.government_contracts),
    metricLabel: "Contracts",
  },
];

function IntelligencePanel({ panel }: { panel: PanelConfig }) {
  const { data: companies, isLoading } = useQuery({
    queryKey: [panel.queryKey],
    queryFn: panel.queryFn,
    staleTime: 5 * 60 * 1000,
  });

  const Icon = panel.icon;

  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-xs tracking-[0.15em] uppercase text-foreground font-semibold">
          {panel.title}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-2.5 flex justify-between">
              <div className="h-3.5 w-24 bg-muted/50 animate-pulse rounded" />
              <div className="h-3.5 w-12 bg-muted/50 animate-pulse rounded" />
            </div>
          ))
        ) : companies?.length ? (
          companies.map((c, i) => (
            <Link
              key={c.id}
              to={`/company/${c.slug}`}
              className="px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs text-muted-foreground/50 w-4 text-right tabular-nums">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {c.name}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                {panel.metric(c)}
              </span>
            </Link>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <span className="font-mono text-xs text-muted-foreground">Intelligence Gathering in Progress...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function IntelligenceDashboard() {
  return (
    <section className="px-6 lg:px-16 py-20 lg:py-28">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-2 flex items-center gap-2">
              <span className="w-8 h-px bg-primary inline-block" />
              Live Intelligence
            </div>
            <h2 className="text-2xl lg:text-3xl text-foreground">
              Market Intelligence Dashboard
            </h2>
          </div>
          <Link
            to="/browse"
            className="font-mono text-sm tracking-wider uppercase text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            Browse all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Top row: 4 panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-px">
          {PANELS.slice(0, 4).map((p) => (
            <IntelligencePanel key={p.queryKey} panel={p} />
          ))}
        </div>

        {/* Bottom row: 3 panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {PANELS.slice(4).map((p) => (
            <IntelligencePanel key={p.queryKey} panel={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
