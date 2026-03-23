import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Mic, ChevronDown, Shield, Lightbulb, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewQ {
  question: string;
  category: string;
  coachingTip: string;
}

const SAMPLE_QUESTIONS: InterviewQ[] = [
  {
    question: "Tell me about a time you identified a systemic problem and built a solution for it.",
    category: "Behavioral",
    coachingTip: "Use the STAR format. Focus on what you noticed that others missed, and how your values drove you to act. Specificity wins — name the problem, the stakeholders, and the measurable outcome.",
  },
  {
    question: "How do you handle situations where company policy conflicts with what you believe is right?",
    category: "Culture Fit",
    coachingTip: "This is a values test. Don't dodge it. Share a real example where you navigated tension between policy and principle. Show that you can advocate without being adversarial.",
  },
  {
    question: "Ask them about the gap between their careers page and their employee reviews — they'll tell you everything.",
    category: "Integrity Check",
    coachingTip: "This is your WDIWF power move. Frame it respectfully: 'I noticed some themes in employee feedback that differ from the careers page. Can you help me understand the context?' Watch their reaction closely.",
  },
  {
    question: "Describe a project where you had to influence without authority.",
    category: "Behavioral",
    coachingTip: "Highlight your communication strategy, not just the outcome. How did you build trust? How did you handle resistance? This reveals your leadership philosophy.",
  },
  {
    question: "What does 'transparency' mean to you in the workplace?",
    category: "Culture Fit",
    coachingTip: "Be specific. Don't just say 'open communication.' Give an example: 'At my last company, I pushed to publish our salary bands internally. Here's what happened.'",
  },
];

export function MockInterviewSection() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 justify-center">
        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
          <Shield className="w-3 h-3 mr-1" /> Integrity-aware interview prep
        </Badge>
      </div>

      {!started ? (
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-4 max-w-lg mx-auto">
          <div className="text-center space-y-2">
            <Mic className="w-8 h-8 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Mock Interview Prep</h3>
            <p className="text-sm text-muted-foreground">Get role-specific questions with WDIWF coaching tips based on company integrity signals.</p>
          </div>
          <div className="space-y-3">
            <div><Label>Company Name</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Meridian Health Systems" className="mt-1" /></div>
            <div><Label>Role Title</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. People Operations Manager" className="mt-1" /></div>
          </div>
          <Button onClick={() => setStarted(true)} className="w-full"><Mic className="w-4 h-4 mr-2" /> Start Prep</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Interview Prep: <span className="text-primary">{role || "Role"}</span> at <span className="text-primary">{company || "Company"}</span>
            </h3>
            <p className="text-xs text-muted-foreground">5 questions tailored to this role and company profile</p>
          </div>

          {SAMPLE_QUESTIONS.map((q, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="text-lg font-bold text-primary/30 font-mono shrink-0 w-6 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{q.question}</p>
                  </div>
                </div>
              </div>

              <Collapsible open={openItems.has(i)} onOpenChange={() => toggleItem(i)}>
                <CollapsibleTrigger className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border/20 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Lightbulb className="w-3 h-3" />
                  WDIWF coaching tip
                  <ChevronDown className={cn("w-3 h-3 transition-transform", openItems.has(i) && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-5 pb-4">
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 mt-1">
                    <p className="text-sm text-foreground/80 leading-relaxed">{q.coachingTip}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}

          <div className="rounded-xl border border-border/40 bg-card p-5">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" /> Questions to Flip Back on Them
            </h4>
            <ul className="space-y-2">
              {[
                "What does leadership accountability look like here when things go wrong?",
                "How do you measure whether your stated values are reflected in employee experience?",
                "Can you walk me through a recent decision where the company chose long-term integrity over short-term gain?",
              ].map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span> {q}
                </li>
              ))}
            </ul>
          </div>

          <Button variant="outline" onClick={() => setStarted(false)} className="w-full">Start Over</Button>
        </div>
      )}
    </div>
  );
}
