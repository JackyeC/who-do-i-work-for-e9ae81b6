import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Briefcase, Heart, Newspaper, FileText,
  ChevronRight, ChevronLeft, Check, Loader2, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Defense", "HR Tech",
  "Energy", "Retail", "Media", "Education", "Government",
  "Manufacturing", "Legal", "Consulting", "Non-Profit", "Real Estate",
] as const;

const VALUES = [
  "Diversity & Inclusion", "Pay Equity", "Environmental Sustainability",
  "Worker Rights", "Ethical AI", "Transparency", "Community Impact",
  "Mental Health Support", "Remote Work", "Anti-Discrimination",
  "Whistleblower Protection", "Fair Lobbying", "Data Privacy",
  "Veteran Support", "Disability Inclusion",
] as const;

const INTERESTS = [
  "Layoffs & Restructuring", "Corporate Lobbying", "PAC Spending",
  "Government Contracts", "SEC Filings", "Labor Relations",
  "Workplace Safety", "Executive Compensation", "Union Activity",
  "DEI Programs", "Remote Work Policies", "AI in Hiring",
  "Salary Transparency", "Employee Reviews", "Company Culture",
] as const;

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

export default function NewsOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resumeParsing, setResumeParsing] = useState(false);

  const [location, setLocation] = useState("");
  const [locationState, setLocationState] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [resumeSuggestions, setResumeSuggestions] = useState<any>(null);

  const steps = [
    { icon: MapPin, title: "Location", subtitle: "Where are you based?" },
    { icon: Briefcase, title: "Industries", subtitle: "Which industries matter to you?" },
    { icon: Heart, title: "Values", subtitle: "What do you care about in a workplace?" },
    { icon: Newspaper, title: "Interests", subtitle: "What news do you want to see?" },
    { icon: FileText, title: "Resume", subtitle: "Optional: paste for smart suggestions" },
  ];

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleResumeAnalysis = useCallback(async () => {
    if (!resumeText.trim() || !user) return;
    setResumeParsing(true);
    try {
      const response = await supabase.functions.invoke("parse-resume", {
        body: { user_id: user.id, resume_text: resumeText },
      });
      if (response.data?.extracted) {
        setResumeSuggestions(response.data.extracted);
        const newIndustries = [...new Set([...selectedIndustries, ...(response.data.extracted.industries || [])])];
        setSelectedIndustries(newIndustries);
      }
    } catch (err) {
      console.error("Resume parse error:", err);
    }
    setResumeParsing(false);
  }, [resumeText, user, selectedIndustries]);

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          location,
          location_state: locationState,
          industries: selectedIndustries,
          user_values: selectedValues,
          interests: selectedInterests,
          news_onboarding_complete: true,
        })
        .eq("id", user.id);

      if (error) throw error;
      navigate("/dashboard");
    } catch (err) {
      console.error("Save error:", err);
    }
    setSaving(false);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return locationState !== "";
      case 1: return selectedIndustries.length > 0;
      case 2: return selectedValues.length > 0;
      case 3: return selectedInterests.length > 0;
      case 4: return true;
      default: return true;
    }
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <StepIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground font-display">{steps[step].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border/50 bg-card p-6 mb-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">City</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Waco"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">State</label>
                <select value={locationState} onChange={e => setLocationState(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary/50">
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">We'll prioritize news about employers and policies in your area.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(ind => (
                  <button key={ind} onClick={() => toggleItem(selectedIndustries, ind, setSelectedIndustries)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedIndustries.includes(ind) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}>{ind}</button>
                ))}
              </div>
              <p className="text-xs text-primary/70 font-mono">{selectedIndustries.length} selected</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">Your values drive your briefing ranking.</p>
              <div className="flex flex-wrap gap-2">
                {VALUES.map(v => (
                  <button key={v} onClick={() => toggleItem(selectedValues, v, setSelectedValues)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedValues.includes(v) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}>{v}</button>
                ))}
              </div>
              {resumeSuggestions?.suggestedValues && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-primary flex items-center gap-1.5 mb-2"><Sparkles className="w-3 h-3" /> Suggested from resume</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeSuggestions.suggestedValues.filter((v: string) => !selectedValues.includes(v)).map((v: string) => (
                      <button key={v} onClick={() => setSelectedValues([...selectedValues, v])}
                        className="px-2 py-1 rounded-full text-xs border border-primary/30 text-primary hover:bg-primary/10">+ {v}</button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-primary/70 font-mono">{selectedValues.length} selected</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">What topics do you want in your daily briefing?</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(int => (
                  <button key={int} onClick={() => toggleItem(selectedInterests, int, setSelectedInterests)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedInterests.includes(int) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}>{int}</button>
                ))}
              </div>
              {resumeSuggestions?.suggestedInterests && (
                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-primary flex items-center gap-1.5 mb-2"><Sparkles className="w-3 h-3" /> Suggested from resume</p>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeSuggestions.suggestedInterests.filter((i: string) => !selectedInterests.includes(i)).map((i: string) => (
                      <button key={i} onClick={() => setSelectedInterests([...selectedInterests, i])}
                        className="px-2 py-1 rounded-full text-xs border border-primary/30 text-primary hover:bg-primary/10">+ {i}</button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-primary/70 font-mono">{selectedInterests.length} selected</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Paste your resume text below. We'll extract relevant keywords. <span className="text-primary">This is optional.</span>
              </p>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste resume text here (or skip this step)..." rows={8}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted-foreground/50 text-sm resize-none focus:outline-none focus:border-primary/50" />
              {resumeText.trim() && !resumeSuggestions && (
                <button onClick={handleResumeAnalysis} disabled={resumeParsing}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-primary rounded-lg text-sm font-medium transition-colors">
                  {resumeParsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze resume</>}
                </button>
              )}
              {resumeSuggestions && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-primary flex items-center gap-1.5 mb-2"><Check className="w-3 h-3" /> Resume analyzed — suggestions added</p>
                  {resumeSuggestions.keywords?.length > 0 && (
                    <p className="text-xs text-muted-foreground">Extracted: {resumeSuggestions.keywords.slice(0, 8).join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex justify-between">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              step === 0 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                canProceed() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              }`}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleComplete} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Get my briefing</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
