import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Lightbulb, Loader2, CheckCircle2, Sparkles, Target, Shield, Eye, Heart, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const RESUME_TIPS = [
  {
    icon: Target,
    title: "Lead with alignment, not just achievements",
    body: "Open each role's bullet points with how your work connected to the company's stated mission — then quantify the result. Recruiters at mission-driven orgs look for values signal before metrics.",
  },
  {
    icon: Shield,
    title: "Name the integrity signals you care about",
    body: "Add a 'Values' or 'What Matters' section near the top. List 3–4 concrete principles (e.g., 'pay transparency', 'climate accountability'). This filters you toward companies that match — and away from ones that don't.",
  },
  {
    icon: Eye,
    title: "Show evidence of due diligence",
    body: "In your cover letter or summary, reference something specific about the company's public record — a lobbying position, a governance choice, an ESG commitment. It signals you've done the work most candidates skip.",
  },
  {
    icon: Heart,
    title: "Quantify culture, not just output",
    body: "Instead of 'led a team of 8,' try 'built a cross-functional team of 8 with 95% retention over 2 years.' Retention, mentorship ratios, and internal mobility stats are integrity metrics in disguise.",
  },
  {
    icon: Zap,
    title: "Tailor your 'Why This Company' to their reality",
    body: "Use WDIWF dossier data to reference specific signals — not the careers page tagline. 'I noticed your board added an independent ethics chair in 2024' beats 'I love your culture of innovation.'",
  },
];

function CoverLetterBuilder() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (!company.trim() || !role.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setOutput(
`Dear Hiring Team at ${company.trim()},

I'm writing to express my interest in the ${role.trim()} position. After reviewing ${company.trim()}'s public integrity record through WDIWF — including governance transparency, workforce signals, and stated commitments — I'm confident this is a company where my values and skills align.

${jobDesc.trim() ? `The role description emphasizes ${jobDesc.trim().split(" ").slice(0, 8).join(" ")}… — areas where I've built meaningful experience. ` : ""}My career has consistently centered on accountability, evidence-based decision-making, and building systems that serve people, not just metrics.

What stands out about ${company.trim()} is the gap between what most employers say and what your record actually shows. That alignment is rare, and it's why I'm applying with conviction rather than volume.

I'd welcome the chance to discuss how my background in [your expertise] can support ${company.trim()}'s mission and next chapter.

With integrity,
[Your Name]`
      );
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Company</label>
          <Input placeholder="e.g. Patagonia" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
          <Input placeholder="e.g. Senior Product Manager" value={role} onChange={e => setRole(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Job Description <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea
          placeholder="Paste the job description to personalize the letter further…"
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
          rows={4}
        />
      </div>
      <Button onClick={generate} disabled={loading || !company.trim() || !role.trim()} className="gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? "Generating…" : "Generate Cover Letter"}
      </Button>

      {output && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Cover Letter</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">{output}</pre>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function ApplyKit() {
  usePageSEO({
    title: "Apply Kit — WDIWF",
    description: "Cover letter builder and alignment-focused resume tips for values-driven job seekers.",
    path: "/apply-kit",
  });

  return (
    <>
      <Helmet><title>Apply Kit — WDIWF</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Apply Kit</h1>
          <p className="text-sm text-muted-foreground mb-8">Tools to help you apply with intelligence and integrity.</p>
        </motion.div>

        <Tabs defaultValue="cover-letter">
          <TabsList className="mb-6">
            <TabsTrigger value="cover-letter" className="gap-1.5">
              <FileText className="w-4 h-4" /> Cover Letter Builder
            </TabsTrigger>
            <TabsTrigger value="resume-tips" className="gap-1.5">
              <Lightbulb className="w-4 h-4" /> Resume Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cover-letter">
            <CoverLetterBuilder />
          </TabsContent>

          <TabsContent value="resume-tips">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {RESUME_TIPS.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  <Card className="border-border/40">
                    <CardContent className="p-5 flex gap-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                        <tip.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">{tip.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
