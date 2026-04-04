import { useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, FileText, Briefcase, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NDModeToggle } from "@/components/nd/NDModeToggle";
import { StepProgressRail } from "@/components/nd/StepProgressRail";
import { QuickReadCard, type QuickReadRating } from "@/components/nd/QuickReadCard";
import { EvidenceCard } from "@/components/nd/EvidenceCard";
import { FeelLikeWorkCard } from "@/components/nd/FeelLikeWorkCard";
import { QuestionScriptCard } from "@/components/nd/QuestionScriptCard";
import { ApplicationActionCard } from "@/components/nd/ApplicationActionCard";
import { SummaryModeSwitch, type NDViewMode } from "@/components/nd/SummaryModeSwitch";
import { CompanyLogo } from "@/components/CompanyLogo";

const STEPS = ["Quick Read", "Evidence", "What It Feels Like", "Questions", "Use In My Application"];

interface NDDossierViewProps {
  company: any;
  companyId: string;
  executives?: any[];
  eeocCases?: any[];
  issueSignals?: any[];
  contracts?: any[];
}

/* ---- Derivation helpers ---- */

function deriveClarity(company: any, issueSignals: any[]): { rating: QuickReadRating; explanation: string } {
  const score = company.employer_clarity_score ?? 0;
  if (score >= 65) return { rating: "Low", explanation: "This company shows above-average transparency in how roles and expectations are documented." };
  if (score >= 35) return { rating: "Medium", explanation: "Some expectations appear clear, but parts of the role may depend on unwritten rules." };
  return { rating: "High", explanation: "Limited public documentation of role expectations. You may need to ask detailed questions before applying." };
}

function deriveWorkPace(company: any): { rating: QuickReadRating; explanation: string } {
  const desc = (company.description || "").toLowerCase();
  const fast = /fast.paced|agile|dynamic|rapid|hustle|startup/i.test(desc);
  const isStartup = company.is_startup;
  if (fast || isStartup) return { rating: "High", explanation: "This company may expect frequent context switching and fast response time." };
  const empCount = parseInt(company.employee_count || "0");
  if (empCount > 10000) return { rating: "Medium", explanation: "Larger organizations often have more process, but pace can vary by team." };
  return { rating: "Low", explanation: "No strong signals of a high-pressure work environment in the available data." };
}

function deriveSensoryLoad(company: any): { rating: QuickReadRating; explanation: string } {
  const desc = (company.description || "").toLowerCase();
  const social = /team.player|collaborative|open.office|cross.functional|interpersonal/i.test(desc);
  if (social) return { rating: "High", explanation: "Job language suggests heavy collaboration and social interaction requirements." };
  return { rating: "Medium", explanation: "Social demand level is unclear from public data. Ask about meeting load and open-office layout." };
}

function deriveFlexibility(company: any): { rating: QuickReadRating; explanation: string } {
  const desc = (company.description || "").toLowerCase();
  const remote = /remote|hybrid|flexible|work.from.home|distributed/i.test(desc);
  if (remote) return { rating: "Low", explanation: "There are signs of flexibility in work arrangement. Confirm specifics in your interview." };
  return { rating: "Medium", explanation: "No clear remote or flexibility signals. Worth asking about schedule expectations directly." };
}

function deriveDisclosureSafety(company: any, eeocCases: any[]): { rating: QuickReadRating; explanation: string } {
  const hasEeoc = (eeocCases?.length || 0) > 0;
  const civic = company.civic_footprint_score ?? 0;
  if (hasEeoc) return { rating: "High", explanation: "EEOC filings on record may indicate past issues with workplace inclusion. Approach disclosure carefully." };
  if (civic >= 60) return { rating: "Low", explanation: "Above-average civic footprint score. This may indicate a more inclusive environment, but verify directly." };
  return { rating: "Medium", explanation: "Not enough public data to assess disclosure safety. Ask about accommodations process before sharing." };
}

