import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ArrowRight, Loader2, Shield, User, Briefcase, MapPin, Link2, MessageCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function IntelligenceCheck() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    employer_name: "",
    role_title: "",
    location: "",
    job_posting_url: "",
    concerns: "",
    email: "",
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employer_name.trim() || !form.role_title.trim() || !form.email.trim()) return;

    setSubmitting(true);
    try {
      // Insert with a known ID so we can pass it to the report generator
      const requestId = crypto.randomUUID();
      const { error } = await (supabase as any).from("intelligence_requests").insert({
        id: requestId,
        employer_name: form.employer_name.trim(),
        role_title: form.role_title.trim(),
        location: form.location.trim() || null,
        job_posting_url: form.job_posting_url.trim() || null,
        concerns: form.concerns.trim() || null,
        email: form.email.trim().toLowerCase(),
      });
      if (error) throw error;

      // Auto-generate intelligence report + email it (fire-and-forget)
      supabase.functions.invoke("generate-intelligence-report", {
        body: {
          employer_name: form.employer_name.trim(),
          role_title: form.role_title.trim(),
          email: form.email.trim().toLowerCase(),
          location: form.location.trim() || null,
          concern: form.concerns.trim() || null,
          request_id: requestId,
        },
      }).catch((err: Error) => console.error("Report generation failed:", err));

      setSubmitted(true);
    } catch (err) {
      console.error("Intelligence request submission failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Helmet>
          <title>Request Received — Who Do I Work For</title>
        </Helmet>
        <MarketingNav />
        <main className="flex-1 px-6 lg:px-16 py-16 lg:py-24">
          <div className="max-w-[520px] mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-foreground font-sans text-2xl font-bold mb-4">You're in the queue.</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Jackyé will send your intelligence snapshot within 2–3 business days.
            </p>
            <p className="text-xs text-muted-foreground/70">
              We'll email your results to <span className="font-medium text-foreground">{form.email}</span>.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>Free Employer Intelligence Check — Who Do I Work For</title>
        <meta name="description" content="Share a role or offer you're considering. We'll scan public records and send you an intelligence snapshot within 2–3 business days." />
      </Helmet>
      <MarketingNav />

      <main className="flex-1 px-6 lg:px-16 py-16 lg:py-24">
        <div className="max-w-[620px] mx-auto">
          {/* Intro */}
          <div className="text-center mb-10">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-4">
              Free Employer Intelligence Check
            </p>
            <h1
              className="text-foreground font-sans mb-4"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1 }}
            >
              Would you work here?
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-[50ch] mx-auto">
              Share a role or offer you're considering. We'll scan public information about the company — layoffs, lawsuits, political contributions, CEO pay, and other signals — and send you a brief intelligence snapshot.
            </p>
          </div>

          {/* Beta badge */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/[0.03] px-4 py-3 mb-8">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Concierge beta.</span>{" "}
              That means a real human (Jackyé) reviews each request and sends a custom response. Automated dashboards are coming soon.
            </p>
          </div>

          {/* Form */}
          <Card className="border-border/60">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Employer name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.employer_name}
                    onChange={update("employer_name")}
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <User className="w-3.5 h-3.5" /> Role title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.role_title}
                    onChange={update("role_title")}
                    placeholder="e.g. Senior Product Manager"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <Input
                    value={form.location}
                    onChange={update("location")}
                    placeholder="e.g. Austin, TX"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Link to job posting or offer letter
                  </label>
                  <Input
                    value={form.job_posting_url}
                    onChange={update("job_posting_url")}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> What are you most concerned about?
                  </label>
                  <Textarea
                    value={form.concerns}
                    onChange={update("concerns")}
                    placeholder="e.g. I saw they had layoffs recently and want to understand the risk..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <Mail className="w-3.5 h-3.5" /> Your email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@email.com"
                    type="email"
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <>Request Free Intelligence Check <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>

              {/* Expectation-setting */}
              <p className="text-xs text-muted-foreground text-center mt-5 leading-relaxed">
                During beta, Jackyé personally reviews each request. You'll receive a short intelligence snapshot by email within 2–3 business days.
              </p>
            </CardContent>
          </Card>

          {/* Privacy & Disclaimer */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Privacy:</span> We'll only use your information to process your WDIWF request and communicate with you about this service.
            </p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              WDIWF provides career intelligence and education, not legal or financial advice.
            </p>
            <p className="text-xs text-muted-foreground/50">
              Questions? <a href="/contact" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
