import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";

const CREDENTIAL_BADGES: { label: string; url: string | null }[] = [
  { label: "LinkedIn Learning Instructor", url: "https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" },
  { label: "Associate Editor, Human Resources Gazette", url: "https://hr-gazette.com/category/news-reviews/events/" },
  { label: "Inclusive AF Podcast", url: "https://www.inclusiveafpodcast.com" },
  { label: "But First, Coffee", url: "https://wrkdefined.com/podcast/but-first-coffee" },
  { label: "People in Squares", url: "https://www.linkedin.com/posts/jackyeclayton_people-in-squares-valentines-day-show-activity-7428078957075525633-kxn8" },
  { label: "People Puzzles Collective", url: "https://podcasts.apple.com/us/podcast/the-people-puzzles-collective/id1810747382" },
  { label: "Leapsome Top 26 HR Influencer 2026", url: "https://www.leapsome.com/blog/hr-influencers" },
  { label: "Peoplebox Top 68 HR Experts 2026", url: "https://www.peoplebox.ai/blog/top-50-hr-influencers-2024/" },
  { label: "People Managing People Top 68 HR Experts", url: "https://peoplemanagingpeople.com/career/hr-experts/" },
  { label: "Unleash America 2025", url: "https://hr-gazette.com/unleash-america-2025-preview-with-jackye-clayton/" },
  { label: "Workhuman Live 2025", url: null },
  { label: "The Well-led Podcast", url: "https://open.spotify.com/episode/1rxa6JAQD2LFRQIsCI9U7L" },
  { label: "The POZcast", url: "https://www.youtube.com/watch?v=2dAeURaRogg" },
  { label: "WRKdefined", url: "https://wrkdefined.com/person/jackye-clayton" },
];

