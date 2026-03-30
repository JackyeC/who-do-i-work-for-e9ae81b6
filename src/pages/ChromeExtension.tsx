import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Chrome, Download, Shield, Eye, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function ChromeExtension() {
  usePageSEO({
    title: "Chrome Extension — Career Intelligence at the Moment of Decision | WDIWF",
    description:
      "Install the WDIWF Chrome extension to see integrity scores, red flags, and employer receipts right on job listing pages. Works on LinkedIn, Indeed, Greenhouse, and more.",
    path: "/extension",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase mb-6">
            <Chrome className="w-3.5 h-3.5" />
            Chrome Extension v4.1.0
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Career intelligence at the moment of decision.
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto mb-8">
            See integrity scores, red flags, and receipts for any employer — right on the job page. No tab switching. No searching. Just the truth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <a
              href="/extension/wdiwf-extension-v4.1.0.zip"
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Extension (.zip)
            </a>
          </div>

          {/* Install steps */}
          <div className="bg-card border border-border/40 rounded-2xl p-6 text-left max-w-lg mx-auto">
            <h2 className="font-mono text-xs tracking-wider uppercase text-primary font-semibold mb-4">
              Install in 3 Steps
            </h2>
            <ol className="space-y-3 text-sm text-foreground/80">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                <span>Download the .zip file above and <strong className="text-foreground">unzip it</strong> to a folder on your computer.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                <span>Open Chrome and go to <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">chrome://extensions</code>, then enable <strong className="text-foreground">Developer mode</strong> (top right).</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                <span>Click <strong className="text-foreground">"Load unpacked"</strong> and select the unzipped <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">extension</code> folder.</span>
              </li>
            </ol>
            <p className="text-xs text-muted-foreground mt-4">
              That's it. Navigate to any job listing and the WDIWF side panel opens automatically with the company's integrity profile.
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
      </main>
      <Footer />
    </div>
  );
}
