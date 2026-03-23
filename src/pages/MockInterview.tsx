import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, ChevronDown, Lightbulb, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PrepQuestion {
  question: string;
  category: string;
  tip: string;
}

const PREP_QUESTIONS: PrepQuestion[] = [
  {
    question: "Tell me about a time you had to make a decision that balanced business goals with personal values.",
    category: "Behavioral",
    tip: "Lead with the tension — name the competing priorities clearly. Then walk through your reasoning. Interviewers want to see that you can hold complexity without defaulting to 'whatever the boss says.'",
  },
  {
    question: "How do you approach building consensus across teams with competing priorities?",
    category: "Leadership",
    tip: "Focus on the process, not the outcome. WDIWF-aligned candidates show they listen before persuading. Mention how you surface hidden objections — that signals emotional intelligence.",
  },
  {
    question: "Describe a project where the right thing to do conflicted with the fastest thing to do.",
    category: "Integrity",
    tip: "This is a values litmus test. Don't sanitize it. Share the real trade-off and what you chose. If you chose speed, own it — and say what you'd do differently. Honesty beats polish.",
  },
  {
    question: "What does accountability look like to you — both from leadership and from yourself?",
    category: "Culture",
    tip: "Ask yourself: does this company actually practice accountability, or just talk about it? Use your WDIWF dossier to compare their stated values to employee reviews. Your answer should signal you expect reciprocity.",
  },
  {
    question: "Ask them about the gap between their careers page and their employee reviews — they will tell you everything.",
    category: "Integrity Flip",
    tip: "This is your power move. Frame it respectfully: 'I noticed your careers page emphasizes X, but some reviews mention Y — can you help me understand that gap?' Watch how they respond. Defensiveness is a signal. Curiosity is a green flag.",
  },
];

export default function MockInterview() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleStart = () => {
    if (company.trim() && role.trim()) setStarted(true);
  };

  return (
    <>
      <Helmet><title>Mock Interview — WDIWF</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight font-display">
              Mock Interview
            </h1>
            <Badge className="bg-[hsl(var(--civic-gold))]/10 text-[hsl(var(--civic-gold))] border-[hsl(var(--civic-gold))]/20 text-xs font-mono">
              <Shield className="w-3 h-3 mr-1" /> Integrity-aware interview prep
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Practice with values-aligned questions. Get coaching tips rooted in the WDIWF framework.
          </p>
        </motion.div>

        {/* Setup card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border-border/40">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
                  <Input
                    placeholder="e.g. Patagonia"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    disabled={started}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Role Title</label>
                  <Input
                    placeholder="e.g. Senior Product Manager"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={started}
                  />
                </div>
              </div>
              {!started && (
                <Button
                  onClick={handleStart}
                  disabled={!company.trim() || !role.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4" /> Start Prep
                </Button>
              )}
              {started && (
                <p className="text-xs text-muted-foreground">
                  Prepping for <span className="font-medium text-foreground">{role}</span> at{" "}
                  <span className="font-medium text-foreground">{company}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions */}
        {started && (
          <div className="space-y-3">
            {PREP_QUESTIONS.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Collapsible open={openIdx === i} onOpenChange={open => setOpenIdx(open ? i : null)}>
                  <Card className={cn(
                    "border-border/40 transition-colors",
                    openIdx === i && "border-[hsl(var(--civic-gold))]/30"
                  )}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer select-none">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                                {q.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground/60 tabular-nums">
                                Q{i + 1}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                              {q.question}
                            </p>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200",
                            openIdx === i && "rotate-180"
                          )} />
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <div className="rounded-lg bg-[hsl(var(--civic-gold))]/5 border border-[hsl(var(--civic-gold))]/10 p-3">
                          <p className="text-xs font-medium text-[hsl(var(--civic-gold-muted))] flex items-center gap-1.5 mb-1.5">
                            <Lightbulb className="w-3 h-3" /> WDIWF Coaching Tip
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{q.tip}</p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        )}

        {/* Reset */}
        {started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStarted(false); setCompany(""); setRole(""); setOpenIdx(null); }}
            >
              Start Over
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
}
