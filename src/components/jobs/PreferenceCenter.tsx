import { useJobPreferences, JobPreference } from "@/hooks/use-job-matcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Heart, Brain, DollarSign, Users, Scale, Sparkles } from "lucide-react";

const AVAILABLE_SIGNALS: (JobPreference & { icon: React.ReactNode; description: string })[] = [
  { signal_key: "worker_benefits", signal_label: "Worker Benefits Detected", min_score: 0, is_required: true, icon: <Heart className="w-4 h-4" />, description: "Company has verified worker benefits (healthcare, PTO, etc.)" },
  { signal_key: "ai_transparency", signal_label: "AI Hiring Transparency", min_score: 0, is_required: true, icon: <Brain className="w-4 h-4" />, description: "Company discloses use of AI in hiring process" },
  { signal_key: "bias_audit_completed", signal_label: "Bias Audit Completed", min_score: 0, is_required: true, icon: <Scale className="w-4 h-4" />, description: "Company has completed algorithmic bias audits" },
  { signal_key: "pay_transparency", signal_label: "Pay Transparency Signals", min_score: 0, is_required: true, icon: <DollarSign className="w-4 h-4" />, description: "Company has pay transparency or equity reporting" },
  { signal_key: "salary_range_posted", signal_label: "Salary Ranges in Postings", min_score: 0, is_required: true, icon: <DollarSign className="w-4 h-4" />, description: "Job postings include salary ranges" },
  { signal_key: "worker_sentiment", signal_label: "Positive Worker Sentiment", min_score: 0, is_required: true, icon: <Users className="w-4 h-4" />, description: "Employees report positive workplace experiences" },
];

export function PreferenceCenter() {
  const { preferences, isLoading, upsert, remove } = useJobPreferences();

  const isEnabled = (key: string) => preferences.some((p: any) => p.signal_key === key);

  const handleToggle = (signal: typeof AVAILABLE_SIGNALS[0], checked: boolean) => {
    if (checked) {
      upsert.mutate({
        signal_key: signal.signal_key,
        signal_label: signal.signal_label,
        min_score: signal.min_score,
        is_required: true,
      });
    } else {
      remove.mutate(signal.signal_key);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Signal Requirements
          </CardTitle>
          <CardDescription>
            Toggle the CivicLens signals you <strong>require</strong> in an employer. Only jobs at companies with these verified signals will appear in your Aligned Jobs feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {AVAILABLE_SIGNALS.map((signal) => (
            <div key={signal.signal_key} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary">{signal.icon}</div>
                <div>
                  <Label className="font-medium text-foreground cursor-pointer">{signal.signal_label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{signal.description}</p>
                </div>
              </div>
              <Switch
                checked={isEnabled(signal.signal_key)}
                onCheckedChange={(checked) => handleToggle(signal, checked)}
                disabled={upsert.isPending || remove.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">How matching works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Each job is scored based on the company's CivicLens Civic Footprint Score plus detected signals from our worker-benefits, AI-accountability, and pay-equity scans. Required signals act as hard filters—jobs that don't meet all your requirements won't appear.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