function buildEvidence(company: any, executives: any[], eeocCases: any[], issueSignals: any[], contracts: any[]) {
  const cards: { title: string; summary: string; sourceType: string; ndMeaning: string }[] = [];

  const pac = company.total_pac_spending ?? 0;
  const lobby = company.lobbying_spend ?? 0;
  if (pac > 0 || lobby > 0) {
    cards.push({
      title: `$${(pac + lobby).toLocaleString()} in political spending`,
      summary: `This company has $${pac.toLocaleString()} in PAC spending and $${lobby.toLocaleString()} in lobbying expenditures on public record.`,
      sourceType: "FEC / Senate LDA",
      ndMeaning: "Political spending can shape policies on labor, benefits, and workplace protections. This does not mean the company is bad, but it is worth understanding where the money goes."
    });
  }

  if ((eeocCases?.length || 0) > 0) {
    cards.push({
      title: `${eeocCases.length} EEOC filing(s) on record`,
      summary: `Equal employment opportunity cases have been filed against this company. These may involve discrimination, harassment, or retaliation claims.`,
      sourceType: "EEOC",
      ndMeaning: "EEOC filings can signal how the company handles complaints and whether employees feel safe raising concerns. This matters if you need to request accommodations."
    });
  }

  const desc = (company.description || "").toLowerCase();
  if (/fast.paced|dynamic|agile|hustle/i.test(desc)) {
    cards.push({
      title: "Uses 'fast-paced' or 'dynamic' language",
      summary: "The company describes its culture using words that often mean rapid changes, shifting priorities, or high-energy environments.",
      sourceType: "Public language",
      ndMeaning: "Fast-paced environments can mean frequent interruptions, unclear priorities, and less time to process information. If you need predictability, ask how priorities are communicated."
    });
  }

  if (/team.player|collaborative|cross.functional/i.test(desc)) {
    cards.push({
      title: "Heavy emphasis on 'team player' culture",
      summary: "The company's language focuses on collaboration and interpersonal skills as core requirements.",
      sourceType: "Public language",
      ndMeaning: "Strong 'team player' language may mean success depends on social responsiveness and visibility. If you work better independently, ask how individual contributions are recognized."
    });
  }

  if ((executives || []).filter(e => e.departed_at).length > 2) {
    cards.push({
      title: "Leadership turnover detected",
      summary: `Multiple executives have departed recently. This can indicate organizational instability or shifting direction.`,
      sourceType: "Leadership records",
      ndMeaning: "Frequent leadership changes often mean shifting priorities, new processes, and less predictability. If you need consistency, ask how transitions are managed."
    });
  }

  if (cards.length === 0) {
    cards.push({
      title: "Limited public evidence available",
      summary: "We could not find strong public signals about this company's workplace culture. This is common for private or smaller companies.",
      sourceType: "Multiple sources",
      ndMeaning: "When public data is limited, the interview becomes your main source of information. Prepare specific questions about daily structure, communication, and expectations."
    });
  }

  return cards.slice(0, 6);
}

function buildFeelLikeWork(company: any, eeocCases: any[]) {
  const desc = (company.description || "").toLowerCase();
  const isFastPaced = /fast.paced|agile|dynamic|startup|hustle/i.test(desc);
  const isCollaborative = /team.player|collaborative|cross.functional|open.office/i.test(desc);
  const isStartup = company.is_startup;

  return [
    {
      title: "Daily structure",
      bullets: [
        isFastPaced ? "Priorities may shift during the day." : "Work pace appears moderate based on available data.",
        isStartup ? "Startup environments often have less formal process." : "Larger companies tend to have more documented processes.",
        "Ask about how daily or weekly work is organized."
      ],
      goodFitIf: "you adapt well to changing plans or enjoy variety",
      beCarefulIf: "you need a predictable schedule to do your best work"
    },
    {
      title: "Communication style",
      bullets: [
        isCollaborative ? "Heavy emphasis on verbal and group communication." : "Communication style is not clearly described.",
        "Ask whether updates happen in writing or in meetings.",
        "Ask how decisions are documented after discussions."
      ],
      goodFitIf: "you are comfortable with frequent verbal check-ins",
      beCarefulIf: "you process information better in writing than in conversation"
    },
    {
      title: "Meeting and interruption load",
      bullets: [
        isCollaborative ? "Cross-functional language suggests frequent meetings." : "Meeting load is unclear from public data.",
        "Ask about the average number of meetings per day.",
        "Ask if there are designated focus-time blocks."
      ],
      goodFitIf: "you gain energy from group interaction",
      beCarefulIf: "you need long uninterrupted blocks to concentrate"
    },
    {
      title: "Sensory and social demand",
      bullets: [
        "Ask about office layout (open plan vs. private spaces).",
        "Ask about noise levels and whether headphones are common.",
        isCollaborative ? "Social visibility may be expected." : "Social expectations are not clearly stated."
      ],
      goodFitIf: "you are comfortable with open environments and spontaneous interaction",
      beCarefulIf: "you are sensitive to noise, light, or social overload"
    },
    {
      title: "Manager predictability",
      bullets: [
        "Manager style is the hardest signal to find in public data.",
        "Ask how feedback is given (scheduled vs. ad hoc).",
        "Ask what 'good performance' looks like in the first 90 days."
      ],
      goodFitIf: "you work well with ambiguity and figure things out independently",
      beCarefulIf: "you need clear, consistent expectations from your manager to feel secure"
    }
  ];
}

