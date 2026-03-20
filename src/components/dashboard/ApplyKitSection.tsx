import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, PenTool, Lightbulb, Sparkles, Copy, Download } from "lucide-react";
import { toast } from "sonner";

const RESUME_TIPS = [
  { title: "Lead with impact, not duties", tip: "Replace 'Responsible for managing a team' with 'Led a 12-person team that reduced attrition by 34%.' Quantify outcomes." },
  { title: "Mirror their mission language", tip: "Study the company's about page and annual report. Use their exact language for values like 'equity,' 'transparency,' or 'community impact.'" },
  { title: "Show alignment, not just skills", tip: "Include a brief 'Why this company' line in your summary. WDIWF dossier data can give you the language." },
  { title: "Remove filler, add evidence", tip: "Cut phrases like 'results-oriented professional.' Instead, show results: '3x pipeline growth in Q2 2025.'" },
  { title: "Flag your values explicitly", tip: "If you led DEI initiatives, published salary bands, or built ethical frameworks — say so. These aren't soft skills, they're differentiators." },
];

const SAMPLE_COVER_LETTER = `Dear Hiring Team at Meridian Health Systems,

The gap between what companies say about their culture and what employees actually experience is one of the most consequential problems in modern work. I've spent my career closing that gap — and Meridian is one of the few organizations I've found where leadership appears to be doing the same.

Your published salary bands, your community advisory board, and your 82 integrity score aren't just talking points — they're structural commitments. That's what drew me to this role.

As a People Operations Manager, I bring 8 years of experience designing compensation frameworks that prioritize equity, building employee engagement programs with measurable outcomes, and navigating the tension between growth and values preservation.

At my previous organization, I redesigned the performance review process to center peer feedback and manager accountability — leading to a 28% improvement in employee sentiment scores within two quarters. I also led the implementation of our first pay equity audit, which we published publicly.

I'm not looking for any company. I'm looking for the right one. Meridian's track record gives me confidence that this is a place where my values and my work can align.

I'd welcome the opportunity to discuss how I can contribute to your team.

With respect,
[Your Name]`;

export function ApplyKitSection() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showLetter, setShowLetter] = useState(false);

  const handleGenerate = () => {
    if (!company || !role) {
      toast.error("Enter a company name and role title");
      return;
    }
    setShowLetter(true);
    toast.success("Cover letter generated with WDIWF intelligence");
  };

  return (
    <Tabs defaultValue="cover-letter" className="space-y-6">
      <TabsList className="bg-muted/30 border border-border/30">
        <TabsTrigger value="cover-letter" className="gap-1.5"><PenTool className="w-3.5 h-3.5" /> Cover Letter Builder</TabsTrigger>
        <TabsTrigger value="resume-tips" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Resume Tips</TabsTrigger>
      </TabsList>

      <TabsContent value="cover-letter" className="space-y-6">
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Generate a Values-Aligned Cover Letter
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Company Name</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Meridian Health Systems" className="mt-1" /></div>
            <div><Label>Job Title</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. People Operations Manager" className="mt-1" /></div>
          </div>
          <div>
            <Label>Paste Job Description (optional)</Label>
            <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job posting here for better alignment..." className="mt-1" rows={4} />
          </div>
          <Button onClick={handleGenerate} className="w-full sm:w-auto">
            <Sparkles className="w-4 h-4 mr-2" /> Generate with WDIWF Intelligence
          </Button>
        </div>

        {showLetter && (
          <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your Cover Letter</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(SAMPLE_COVER_LETTER); toast.success("Copied to clipboard"); }}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.info("Download coming soon")}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/30 p-5">
              <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed">{SAMPLE_COVER_LETTER}</pre>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">✓ Values-forward tone</Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">✓ Mirrors company language</Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">✓ Evidence-based claims</Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20">✓ No generic openers</Badge>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="resume-tips" className="space-y-4">
        <div className="text-center py-2">
          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
            <Lightbulb className="w-3 h-3 mr-1" /> WDIWF Alignment Tips
          </Badge>
        </div>
        {RESUME_TIPS.map((tip, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="text-lg font-bold text-primary/30 font-mono shrink-0 w-6 text-right">{i + 1}</span>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{tip.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{tip.tip}</p>
              </div>
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
