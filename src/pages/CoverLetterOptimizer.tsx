import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Sparkles, Loader2, CheckCircle2, Heart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const MOCK_LETTER = `Dear Hiring Team,

The intersection of product strategy and environmental accountability is where I do my best work — and it's exactly what drew me to this role at Patagonia.

Over the past six years, I've led product teams through ambiguous, high-stakes launches where success wasn't just measured in revenue, but in whether the work created genuine value for the people using it. At my last company, I redesigned a core user workflow that reduced churn by 18% — but more importantly, I built a cross-functional process that gave every team member, including junior designers and customer support leads, a seat at the decision table.

That matters to me because I believe the best products come from teams that practice the same values they ship. I've read about Patagonia's employee-led activism programs and your 1% for the Planet commitment. These aren't just signals of a good employer — they're signals that the culture rewards the kind of thinking I bring: long-term, stakeholder-aware, and willing to slow down when speed would compromise integrity.

I'm drawn to this role specifically because it sits at the intersection of commerce and mission. I want to build products that help people make better choices — and I want to do it at a company that holds itself to the same standard it asks of its customers.

I'd love the chance to discuss how my experience building purpose-aligned products could contribute to Patagonia's next chapter.

With intention,
[Your Name]`;

const VALUE_HIGHLIGHTS = [
  { text: "environmental accountability", value: "Environmental Impact" },
  { text: "genuine value for the people", value: "User Advocacy" },
  { text: "a seat at the decision table", value: "Inclusive Leadership" },
  { text: "practice the same values they ship", value: "Mission Alignment" },
  { text: "willing to slow down when speed would compromise integrity", value: "Integrity over Speed" },
  { text: "holds itself to the same standard", value: "Accountability" },
];

export default function CoverLetterOptimizer() {
  usePageSEO({ title: "Cover Letter — Who Do I Work For?" });
  const [jobInput, setJobInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setLetter(MOCK_LETTER);
      setGenerating(false);
    }, 2000);
  };

  const handleCopy = () => {
    if (letter) {
      navigator.clipboard.writeText(letter);
      toast.success("Cover letter copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cover Letter — Who Do I Work For?</title>
      </Helmet>

      <div className="border-b border-border/30 bg-muted/20 px-6 py-2">
        <p className="text-xs text-muted-foreground italic text-center">
          You deserve to know exactly who you work for.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Cover Letter Optimizer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Direct, human, values-forward. Never generic.
          </p>
        </div>

        {!letter ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Job Listing</label>
                  <Input
                    placeholder="Paste job URL or enter company + role title"
                    value={jobInput}
                    onChange={(e) => setJobInput(e.target.value)}
                    className="mb-3"
                  />
                  <Textarea
                    placeholder="Or paste the full job description here..."
                    className="min-h-[120px]"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!jobInput || generating}
                  className="w-full gap-2"
                  size="lg"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "Generating..." : "Generate Cover Letter"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-5">
            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleCopy} variant="outline" className="gap-1.5">
                <Copy className="w-4 h-4" /> Copy
              </Button>
              <Button onClick={handleDownload} variant="outline" className="gap-1.5">
                <Download className="w-4 h-4" /> Download
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={() => { setLetter(null); setJobInput(""); }}>
                Start Over
              </Button>
            </div>

            {/* Letter content */}
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {letter.split("\n\n").map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed text-foreground/85 mb-4 last:mb-0">{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Values highlighted */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-primary" /> Values Reflected in This Letter
                </h3>
                <div className="space-y-2">
                  {VALUE_HIGHLIGHTS.map((v, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-civic-green shrink-0 mt-0.5" />
                      <span className="text-foreground/70">
                        <span className="text-foreground font-medium">"{v.text}"</span>
                        <span className="text-muted-foreground ml-1">→ {v.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