function buildQuestions() {
  return [
    { category: "Role clarity", question: "What does a typical day look like in this role?", softerVersion: "Can you walk me through what a recent week looked like for someone in this position?", whyAskThis: "This helps you understand whether the work is structured or unpredictable." },
    { category: "Role clarity", question: "How are changing priorities communicated to the team?", softerVersion: "When priorities change, what does that usually look like for employees?", whyAskThis: "This helps you understand whether important information is documented or mostly passed along informally." },
    { category: "Documentation", question: "Where does the team keep its documentation?", softerVersion: "How does the team share knowledge and process information?", whyAskThis: "Strong documentation means less reliance on memory and informal communication." },
    { category: "Schedule and deadlines", question: "How are deadlines set and communicated?", softerVersion: "What does the timeline process look like for most projects?", whyAskThis: "This reveals whether deadlines are realistic and planned, or sudden and stressful." },
    { category: "Feedback and manager style", question: "How often do you give feedback, and in what format?", softerVersion: "What does the feedback process look like here?", whyAskThis: "Knowing the feedback style helps you prepare for how your work will be evaluated." },
    { category: "Accommodations and flexibility", question: "What does the process look like for requesting workplace adjustments?", softerVersion: "How does the company handle different work style needs?", whyAskThis: "This tells you how safe it is to ask for support without formal disclosure." },
  ];
}

function buildApplicationActions(company: any) {
  const isFastPaced = /fast.paced|agile|dynamic|startup|hustle/i.test((company.description || "").toLowerCase());
  const lowClarity = (company.employer_clarity_score ?? 0) < 40;

  return [
    {
      type: "resume" as const,
      recommendation: lowClarity && isFastPaced
        ? "Emphasize documentation skills, prioritization methods, and your ability to manage shifting work with clear systems."
        : "Highlight specific, measurable outcomes. Show what you built, fixed, or improved with concrete numbers."
    },
    {
      type: "cover_letter" as const,
      recommendation: isFastPaced
        ? "Focus on examples where you handled changing priorities with clear systems. Show how you stay organized."
        : "Focus on your strongest match to the role requirements. Use one concrete example."
    },
    {
      type: "auto_apply" as const,
      recommendation: isFastPaced
        ? "This employer may expect fast replies and self-directed problem solving. Make sure your application materials reflect adaptability."
        : "Standard application flow. Ensure your resume matches the role description closely."
    },
    {
      type: "interview" as const,
      recommendation: isFastPaced
        ? "Prepare a short example of how you manage shifting work without losing detail. Practice describing your organizational systems."
        : "Prepare 2 to 3 examples of past work that match the job requirements. Keep answers focused and specific."
    },
  ];
}

