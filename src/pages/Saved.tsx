import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Shield, Bookmark, Zap, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  integrityScore: number;
  alignmentPct: number;
  savedAt: string;
  skills: string[];
}

const MOCK_SAVED: SavedJob[] = [
  { id: "1", title: "Senior Product Manager", company: "Patagonia", location: "Ventura, CA", type: "Hybrid", integrityScore: 92, alignmentPct: 94, savedAt: "2 days ago", skills: ["Product Strategy", "Sustainability"] },
  { id: "2", title: "Curriculum Designer", company: "Khan Academy", location: "Remote", type: "Remote", integrityScore: 96, alignmentPct: 91, savedAt: "3 days ago", skills: ["Instructional Design", "EdTech"] },
  { id: "3", title: "ML Engineer — Responsible AI", company: "Salesforce", location: "San Francisco, CA", type: "Remote", integrityScore: 78, alignmentPct: 81, savedAt: "5 days ago", skills: ["Python", "Ethics in AI"] },
  { id: "4", title: "Program Officer — East Africa", company: "Mercy Corps", location: "Portland, OR", type: "Hybrid", integrityScore: 85, alignmentPct: 83, savedAt: "1 week ago", skills: ["Program Mgmt", "M&E"] },
];

function IntegrityBadge({ score }: { score: number }) {
  const color = score >= 85 ? "text-civic-green bg-civic-green/10 border-civic-green/20"
    : score >= 65 ? "text-civic-yellow bg-civic-yellow/10 border-civic-yellow/20"
    : "text-civic-red bg-civic-red/10 border-civic-red/20";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border", color)}>
      <Shield className="w-3 h-3" /> {score}
    </span>
  );
}

export default function Saved() {
  usePageSEO({ title: "Saved Jobs — Who Do I Work For?" });
  const [saved, setSaved] = useState(MOCK_SAVED);

  const unsave = (id: string) => {
    setSaved(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Saved Jobs — Who Do I Work For?</title></Helmet>
      <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
        <p className="text-xs text-muted-foreground italic text-center">You deserve to know exactly who you work for.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Saved Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Jobs you bookmarked for deeper review.</p>
        </div>

        {saved.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No saved roles yet. Browse the Jobs Feed to bookmark aligned roles.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="border-border/50 hover:border-border transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                            <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-semibold text-primary">{job.alignmentPct}% aligned</span>
                            <IntegrityBadge score={job.integrityScore} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.skills.map(s => (
                            <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                          ))}
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{job.type}</Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Button size="sm" className="gap-1.5 h-8 text-xs">
                            <FileText className="w-3 h-3" /> Ready to Apply?
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => unsave(job.id)} className="h-8 text-xs text-muted-foreground">
                            Remove
                          </Button>
                          <span className="text-xs text-muted-foreground/60 ml-auto">Saved {job.savedAt}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
