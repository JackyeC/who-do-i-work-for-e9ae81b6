import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import {
  Mail, ArrowRight, Check, FileSearch, TrendingUp, AlertTriangle,
  DollarSign, Users, ShieldAlert, Newspaper, ExternalLink,
} from "lucide-react";

/* ── Featured content (curated editorially) ── */
const FEATURED_DROPS = [
  {
    icon: DollarSign,
    tag: "Follow the Money",
    title: "Tech PAC spending surged 40% in Q4 2025",
    description: "The biggest tech employers ramped political spending ahead of key labor legislation votes. See which companies gave the most — and to whom.",
    link: "/follow-the-money",
    date: "Mar 2026",
  },
  {
    icon: AlertTriangle,
    tag: "WARN Act",
    title: "WARN filings spike across fintech sector",
    description: "Three major fintech employers filed WARN notices within two weeks. We traced the connections between their boards and shared investors.",
    link: "/receipts",
    date: "Mar 2026",
  },
  {
    icon: Users,
    tag: "DEI Tracker",
    title: "Which companies quietly dropped DEI commitments?",
    description: "A dozen Fortune 500 companies removed DEI language from their proxy statements. We compared 2024 vs 2025 filings line by line.",
    link: "/receipts",
    date: "Feb 2026",
  },
  {
    icon: ShieldAlert,
    tag: "OSHA / NLRB",
    title: "Repeat OSHA violators still winning government contracts",
    description: "Companies with 5+ OSHA violations in the past year received over $2B in new federal contracts. We mapped every dollar.",
    link: "/receipts",
    date: "Feb 2026",
  },
  {
    icon: TrendingUp,
    tag: "Signal Drop",
    title: "Ghost job postings reach all-time high",
    description: "Our ghost job detection flagged 23% more phantom listings this quarter. Which industries are worst — and what it means for your job search.",
    link: "/browse",
    date: "Jan 2026",
  },
  {
    icon: FileSearch,
    tag: "Investigation",
    title: "The revolving door: government hires at defense contractors",
    description: "We tracked 150+ government officials who moved to defense contractor boards within 12 months of leaving office.",
    link: "/follow-the-money",
    date: "Jan 2026",
  },
];

const WHAT_YOU_GET = [
  { title: "Weekly Signal Drops", desc: "Trending companies, new WARN filings, OSHA complaints, and political spending changes — curated, not algorithmic." },
  { title: "Investigation Previews", desc: "First look at new Receipts investigations before they go live on the platform." },
  { title: "Career Intel", desc: "Salary transparency updates, ghost job alerts, and recruiter intelligence you won't find on job boards." },
  { title: "No Spam, Ever", desc: "One email per week. Unsubscribe anytime. We don't sell your data or send promotional garbage." },
];

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { containerRef, getToken, resetToken } = useTurnstile();

  usePageSEO({
    title: "The Receipts — Weekly Intelligence by Who Do I Work For?",
    description: "Weekly intelligence drops: employer investigations, signal alerts, PAC spending updates, WARN filings, and career intelligence. Delivered once a week by Jackye Clayton.",
    path: "/newsletter",
    jsonLd: {
      "@type": "WebPage",
      name: "The Receipts — Weekly Intelligence Newsletter",
      description: "Weekly employer intelligence newsletter by Who Do I Work For? Sourced from FEC, SEC, OSHA, and NLRB public records.",
      url: "https://wdiwf.jackyeclayton.com/newsletter",
      author: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");

    const token = await getToken();
    if (!token) {
      setErrorMsg("Bot verification failed. Please try again.");
      setStatus("error");
      resetToken();
      return;
    }

    const verified = await verifyTurnstileToken(token);
    if (!verified) {
      setErrorMsg("Verification failed. Please try again.");
      setStatus("error");
      resetToken();
      return;
    }

    const { error } = await supabase.from("email_signups").insert({ email: trimmed, source: "newsletter_page" } as any);
    if (error) {
      if (error.code === "23505") setStatus("success");
      else { setErrorMsg("Something went wrong. Try again."); setStatus("error"); }
    } else {
      setStatus("success");
    }
    resetToken();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero + Signup */}
      <section className="text-center py-16 lg:py-24 px-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Newspaper className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono tracking-wider text-primary uppercase">Newsletter</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          The Receipts
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Weekly employer intelligence — investigations, signal drops, and career intel sourced from public records. Delivered every Monday.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2.5 text-primary font-semibold text-lg py-4">
            <Check className="w-5 h-5" /> You're in. First drop lands Monday.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div ref={containerRef} />
            <div className="flex items-center bg-card border-2 border-primary/20 focus-within:border-primary/50 transition-colors rounded-xl overflow-hidden">
              <Mail className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                placeholder="you@company.com"
                className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                disabled={status === "loading"}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="mr-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {status === "loading" ? "..." : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
            {status === "error" && (
              <p className="text-destructive text-xs mt-2 font-mono">{errorMsg}</p>
            )}
          </form>
        )}
        <p className="text-xs text-muted-foreground/60 mt-4">Free forever. Unsubscribe anytime.</p>
      </section>

      {/* What You Get */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-sm font-mono tracking-[0.15em] uppercase text-primary mb-6 text-center">What You Get</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {WHAT_YOU_GET.map((item) => (
            <div key={item.title} className="p-4 rounded-lg border border-border/40 bg-card">
              <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Signal Drops */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Recent Signal Drops</h2>
          <Link to="/newsletter" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            All Receipts <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURED_DROPS.map((drop) => (
            <Link key={drop.title} to={drop.link} className="group">
              <Card className="bg-card border border-border hover:border-primary/40 transition-colors h-full">
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <drop.icon className="w-4 h-4 text-primary" />
                      <Badge variant="outline" className="text-xs">{drop.tag}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground/60">{drop.date}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {drop.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{drop.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-12 px-4 border-t border-border/30">
        <p className="text-muted-foreground text-sm mb-4">
          Career intelligence, delivered. No algorithms. No ads. Just receipts.
        </p>
        <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} variant="outline" size="sm">
          <Mail className="w-4 h-4 mr-2" /> Subscribe Now
        </Button>
      </section>
    </div>
  );
}