export function NDDossierView({ company, companyId, executives = [], eeocCases = [], issueSignals = [], contracts = [] }: NDDossierViewProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [viewMode, setViewMode] = useState<NDViewMode>("detailed");
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const clarity = useMemo(() => deriveClarity(company, issueSignals), [company, issueSignals]);
  const workPace = useMemo(() => deriveWorkPace(company), [company]);
  const sensoryLoad = useMemo(() => deriveSensoryLoad(company), [company]);
  const flexibility = useMemo(() => deriveFlexibility(company), [company]);
  const disclosureSafety = useMemo(() => deriveDisclosureSafety(company, eeocCases), [company, eeocCases]);
  const evidence = useMemo(() => buildEvidence(company, executives, eeocCases, issueSignals, contracts), [company, executives, eeocCases, issueSignals, contracts]);
  const feelLikeWork = useMemo(() => buildFeelLikeWork(company, eeocCases), [company, eeocCases]);
  const questions = useMemo(() => buildQuestions(), []);
  const applicationActions = useMemo(() => buildApplicationActions(company), [company]);

  const scrollToSection = useCallback((index: number) => {
    setActiveStep(index);
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const isSummary = viewMode === "summary";

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── HEADER ── */}
      <header className="flex flex-col gap-4 mb-2">
        <div className="flex items-center gap-4">
          <CompanyLogo companyName={company.name} logoUrl={company.logo_url} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground leading-tight">{company.name}</h1>
            <p className="text-xs text-foreground/60 mt-0.5">
              This page helps you understand what working here may actually feel like.
            </p>
          </div>
          <NDModeToggle />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/resume-optimizer")}>
            <FileText className="w-3.5 h-3.5" /> Resume
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/cover-letter-optimizer")}>
            <Briefcase className="w-3.5 h-3.5" /> Cover letter
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/auto-apply")}>
            <Bot className="w-3.5 h-3.5" /> AutoApply
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate(`/interview?company=${company.slug}`)}>
            <MessageSquare className="w-3.5 h-3.5" /> Interview questions
          </Button>
          <div className="ml-auto">
            <SummaryModeSwitch mode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </header>

      {/* ── PROGRESS RAIL ── */}
      <StepProgressRail steps={STEPS} activeStep={activeStep} onStepClick={scrollToSection} />

      {/* ── 1. QUICK READ ── */}
      <section ref={el => { sectionRefs.current[0] = el; }} className="mb-8 scroll-mt-36">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Quick Read</h2>
        <div className="space-y-2">
          <QuickReadCard label="Clarity" rating={clarity.rating} explanation={clarity.explanation} tooltip="How clear are the company's role expectations and documentation practices?" />
          <QuickReadCard label="Work pace" rating={workPace.rating} explanation={workPace.explanation} tooltip="How fast does work move here? Are priorities stable or shifting?" />
          <QuickReadCard label="Sensory and social load" rating={sensoryLoad.rating} explanation={sensoryLoad.explanation} tooltip="How much social energy and sensory tolerance might this job require?" />
          <QuickReadCard label="Flexibility" rating={flexibility.rating} explanation={flexibility.explanation} tooltip="Is there evidence of remote work, flexible schedules, or accommodations?" />
          <QuickReadCard label="Disclosure safety" rating={disclosureSafety.rating} explanation={disclosureSafety.explanation} tooltip="How safe might it be to ask for support or share neurodivergent needs?" />
        </div>
      </section>

      {/* ── 2. EVIDENCE ── */}
      {!isSummary && (
        <section ref={el => { sectionRefs.current[1] = el; }} className="mb-8 scroll-mt-36">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">What We Found</h2>
          <div className="space-y-3">
            {evidence.map((e, i) => (
              <EvidenceCard key={i} title={e.title} summary={e.summary} sourceType={e.sourceType} ndMeaning={e.ndMeaning} />
            ))}
          </div>
        </section>
      )}

      {/* ── 3. FEEL LIKE WORK ── */}
      <section ref={el => { sectionRefs.current[2] = el; }} className="mb-8 scroll-mt-36">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">What This May Feel Like at Work</h2>
        <div className="space-y-3">
          {feelLikeWork.map((f, i) => (
            <FeelLikeWorkCard key={i} title={f.title} bullets={isSummary ? f.bullets.slice(0, 1) : f.bullets} goodFitIf={f.goodFitIf} beCarefulIf={f.beCarefulIf} />
          ))}
        </div>
      </section>

      {/* ── 4. QUESTIONS ── */}
      <section ref={el => { sectionRefs.current[3] = el; }} className="mb-8 scroll-mt-36">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Questions to Ask Before You Apply</h2>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionScriptCard key={i} category={q.category} question={q.question} softerVersion={q.softerVersion} whyAskThis={q.whyAskThis} />
          ))}
        </div>
      </section>

      {/* ── 5. APPLICATION ACTIONS ── */}
      <section ref={el => { sectionRefs.current[4] = el; }} className="mb-8 scroll-mt-36">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Use This in My Application</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {applicationActions.map((a, i) => (
            <ApplicationActionCard key={i} type={a.type} recommendation={a.recommendation} />
          ))}
        </div>
      </section>
    </div>
  );
}
