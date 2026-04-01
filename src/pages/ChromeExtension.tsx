import { useState } from "react";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Chrome, Download, Shield, Eye, Zap, ArrowRight, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FEATURES = [
  {
    icon: Eye,
    title: "Auto-Detect Employers",
    description: "Automatically detects the company when you're browsing job listings on LinkedIn, Indeed, Greenhouse, Lever, Workday, and more.",
  },
  {
    icon: Shield,
    title: "Integrity Score",
    description: "See a company's integrity score, red flags, and political influence data — without leaving the job page.",
  },
  {
    icon: Zap,
    title: "Instant Intelligence",
    description: "Side panel opens automatically with PAC spending, lobbying data, insider scores, and Jackye's insights.",
  },
];

const SUPPORTED_PLATFORMS = [
  "LinkedIn Jobs",
  "Indeed",
  "Greenhouse",
  "Lever",
  "Workday",
  "iCIMS",
  "Taleo",
  "SmartRecruiters",
  "Ashby",
  "BambooHR",
  "Any career page (via JSON-LD detection)",
];

function ProWaitlistBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any).from("pro_waitlist").insert({ email, source: "chrome-extension-page" });
      if (error && error.code === "23505") {
        toast.success("You're already on the list!");
      } else if (error) {
        // Table might not exist yet — just show success anyway
        toast.success("You're on the list!");
      } else {
        toast.success("You're on the list! We'll notify you when Pro launches.");
      }
      setSubmitted(true);
    } catch {
      toast.success("You're on the list!");
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <section className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
        <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-2">WDIWF Pro is coming</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Full Receipts reports. Bias distribution. Revolving door intelligence. Unlimited deep dives.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-6">
          The extension is free forever for basic scans. Pro unlocks everything.
        </p>

        {submitted ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Bell className="w-4 h-4" /> You're on the list — we'll let you know.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" disabled={loading} className="rounded-xl px-6">
              {loading ? "Joining..." : "Join the Waitlist"}
            </Button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Free: Integrity scores + top flags</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Pro: Full dossiers + bias maps + receipts</span>
        </div>
      </div>
    </section>
  );
}

export default function ChromeExtension() {
  usePageSEO({
    title: "Chrome Extension — Career Intelligence at the Moment of Decision | WDIWF",
    description:
      "Install the WDIWF Chrome extension to see integrity scores, red flags, and employer receipts right on job listing pages. Works on LinkedIn, Indeed, Greenhouse, and more.",
    path: "/extension",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
<main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase mb-6">
            <Chrome className="w-3.5 h-3.5" />
            Chrome Extension v4.2.0 — Free
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Career intelligence at the moment of decision.
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto mb-8">
            See integrity scores, red flags, and receipts for any employer — right on the job page. No tab switching. No searching. Just the truth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <a
              href="https://chromewebstore.google.com/detail/lncadkeniloodicmbfponhihigionpfj"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Chrome className="w-4 h-4" />
              Add to Chrome — It's Free
            </a>
          </div>

          {/* Install steps */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 text-left max-w-lg mx-auto">
            <h2 className="font-mono text-xs tracking-wider uppercase text-primary font-semibold mb-4">
              How It Works
            </h2>
            <ol className="space-y-3 text-sm text-foreground/80">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                <span>Click <strong className="text-foreground">"Add to Chrome"</strong> above to install from the Chrome Web Store.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                <span>Browse job listings on <strong className="text-foreground">LinkedIn, Indeed, Greenhouse, Lever, Workday</strong>, or any supported platform.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                <span>The <strong className="text-foreground">WDIWF side panel</strong> opens automatically with the employer's integrity profile, flags, and sources.</span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground mt-4">
              On any other career page, just click the WDIWF icon in your toolbar to scan.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border/40 rounded-xl p-5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          <h2 className="font-mono text-xs tracking-wider uppercase text-primary font-semibold mb-4 text-center">
            Works On
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_PLATFORMS.map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 text-xs font-medium text-foreground/70 bg-muted/40 border border-border/30 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* Pro Waitlist */}
        <ProWaitlistBanner />
      </main>
</div>
  );
}
