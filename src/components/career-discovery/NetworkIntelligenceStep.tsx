import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, ArrowRight, Star, Upload, UserCheck, Compass,
  Loader2, MessageSquare, X, Sparkles, ExternalLink, Linkedin,
} from "lucide-react";
import { useConnections, EnrichedConnection } from "@/hooks/use-connections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// AI-generated LinkedIn connection note panel
function ConnectionNotePanel({
  connection,
  onClose,
}: {
  connection: EnrichedConnection;
  onClose: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const name = `${connection.first_name} ${connection.last_name}`;
  const company = connection.matched_company?.name || connection.company || "";
  const title = connection.title || "";
  const profileUrl = connection.email
    ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`
    : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`;

  const generateNote = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("career-discovery", {
        body: {
          type: "intro_email",
          profile: {
            connectionName: name,
            connectionTitle: title,
            connectionCompany: company,
            actionContext: `I'd like to connect on LinkedIn to learn more about ${company ? `working at ${company}` : "opportunities in their field"}`,
          },
        },
      });
      if (error) throw error;
      // Trim to LinkedIn note length (~300 chars)
      const fullEmail = data?.data?.email || data?.email || fallback();
      // Extract just the core message, skip greeting/closing for a LinkedIn note
      const trimmed = fullEmail
        .replace(/^(Hi|Hey|Hello|Dear)\s+\w+[,!]?\n*/i, "")
        .replace(/\n*(Thanks|Best|Cheers|Regards|Sincerely)[^\n]*/gi, "")
        .replace(/\n*(Thanks so much|Thank you)[!.]*/gi, "")
        .trim()
        .slice(0, 280);
      setNote(trimmed);
    } catch {
      setNote(fallback());
    } finally {
      setGenerating(false);
    }
  };

  const fallback = () =>
    `I came across your profile and was impressed by your work${title ? ` as ${title}` : ""}${company ? ` at ${company}` : ""}. I'm exploring career opportunities in this space and would love to connect and learn from your experience.`;

  // Auto-generate on mount
  useState(() => { generateNote(); });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="absolute right-3 top-3" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <h3 className="font-semibold text-foreground">LinkedIn Connection Note</h3>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
            <div className="w-9 h-9 rounded-full bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2] font-bold text-sm shrink-0">
              {connection.first_name[0]}{connection.last_name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {title}{title && company ? " at " : ""}{company}
              </p>
            </div>
          </div>

          {generating ? (
            <div className="flex items-center gap-2 justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Writing personalized note...
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Connection note (max 300 chars):</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 300))}
                  maxLength={300}
                  className="w-full h-28 rounded-xl border border-border/40 bg-muted/30 p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#0A66C2]/30"
                />
                <p className="text-[10px] text-muted-foreground text-right">{note.length}/300</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={generateNote} disabled={generating} className="gap-1">
                  <Sparkles className="w-3 h-3" /> Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(note);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Note copied!");
                }}>
                  {copied ? "Copied!" : "Copy Note"}
                </Button>
                <a
                  href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                >
                  <Button size="sm" className="gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white">
                    <Linkedin className="w-3.5 h-3.5" />
                    Open LinkedIn
                  </Button>
                </a>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// Categorize connections
function categorizeConnection(c: EnrichedConnection): "at_target" | "transition" | "mentor" {
  const title = (c.title || "").toLowerCase();
  if (/director|vp|chief|head|president|founder|ceo|cfo|cto/i.test(title)) return "mentor";
  if (c.matched_company) return "at_target";
  return "transition";
}

const TYPE_CONFIG = {
  at_target: { label: "At Tracked Company", icon: Building2, color: "text-[hsl(var(--civic-blue))]", bg: "bg-[hsl(var(--civic-blue))]/10" },
  transition: { label: "In Your Field", icon: ArrowRight, color: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]/10" },
  mentor: { label: "Potential Mentor", icon: Star, color: "text-[hsl(var(--civic-gold))]", bg: "bg-[hsl(var(--civic-gold))]/10" },
};

export function NetworkIntelligenceStep() {
  const navigate = useNavigate();
  const { connections, isLoading } = useConnections();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNote, setShowNote] = useState<EnrichedConnection | null>(null);

  const hasConnections = (connections || []).length > 0;

  // Categorize and filter
  const categorized = (connections || []).map(c => {
    const cat = categorizeConnection(c);
    return { connection: c, category: cat };
  });
  const filtered = activeFilter
    ? categorized.filter(c => c.category === activeFilter)
    : categorized;

  const counts = {
    at_target: categorized.filter(c => c.category === "at_target").length,
    transition: categorized.filter(c => c.category === "transition").length,
    mentor: categorized.filter(c => c.category === "mentor").length,
  };

  return (
    <div className="space-y-6">
      {/* Upload CTA */}
      <Card className="border-dashed border-primary/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {hasConnections ? "Your LinkedIn Connections" : "Upload Your LinkedIn Connections"}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasConnections
                ? `${connections!.length} connections imported — see who can help you along each career path.`
                : "Import your network to see who can help you along each career path."}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/relationship-intelligence")}>
            <Upload className="w-3.5 h-3.5" />
            {hasConnections ? "Manage" : "Upload CSV"}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {hasConnections && (
        <>
          {/* Header */}
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Path Guides</h3>
            <Badge variant="secondary" className="text-[10px]">{categorized.length} connections</Badge>
          </div>

          {/* Filter badges */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const count = counts[key as keyof typeof counts];
              const isActive = activeFilter === key;
              return (
                <Badge
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  className="gap-1.5 text-xs cursor-pointer hover:bg-muted"
                  onClick={() => setActiveFilter(isActive ? null : key)}
                >
                  <Icon className={`w-3 h-3 ${isActive ? "" : config.color}`} />
                  {config.label} ({count})
                </Badge>
              );
            })}
          </div>

          {/* Connections list */}
          <div className="space-y-3">
            {filtered.slice(0, 20).map(({ connection: conn, category }) => {
              const config = TYPE_CONFIG[category];
              const Icon = config.icon;
              const enriched = conn as EnrichedConnection;
              const company = enriched.matched_company?.name || conn.company || "";
              return (
                <Card key={conn.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                        <UserCheck className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            {conn.first_name} {conn.last_name}
                          </p>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${config.color}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {conn.title}{conn.title && company ? " at " : ""}{company}
                        </p>
                        {enriched.matched_company && (
                          <button
                            onClick={() => navigate(`/dossier/${enriched.matched_company!.slug}`)}
                            className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            View company dossier <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 shrink-0 gap-1.5 border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/5"
                        onClick={() => setShowNote(conn)}
                      >
                        <Linkedin className="w-3 h-3" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length > 20 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                Showing 20 of {filtered.length} connections.{" "}
                <button onClick={() => navigate("/relationship-intelligence")} className="text-primary hover:underline">
                  View all →
                </button>
              </p>
            )}
          </div>
        </>
      )}

      {!isLoading && !hasConnections && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground">No connections yet</p>
          <p className="text-xs mt-1">Upload your LinkedIn CSV to unlock network intelligence.</p>
        </div>
      )}

      {showNote && (
        <ConnectionNotePanel connection={showNote} onClose={() => setShowNote(null)} />
      )}
    </div>
  );
}
