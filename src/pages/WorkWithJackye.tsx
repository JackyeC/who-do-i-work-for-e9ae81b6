import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    title: "Career Strategy Session",
    desc: "One-on-one with Jackye. We'll review your intelligence report, assess your offer, map your options, and build a decision framework. You leave with a plan.",
    for: "Candidates · Employees",
    format: "60-minute virtual session",
  },
  {
    title: "Recruiting & Talent Acquisition Advisory",
    desc: "Jackye works with your recruiting team to audit your EVP, anticipate candidate objections, and build intelligence-backed talk tracks that close.",
    for: "Recruiters · TA Leaders",
    format: "Engagement-based",
  },
  {
    title: "HR Tech Go-to-Market Advisory",
    desc: "Positioning, messaging, and competitive intelligence for HR technology companies. Jackye helps you understand what buyers actually care about — and what they don't.",
    for: "HR Tech Founders · Sales Leaders",
    format: "Advisory retainer or project",
  },
  {
    title: "Employer Brand & EVP Strategy",
    desc: "Your EVP is only as strong as the data behind it. Jackye audits your employer brand against real signals and helps you close the gap between what you say and what employees experience.",
    for: "CHROs · People Leaders",
    format: "Workshop + deliverable",
  },
  {
    title: "Offer Review Intensive",
    desc: "Bring your offer letter. Jackye will break it down — compensation benchmarks, contract red flags, non-compete analysis, and negotiation strategy. You'll know exactly what to ask for.",
    for: "Candidates · Executives",
    format: "45-minute deep dive",
  },
];

export default function WorkWithJackye() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 lg:py-28 max-w-[900px] mx-auto">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-4">Advisory Services</div>
        <h1 className="text-3xl lg:text-[clamp(2.2rem,4.5vw,3.2rem)] leading-tight mb-6 text-foreground">
          Work With Jackye
        </h1>
        <p className="text-body-lg text-muted-foreground mb-8 max-w-[560px]">
          The AI coach is always available. But sometimes you need the real thing — direct access to Jackye Clayton for career strategy, recruiting advisory, HR tech positioning, and offer review.
        </p>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-civic-gold-muted to-primary flex items-center justify-center font-serif text-2xl text-primary-foreground shrink-0">
            JC
          </div>
          <div>
            <div className="font-serif text-base text-primary">Jackye Clayton</div>
            <div className="text-[11px] text-muted-foreground">20+ years in HR · Recruiting · Talent Strategy · HR Tech</div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-6 lg:px-16 pb-20 max-w-[900px] mx-auto w-full">
        <div className="flex flex-col gap-px bg-border border border-border">
          {SERVICES.map(s => (
            <div key={s.title} className="bg-card p-6 lg:p-8">
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="font-serif text-lg text-foreground">{s.title}</h3>
                <div className="font-mono text-[9px] tracking-wider uppercase text-primary shrink-0">{s.format}</div>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{s.desc}</p>
              <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                For: {s.for}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 lg:px-16 py-16 text-center">
        <h2 className="text-xl mb-4 text-foreground">Ready to work with Jackye?</h2>
        <p className="text-[13px] text-muted-foreground mb-8 max-w-[420px] mx-auto">
          Whether it's a career decision, a recruiting challenge, or an HR tech launch — Jackye brings the intelligence and the experience.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="mailto:jackye@whodoimworkfor.com?subject=Advisory Request"
            className="bg-primary text-primary-foreground px-7 py-3 font-mono text-[11px] font-semibold tracking-wider uppercase hover:brightness-110 transition-all inline-flex items-center gap-2"
          >
            Book Jackye <ArrowRight className="w-3 h-3" />
          </a>
          <button
            onClick={() => navigate("/ask-jackye")}
            className="border border-border text-muted-foreground px-7 py-3 font-mono text-[11px] tracking-wider uppercase hover:border-primary hover:text-primary transition-all"
          >
            Try Ask Jackye AI
          </button>
        </div>
      </section>
    </div>
  );
}
