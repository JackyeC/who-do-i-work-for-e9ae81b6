import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { VibeMatchInput } from "@/lib/realityGapScore";
import {
  Terminal, Search, Users, Shield, AlertTriangle,
  MessageSquare, ClipboardCheck, Loader2, ChevronRight,
} from "lucide-react";

// ─── Sentiment Slider ───────────────────────────────────────────────────────

function SentimentSlider({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  const getColor = (v: number) => {
    if (v <= 25) return "bg-destructive";
    if (v <= 45) return "bg-civic-yellow";
    if (v <= 60) return "bg-civic-yellow";
    if (v <= 80) return "bg-civic-blue";
    return "bg-civic-green";
  };

  const getEmoji = (v: number) => {
    if (v <= 25) return "🔴";
    if (v <= 45) return "🟠";
    if (v <= 60) return "🟡";
    if (v <= 80) return "🔵";
    return "🟢";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono text-muted-foreground tracking-wider uppercase">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none cursor-pointer rounded-full bg-muted
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:cursor-pointer"
        />
        <div
          className={cn("absolute top-0 left-0 h-2 rounded-full pointer-events-none transition-all", getColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-center">
        <span className="text-lg">{getEmoji(value)}</span>
        <span className="ml-2 text-sm font-mono font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, number }: { icon: typeof Shield; title: string; number: number }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-civic-green/20">
      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-civic-green/10 border border-civic-green/20">
        <span className="font-mono text-xs text-civic-green font-bold">{number.toString().padStart(2, "0")}</span>
      </div>
      <Icon className="w-4 h-4 text-civic-green" />
      <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">{title}</h3>
    </div>
  );
}

// ─── Question Card ──────────────────────────────────────────────────────────

function QuestionCard({
  question,
  description,
  options,
  value,
  onChange,
}: {
  question: string;
  description?: string;
  options: { label: string; value: number }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium text-foreground leading-snug">{question}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="space-y-1.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[12px] border transition-all",
                value === opt.value
                  ? "border-civic-green/50 bg-civic-green/10 text-foreground"
                  : "border-border/40 bg-background hover:border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all",
                value === opt.value ? "border-civic-green bg-civic-green" : "border-muted-foreground/30"
              )} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        {/* Sentiment slider override */}
        <div className="pt-2 border-t border-border/30">
          <SentimentSlider
            value={value}
            onChange={onChange}
            leftLabel="Concerning"
            rightLabel="Strong"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface Props {
  onSubmit: (input: VibeMatchInput) => void;
  isSubmitting: boolean;
}

export function VibeMatchQuestionnaire({ onSubmit, isSubmitting }: Props) {
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Questionnaire scores
  const [successClarity, setSuccessClarity] = useState(50);
  const [challengeConsistency, setChallengeConsistency] = useState(50);
  const [panelDiversity, setPanelDiversity] = useState(50);
  const [boundaryReaction, setBoundaryReaction] = useState(50);
  const [predecessorRespect, setPredecessorRespect] = useState(50);
  const [processOrganization, setProcessOrganization] = useState(50);

  const { data: companies = [] } = useQuery({
    queryKey: ["company-search", companySearch],
    enabled: companySearch.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, industry")
        .ilike("name", `%${companySearch}%`)
        .limit(6);
      return data || [];
    },
  });

  const handleSubmit = () => {
    if (!selectedCompany) return;
    onSubmit({
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      jobTitle: jobTitle || undefined,
      interviewDate: interviewDate || undefined,
      successClarity,
      challengeConsistency,
      panelDiversity,
      boundaryReaction,
      predecessorRespect,
      processOrganization,
      additionalNotes: additionalNotes || undefined,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Company Selection */}
      <Card className="border-civic-green/20 bg-civic-green/[0.02]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-civic-green" />
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-civic-green">Select Company</h3>
          </div>

          {!selectedCompany ? (
            <div className="space-y-2">
              <Input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search for the company you interviewed with..."
                className="font-mono text-sm bg-background"
              />
              {companies.length > 0 && (
                <div className="border border-border divide-y divide-border">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany({ id: c.id, name: c.name }); setCompanySearch(""); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-civic-green/5 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.industry}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border border-civic-green/30 bg-civic-green/5">
              <span className="font-medium text-foreground">{selectedCompany.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCompany(null)} className="text-xs">
                Change
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground font-mono">Job Title (optional)</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Senior Engineer" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-mono">Interview Date (optional)</Label>
              <Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="mt-1 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCompany && (
        <>
          {/* Section 1: Leadership & Transparency */}
          <div>
            <SectionHeader icon={Shield} title="Leadership & Transparency" number={1} />
            <div className="space-y-4">
              <QuestionCard
                question="Did the interviewers clearly define what success looks like in the first 90 days?"
                options={[
                  { label: "Yes, they had a specific 30/60/90-day plan.", value: 90 },
                  { label: 'It was vague (e.g., "we need a self-starter to figure it out").', value: 45 },
                  { label: "No, they seemed unsure of why the role exists.", value: 15 },
                ]}
                value={successClarity}
                onChange={setSuccessClarity}
              />
              <QuestionCard
                question="When you asked about the team's biggest challenge, was the answer consistent across interviewers?"
                options={[
                  { label: "Yes, they are aligned on the mission.", value: 90 },
                  { label: "No, I got conflicting stories about the priorities.", value: 35 },
                  { label: 'They avoided the question or "sugar-coated" it.', value: 15 },
                ]}
                value={challengeConsistency}
                onChange={setChallengeConsistency}
              />
            </div>
          </div>

          {/* Section 2: Inclusion & Cultural Logic */}
          <div>
            <SectionHeader icon={Users} title="Inclusion & Cultural Logic" number={2} />
            <div className="space-y-4">
              <QuestionCard
                question="Did you meet people from different backgrounds or departments during the process?"
                options={[
                  { label: "Yes, the panel was diverse and cross-functional.", value: 90 },
                  { label: "I only met with one type of person/perspective.", value: 40 },
                  { label: "I was not allowed to meet the actual team I'd be working with.", value: 15 },
                ]}
                value={panelDiversity}
                onChange={setPanelDiversity}
              />
              <QuestionCard
                question='How did the team react to a question about "work-life boundaries" or "burnout"?'
                options={[
                  { label: 'They were transparent about the "crunch" but showed support systems.', value: 85 },
                  { label: 'They used "we wear many hats" or "we\'re a family" as a deflection.', value: 35 },
                  { label: "They seemed surprised or bristled at the question.", value: 10 },
                ]}
                value={boundaryReaction}
                onChange={setBoundaryReaction}
              />
            </div>
          </div>

          {/* Section 3: Process Signals */}
          <div>
            <SectionHeader icon={AlertTriangle} title="Process Signals" number={3} />
            <div className="space-y-4">
              <QuestionCard
                question="Did anyone 'bad-mouth' a former employee or the person previously in this role?"
                options={[
                  { label: "Never; they spoke with respect.", value: 90 },
                  { label: 'There were subtle hints of "the last person couldn\'t cut it."', value: 40 },
                  { label: "Yes, they were openly critical of the predecessor.", value: 10 },
                ]}
                value={predecessorRespect}
                onChange={setPredecessorRespect}
              />
              <QuestionCard
                question="Was the process organized (on time, prepared, respectful of your schedule)?"
                options={[
                  { label: "Professional and seamless.", value: 90 },
                  { label: "Chaotic (last-minute reschedules, interviewers hadn't read my resume).", value: 20 },
                ]}
                value={processOrganization}
                onChange={setProcessOrganization}
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <SectionHeader icon={MessageSquare} title="Additional Notes" number={4} />
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value.slice(0, 2000))}
              placeholder="Any other observations, red flags, or positive signals from your interview..."
              className="min-h-[100px] font-mono text-sm"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{additionalNotes.length}/2000</p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full gap-2 bg-civic-green hover:bg-civic-green/90 text-background font-mono tracking-wider uppercase text-xs py-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Integrity Gap...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                Generate Reality Check Report
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
