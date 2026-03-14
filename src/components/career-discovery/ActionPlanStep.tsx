import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Circle, BookOpen, Wrench, Users, Building2, Calendar,
  ExternalLink, MessageSquare, X, Sparkles, Loader2, Upload, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoveryLoadingState } from "./DiscoveryLoadingState";
import { useConnections, EnrichedConnection } from "@/hooks/use-connections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ActionPlanData } from "@/hooks/use-career-discovery";

interface Props {
  data: ActionPlanData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const ACTION_ICONS: Record<string, typeof Calendar> = {
  course: BookOpen,
  skill: Wrench,
  project: CheckCircle2,
  connect: Users,
  company: Building2,
};

const ACTION_LABELS: Record<string, string> = {
  course: "Course",
  skill: "Skill",
  project: "Project",
  connect: "Network",
  company: "Company",
};

const PERIOD_COLORS = [
  "text-[hsl(var(--civic-green))]",
  "text-[hsl(var(--civic-blue))]",
  "text-[hsl(var(--civic-yellow))]",
  "text-primary",
];

// Generate a search URL for different action types
function getActionLink(type: string, text: string): { url: string; label: string } | null {
  const q = encodeURIComponent(text);
  switch (type) {
    case "course":
      // Try to extract course/platform name, search on Google
      if (/coursera|udemy|linkedin learning|edx|pluralsight/i.test(text)) {
        return { url: `https://www.google.com/search?q=${q}`, label: "Find course" };
      }
      return { url: `https://www.google.com/search?q=${q}+online+course`, label: "Search courses" };
    case "skill":
      return { url: `https://www.google.com/search?q=learn+${q}+tutorial`, label: "Learn more" };
    case "company":
      // Extract company name — take first quoted or capitalized phrase
      const companyMatch = text.match(/(?:at |about |research |explore )([A-Z][a-zA-Z& ]+)/);
      if (companyMatch) {
        return { url: `/search?q=${encodeURIComponent(companyMatch[1].trim())}`, label: "View profile" };
      }
      return null;
    default:
      return null;
  }
}

// Outreach email generator panel
function IntroRequestPanel({
  connection,
  actionText,
  onClose,
}: {
  connection: EnrichedConnection;
  actionText: string;
  onClose: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const name = connection.first_name;
  const fullName = `${connection.first_name} ${connection.last_name}`;
  const company = connection.matched_company?.name || connection.company || "their company";
  const title = connection.title || "";
  const email = connection.email || null;

  const generateMessage = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("career-discovery", {
        body: {
          type: "intro_email",
          profile: {
            connectionName: fullName,
            connectionTitle: title,
            connectionCompany: company,
            actionContext: actionText,
          },
        },
      });

      if (error) throw error;
      setMessage(data?.data?.email || data?.email || fallbackMessage());
    } catch {
      setMessage(fallbackMessage());
    } finally {
      setGenerating(false);
    }
  };

  const fallbackMessage = () =>
    `Hi ${name},\n\nI hope you're doing well! I noticed you're ${title ? `working as ${title} ` : ""}at ${company}, and I'm currently exploring opportunities in this space.\n\nI'm working on: ${actionText}\n\nWould you be open to a quick chat? I'd love to hear your perspective and any advice you might have.\n\nThanks so much!`;