const About = () => {
  usePageSEO({
    title: "About — Who Do I Work For",
    description:
      "Meet Jackye Clayton — 20-year HR technology strategist, LinkedIn Learning instructor, and founder of Who Do I Work For. She built WDIWF because workers deserve receipts before they make career decisions.",
    path: "/about",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ═══ 1 — MISSION HERO ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 pt-20 pb-12 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-5">
            About Who Do I Work For
          </p>
          <h1
            className="font-sans text-foreground leading-[1.08] mb-6 mx-auto"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px", maxWidth: "24ch" }}
          >
            The reverse background check<br />
            <span className="text-primary">companies never expected.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[54ch] mx-auto">
            Every company runs a background check on you. We built the tool that lets you run one on them — using the same public records they hope you never read.
          </p>
        </section>

        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══ 2 — THE PROBLEM ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The Problem</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">
              The hiring process is a one-way mirror.
            </h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                Companies run background checks, behavioral assessments, and AI screenings on you. And what do you get? A careers page, a mission statement, and maybe some anonymous reviews. That is not enough to make a career decision.
              </p>
              <p>
                I've sat in the rooms where hiring decisions are made. I've seen how companies build employer brands that look nothing like the actual employee experience. I've watched people accept offers at companies that were three months from layoffs — because nobody told them to look at the signals that were already public.
              </p>
              <p>
                I got tired of watching workers be asked to show everything while employers got to hide behind branding.
              </p>
            </div>
          </div>
        </section>

        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══ 3 — WHY WDIWF EXISTS ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The Mission</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">
              Workers deserve receipts before they sign.
            </h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                I built Who Do I Work For because people are constantly asked to prove themselves to employers — and employers are rarely asked to prove themselves to workers.
              </p>
              <p>
                Your resume gets scanned. Your references get called. Your social media gets searched. But nobody hands you a dossier on the company's political spending, enforcement history, or lobbying record before you sign.
              </p>
              <p>
                I want people to have great jobs with values and mission alignment — personally and professionally. That means knowing what your labor supports before you commit to it. Not after.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 4 — THE METHOD (Paper Trail) ═══ */}
        <section className="bg-card border-y border-border px-6 lg:px-16 py-16">
          <div className="max-w-[640px] mx-auto">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The Paper Trail</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">
              Public records, not opinions.
            </h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                WDIWF pulls from the Federal Election Commission, SEC, Bureau of Labor Statistics, OSHA, the National Labor Relations Board, Senate lobbying disclosures, and more. Every signal is traceable. Every score is explainable. No black boxes. No opinions dressed as data.
              </p>
              <p>
                We don't tell you what to think about a company. We show you what the record says — and measure the gap between what they claim and what they've done.
              </p>
            </div>
            <div className="mt-8 p-4 border border-border bg-background">
              <p className="font-mono text-xs text-primary tracking-wide uppercase mb-3">Sources include</p>
              <div className="flex flex-wrap gap-2">
                {["FEC", "SEC", "BLS", "OSHA", "NLRB", "USAspending", "Senate Lobbying", "WARN Act", "EEOC"].map((src) => (
                  <span key={src} className="text-xs font-mono text-muted-foreground px-2.5 py-1 border border-border bg-card">
                    {src}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { label: "Methodology", to: "/methodology" },
                { label: "Data Ethics", to: "/data-ethics" },
                { label: "Compliance", to: "/compliance" },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="px-4 py-2 text-xs font-sans font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 5 — WHY NOT GLASSDOOR ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The Difference</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-6">
              Why not Glassdoor, LinkedIn, or another career site?
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "Glassdoor gives you anonymous reviews.",
                  a: "WDIWF gives you EEOC filings, OSHA citations, SEC disclosures, lobbying records, and PAC spending — public records that can't be moderated or astroturfed.",
                },
                {
                  q: "LinkedIn shows you what companies want you to see.",
                  a: "WDIWF shows you what the public record says they actually do — then measures the gap between their words and the evidence.",
                },
                {
                  q: "AI career tools optimize your resume.",
                  a: "WDIWF investigates the employer. We don't help you fit into a broken system. We help you see the system clearly so you can choose wisely.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="font-mono text-xs text-primary mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic mb-1">
                      "{item.q}"
                    </p>
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══ 6 — FOUNDER ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-16">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-5">
            Meet the Founder
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 items-start">
            <div className="bg-card border border-border overflow-hidden max-w-[240px]">
              <img
                src={jackyeHeadshotSm}
                alt="Jackye Clayton, Founder of Who Do I Work For"
                className="w-full aspect-square object-cover object-top"
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <h2
                className="font-sans text-foreground leading-[1.08] mb-4"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-1px" }}
              >
                Jackye Clayton
              </h2>
              <p className="font-mono text-xs text-primary tracking-wide uppercase mb-5">
                HR Technology Strategist · Talent Acquisition Architect · Career Advocate
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-[54ch]">
                Jackye Clayton has spent 20 years inside the machinery of hiring — building recruiting technology stacks, auditing talent pipelines, and advising organizations on everything from AI screening tools to structured hiring and pay transparency.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[54ch]">
                She is a{" "}
                <a href="https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn Learning instructor</a>,
                {" "}Associate Editor at{" "}
                <a href="https://hr-gazette.com/category/news-reviews/events/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">HR Gazette</a>,
                {" "}and host of{" "}
                <a href="https://www.inclusiveafpodcast.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Inclusive AF</a>
                {" "}and{" "}
                <a href="https://wrkdefined.com/podcast/but-first-coffee" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">But First, Coffee</a>.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 7 — BELIEFS ═══ */}
        <section className="bg-card border-y border-border px-6 lg:px-16 py-16">
          <div className="max-w-[640px] mx-auto">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">The Principles</p>
            <h2 className="font-sans text-lg font-bold text-foreground mb-6">What I believe about work.</h2>
            <div className="space-y-4">
              {[
                "Workers deserve receipts, context, and leverage — not just promises.",
                "The best career decisions are made with evidence, not hope.",
                "Companies interview you. Someone should be interviewing them.",
                "You wouldn't buy a house without an inspection. You shouldn't accept a job without one either.",
                "A good career is not just about compensation. It is about alignment, clarity, safety, and what your work is helping build.",
              ].map((belief, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="font-mono text-xs text-primary mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{belief}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Credential badges ── */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-12">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Recognized By</p>
          <div className="flex items-center gap-3 flex-wrap">
            {CREDENTIAL_BADGES.map((badge) => (
              badge.url ? (
                <a
                  key={badge.label}
                  href={badge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-full whitespace-nowrap hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {badge.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span
                  key={badge.label}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-full whitespace-nowrap"
                >
                  {badge.label}
                </span>
              )
            ))}
          </div>
        </section>

        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══ 8 — CTA ═══ */}
        <section className="max-w-[900px] mx-auto px-6 lg:px-16 py-20 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Ready?</p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}>
            Before you sign anything, check who you're working for.
          </h2>
          <p className="text-sm text-muted-foreground max-w-[46ch] mx-auto mb-8">
            Search any employer. Read the receipts. Make your next career move with your eyes open.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Search className="w-4 h-4" />
            Search Companies
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default About;
