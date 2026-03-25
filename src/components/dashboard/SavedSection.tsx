import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, MapPin, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SavedJob {
  id: string;
  company: string;
  logo: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  integrityScore: number;
  integrityLevel: "LOW" | "MODERATE" | "HIGH";
  alignmentPct: number;
  skills: string[];
}

const INITIAL_SAVED: SavedJob[] = [
  { id: "1", company: "Meridian Health Systems", logo: "MH", title: "People Operations Manager", location: "Austin, TX", type: "Hybrid", salary: "$95K–$120K", integrityScore: 82, integrityLevel: "LOW", alignmentPct: 91, skills: ["HR Strategy", "DEI Programs"] },
  { id: "2", company: "Lighthouse Education Partners", logo: "LE", title: "Curriculum Design Lead", location: "Denver, CO", type: "Hybrid", salary: "$85K–$105K", integrityScore: 88, integrityLevel: "LOW", alignmentPct: 93, skills: ["Instructional Design", "Equity Frameworks"] },
  { id: "3", company: "Evergreen Community Health", logo: "EC", title: "Community Health Director", location: "Portland, OR", type: "Onsite", salary: "$105K–$135K", integrityScore: 91, integrityLevel: "LOW", alignmentPct: 96, skills: ["Public Health", "Community Engagement"] },
];

function getScoreColor(level: string) {
  switch (level) {
    case "LOW": return "bg-civic-green/10 text-civic-green border-civic-green/20";
    case "MODERATE": return "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/20";
    default: return "bg-civic-red/10 text-civic-red border-civic-red/20";
  }
}

function getAlignmentColor(pct: number) {
  if (pct >= 80) return "text-civic-green";
  if (pct >= 60) return "text-civic-yellow";
  return "text-civic-red";
}

export function SavedSection() {
  const [saved, setSaved] = useState<SavedJob[]>(INITIAL_SAVED);

  const remove = (id: string) => {
    setSaved((prev) => prev.filter((j) => j.id !== id));
    toast.success("Removed from saved");
  };

  if (saved.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/30 p-16 text-center">
        <Bookmark className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">No saved jobs yet. Browse the feed and save roles that interest you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{saved.length} saved roles</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((job) => (
          <div key={job.id} className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{job.logo}</div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{job.title}</h4>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(job.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{job.location} · {job.type} · {job.salary}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("text-xs font-mono", getScoreColor(job.integrityLevel))}>
                {job.integrityScore} Integrity
              </Badge>
              <span className={cn("text-sm font-bold font-mono", getAlignmentColor(job.alignmentPct))}>
                {job.alignmentPct}% <span className="text-xs font-normal">aligned</span>
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {job.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs bg-muted/50 font-normal">{s}</Badge>)}
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast.info("Dossier generation coming soon")}>
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Ready to Apply?
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