  // Auto-generate on mount
  useState(() => {
    generateMessage();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="absolute right-3 top-3" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            Introduction Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {connection.first_name[0]}{connection.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {title}{title && company ? " at " : ""}{company}
              </p>
            </div>
            {email && (
              <Badge variant="outline" className="text-[10px] shrink-0">{email}</Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-primary/5 rounded-lg border border-primary/10">
            <strong className="text-primary">Why this person:</strong> They're at {company}, which is relevant to your action item: "{actionText.slice(0, 80)}..."
          </div>

          {generating ? (
            <div className="flex items-center gap-2 justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating personalized message...
            </div>
          ) : (
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full h-44 rounded-xl border border-border/40 bg-muted/30 p-4 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Professional & neutral — edit as needed.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generateMessage} disabled={generating}>
                <Sparkles className="w-3 h-3 mr-1" /> Regenerate
              </Button>
              <Button size="sm" onClick={() => {
                navigator.clipboard.writeText(message);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success("Message copied!");
              }}>
                {copied ? "Copied!" : "Copy Message"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Network match finder for a specific action
function NetworkMatchCard({
  action,
  connections,
}: {
  action: { type: string; text: string };
  connections: EnrichedConnection[];
}) {
  const [showIntro, setShowIntro] = useState<EnrichedConnection | null>(null);

  // Find relevant connections based on action text keywords
  const relevant = connections.filter(c => {
    const text = action.text.toLowerCase();
    const company = (c.company || c.matched_company?.name || "").toLowerCase();
    const title = (c.title || "").toLowerCase();

    // Check if action mentions their company
    if (company && text.includes(company.split(" ")[0])) return true;

    // Check if action relates to their role area
    const roleKeywords = title.split(/[\s,/]+/).filter(w => w.length > 3);
    return roleKeywords.some(kw => text.includes(kw.toLowerCase()));
  }).slice(0, 3);

  if (relevant.length === 0) return null;

  return (
    <>
      <div className="ml-7 mt-1.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
        <p className="text-[10px] font-medium text-primary flex items-center gap-1">
          <Users className="w-3 h-3" />
          People in your network who can help
        </p>
        {relevant.map(c => (
          <div key={c.id} className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                {c.first_name[0]}{c.last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{c.first_name} {c.last_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {c.title}{c.title && (c.company || c.matched_company?.name) ? " at " : ""}
                  {c.matched_company?.name || c.company}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-6 px-2 gap-1 shrink-0"
              onClick={() => setShowIntro(c)}
            >
              <MessageSquare className="w-2.5 h-2.5" />
              Draft intro
            </Button>
          </div>
        ))}
      </div>
      {showIntro && (
        <IntroRequestPanel
          connection={showIntro}
          actionText={action.text}
          onClose={() => setShowIntro(null)}
        />
      )}
    </>
  );
}

export function ActionPlanStep({ data, loading, error, onRetry }: Props) {
  const { connections } = useConnections();
  const navigate = useNavigate();
  const hasConnections = (connections || []).length > 0;

  return (
    <DiscoveryLoadingState loading={loading} error={error} onRetry={onRetry} lines={10}>
      {data && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">
            Your personalized action plan. Click any item to take action — network items will match people in your LinkedIn connections who can help.
          </p>

          {/* Upload LinkedIn connections prompt if none exist */}
          {!hasConnections && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Upload your LinkedIn connections</p>
                  <p className="text-xs text-muted-foreground">
                    See which contacts can help with introductions and networking actions below.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => navigate("/relationship-intelligence")}>
                  <Upload className="w-3.5 h-3.5" />
                  Upload CSV
                </Button>
              </CardContent>
            </Card>
          )}

          {data.milestones.map((milestone, mi) => (
            <Card key={milestone.period}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className={cn("w-4 h-4", PERIOD_COLORS[mi] || "text-primary")} />
                  {milestone.period}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {milestone.actions.map((action, ai) => {
                  const ActionIcon = ACTION_ICONS[action.type] || CheckCircle2;
                  const link = getActionLink(action.type, action.text);
                  const isNetworkAction = action.type === "connect";
                  const isInternalLink = link?.url.startsWith("/");

                  const handleRowClick = () => {
                    if (link) {
                      if (isInternalLink) {
                        navigate(link.url);
                      } else {
                        window.open(link.url, "_blank", "noopener,noreferrer");
                      }
                    }
                  };

                  return (
                    <div key={ai}>
                      <div
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group",
                          link && "cursor-pointer"
                        )}
                        onClick={handleRowClick}
                        role={link ? "button" : undefined}
                      >
                        <div className="mt-0.5">
                          <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{action.text}</p>
                          {link && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                              {link.label} <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {isNetworkAction && !hasConnections && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate("/relationship-intelligence"); }}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                            >
                              <UserPlus className="w-2.5 h-2.5" /> Upload LinkedIn to find connections
                            </button>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                          <ActionIcon className="w-2.5 h-2.5" />
                          {ACTION_LABELS[action.type] || action.type}
                        </Badge>
                      </div>

                      {/* Show matched connections for network actions */}
                      {isNetworkAction && hasConnections && (
                        <NetworkMatchCard action={action} connections={connections || []} />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DiscoveryLoadingState>
  );
}
