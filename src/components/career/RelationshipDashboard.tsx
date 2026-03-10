import { useState, useMemo } from "react";
import { useConnections, EnrichedConnection } from "@/hooks/use-connections";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import { usePremium } from "@/hooks/use-premium";
import { ConnectionUploader } from "./ConnectionUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield, AlertTriangle, TrendingUp, Users, Network, Lock,
  Building2, ExternalLink, MessageSquare, X, UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// --- Outreach dialog ---
function OutreachPanel({
  connection,
  onClose,
}: {
  connection: EnrichedConnection;
  onClose: () => void;
}) {
  const name = connection.first_name;
  const company = connection.matched_company?.name || connection.company || "your company";
  const message = `Hi ${name},\n\nI noticed you're at ${company}. I'm exploring roles in this space and would love to hear how things are going there.\n\nWould you be open to a quick chat?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg relative">
        <Button size="icon" variant="ghost" className="absolute right-3 top-3" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            Suggested Outreach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">
            {connection.first_name} {connection.last_name} · {connection.title} at {company}
          </p>
          <textarea
            readOnly
            value={message}
            className="w-full h-40 rounded-xl border border-border/40 bg-muted/30 p-4 text-sm text-foreground resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-[10px] text-muted-foreground">Professional & neutral — no assumptions.</p>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(message);
              }}
            >
              Copy Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Connection card ---
function ConnectionCard({
  connection,
  onOutreach,
  onTrack,
  isTracked,
  showTrack,
}: {
  connection: EnrichedConnection;
  onOutreach: () => void;
  onTrack?: () => void;
  isTracked: boolean;
  showTrack: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-border/30 bg-card/60 p-4 flex items-start gap-3 group hover:border-primary/20 transition-colors">
      <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center text-xs font-bold text-primary shrink-0">
        {connection.first_name[0]}
        {connection.last_name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {connection.first_name} {connection.last_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{connection.title}</p>
        {connection.matched_company && (
          <button
            onClick={() => navigate(`/dossier/${connection.matched_company!.slug}`)}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
          >
            {connection.matched_company.name}
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
        {connection.match_confidence != null && (
          <Badge variant="secondary" className="text-[10px] mt-1">
            {Math.round(connection.match_confidence * 100)}% match
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onOutreach} title="Draft outreach">
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
        {showTrack && !isTracked && onTrack && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onTrack} title="Track company">
            <UserPlus className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Column wrapper ---
function Column({
  title,
  icon: Icon,
  children,
  count,
  blurred,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
  blurred?: boolean;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      </div>
      <div className={cn("space-y-3 relative", blurred && "select-none")}>
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
            <Lock className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Upgrade to unlock full relationship intelligence.</p>
            <Button size="sm" variant="outline" className="mt-3" asChild>
              <a href="/pricing">View Plans</a>
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// --- Relationship map viz ---
function RelationshipMapViz({
  connections,
}: {
  connections: EnrichedConnection[];
}) {
  const matchedCompanies = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    connections.forEach((c) => {
      if (c.matched_company) {
        const existing = map.get(c.matched_company.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(c.matched_company.id, { name: c.matched_company.name, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [connections]);

  if (matchedCompanies.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Network className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Relationship Map</h3>
      </div>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 600 320" className="w-full max-w-xl">
          {/* Center node = You */}
          <circle cx="300" cy="160" r="28" className="fill-primary/20 stroke-primary" strokeWidth="2" />
          <text x="300" y="164" textAnchor="middle" className="fill-foreground text-[11px] font-semibold">You</text>

          {matchedCompanies.map((company, i) => {
            const angle = (i / matchedCompanies.length) * Math.PI * 2 - Math.PI / 2;
            const rx = 200;
            const ry = 120;
            const cx = 300 + rx * Math.cos(angle);
            const cy = 160 + ry * Math.sin(angle);
            const nodeR = Math.min(8 + company.count * 3, 24);
            return (
              <g key={company.name}>
                <line x1="300" y1="160" x2={cx} y2={cy} className="stroke-border" strokeWidth="1" strokeDasharray="4 2" />
                <circle cx={cx} cy={cy} r={nodeR} className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" />
                <text x={cx} y={cy + nodeR + 12} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                  {company.name.length > 14 ? company.name.slice(0, 14) + "…" : company.name}
                </text>
                <text x={cx} y={cy + 4} textAnchor="middle" className="fill-foreground text-[9px] font-medium">
                  {company.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// --- Main dashboard ---
export function RelationshipDashboard() {
  const { enrichedConnections, connectionCount, isLoading } = useConnections();
  const { trackedCompanies, trackCompany, isCompanyTracked } = useTrackedCompanies();
  const { isPremium } = usePremium();
  const [outreachTarget, setOutreachTarget] = useState<EnrichedConnection | null>(null);

  const trackedCompanyIds = new Set(trackedCompanies.map((tc) => tc.company_id));

  // Inside Intel: connections at tracked companies
  const insideIntel = useMemo(
    () => enrichedConnections.filter((c) => c.matched_company && trackedCompanyIds.has(c.matched_company.id)),
    [enrichedConnections, trackedCompanyIds]
  );

  // Network Signals: matched companies with negative signals (placeholder heuristic: score < 40)
  const networkSignals = useMemo(
    () =>
      enrichedConnections.filter(
        (c) => c.matched_company && !trackedCompanyIds.has(c.matched_company.id) && c.matched_company.civic_footprint_score < 40
      ),
    [enrichedConnections, trackedCompanyIds]
  );

  // Opportunity Feed: matched companies with positive signals (score >= 60)
  const opportunityFeed = useMemo(
    () =>
      enrichedConnections.filter(
        (c) => c.matched_company && !trackedCompanyIds.has(c.matched_company.id) && c.matched_company.civic_footprint_score >= 60
      ),
    [enrichedConnections, trackedCompanyIds]
  );

  // Show uploader if no connections
  if (!isLoading && connectionCount === 0) {
    return <ConnectionUploader />;
  }

  // Free users see limited inside intel, blurred other columns
  const freeInsideLimit = 5;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Connections", value: connectionCount, icon: Users },
          { label: "Matched Companies", value: new Set(enrichedConnections.filter((c) => c.matched_company).map((c) => c.matched_company!.id)).size, icon: Building2 },
          { label: "Inside Intel", value: insideIntel.length, icon: Shield },
          { label: "Opportunity Signals", value: opportunityFeed.length, icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relationship map */}
      <RelationshipMapViz connections={enrichedConnections} />

      {/* 3-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Column title="Inside Intel" icon={Shield} count={insideIntel.length}>
          {(isPremium ? insideIntel : insideIntel.slice(0, freeInsideLimit)).map((c) => (
            <ConnectionCard
              key={c.id}
              connection={c}
              onOutreach={() => setOutreachTarget(c)}
              isTracked={true}
              showTrack={false}
            />
          ))}
          {!isPremium && insideIntel.length > freeInsideLimit && (
            <p className="text-xs text-muted-foreground text-center py-2">
              +{insideIntel.length - freeInsideLimit} more — upgrade to see all
            </p>
          )}
          {insideIntel.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No connections at your tracked companies yet.
            </p>
          )}
        </Column>

        <Column title="Network Signals" icon={AlertTriangle} count={networkSignals.length} blurred={!isPremium}>
          {networkSignals.slice(0, 10).map((c) => (
            <ConnectionCard
              key={c.id}
              connection={c}
              onOutreach={() => setOutreachTarget(c)}
              onTrack={() => trackCompany.mutate(c.matched_company!.id)}
              isTracked={false}
              showTrack={true}
            />
          ))}
          {networkSignals.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No risk signals detected.</p>
          )}
        </Column>

        <Column title="Opportunity Feed" icon={TrendingUp} count={opportunityFeed.length} blurred={!isPremium}>
          {opportunityFeed.slice(0, 10).map((c) => (
            <ConnectionCard
              key={c.id}
              connection={c}
              onOutreach={() => setOutreachTarget(c)}
              onTrack={() => trackCompany.mutate(c.matched_company!.id)}
              isTracked={false}
              showTrack={true}
            />
          ))}
          {opportunityFeed.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No opportunity signals detected.</p>
          )}
        </Column>
      </div>

      {/* Upload more */}
      <ConnectionUploader />

      {/* Outreach panel */}
      {outreachTarget && (
        <OutreachPanel connection={outreachTarget} onClose={() => setOutreachTarget(null)} />
      )}
    </div>
  );
}
