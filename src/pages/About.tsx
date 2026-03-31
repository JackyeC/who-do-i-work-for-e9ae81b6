import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowRight, ExternalLink } from "lucide-react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";

const CREDENTIAL_BADGES: { label: string; url: string | null }[] = [
  { label: "LinkedIn Learning Instructor", url: "https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" },
  { label: "Associate Editor, Human Resources Gazette", url: "https://hr-gazette.com/category/news-reviews/events/" },
  { label: "Inclusive AF Podcast", url: "https://www.inclusiveafpodcast.com" },
  { label: "But First, Coffee", url: "https://wrkdefined.com/podcast/but-first-coffee" },
  { label: "People in Squares", url: "https://www.linkedin.com/posts/jackyeclayton_people-in-squares-valentines-day-show-activity-7428078957075525633-kxn8" },
  { label: "People Puzzles Collective", url: "https://podcasts.apple.com/us/podcast/the-people-puzzles-collective/id1810747382" },
  { label: "Leapsome Top 26 Human Resources Influencer 2026", url: "https://www.leapsome.com/blog/hr-influencers" },
  { label: "Peoplebox Top 68 Human Resources Experts 2026", url: "https://www.peoplebox.ai/blog/top-50-hr-influencers-2024/" },
  { label: "People Managing People Top 68 Human Resources Experts", url: "https://peoplemanagingpeople.com/career/hr-experts/" },
  { label: "Unleash America 2025", url: "https://hr-gazette.com/unleash-america-2025-preview-with-jackye-clayton/" },
  { label: "Workhuman Live 2025", url: null },
  { label: "The Well-led Podcast", url: "https://open.spotify.com/episode/1rxa6JAQD2LFRQIsCI9U7L" },
  { label: "The POZcast", url: "https://www.youtube.com/watch?v=2dAeURaRogg" },
  { label: "WRKdefined", url: "https://wrkdefined.com/person/jackye-clayton" },
];

const About = () => {
  usePageSEO({
    title: "About Jackye Clayton — Who Do I Work For",
    description:
      "Meet Jackye Clayton — Human Resources Technology strategist, talent acquisition architect, LinkedIn Learning instructor, and the founder of Who Do I Work For. She built WDIWF because workers deserve receipts before they make career decisions.",
    path: "/about",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">

        {/* ═══════════════════════════════════════════
            1 — WHO JACKYE IS
        ═══════════════════════════════════════════ */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 pt-20 pb-8">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-5">
            Meet the Founder
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-start">
            <div className="bg-card border border-border overflow-hidden max-w-[260px]">
              <img
                src={jackyeHeadshotSm}
                alt="Jackye Clayton, Founder of Who Do I Work For"
                className="w-full aspect-square object-cover object-top"
                loading="eager"
                decoding="async"
              />
            </div>
            <div>
              <h1
                className="font-sans text-foreground leading-[1.08] mb-4"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px", maxWidth: "22ch" }}
              >
                Jackye Clayton
              </h1>
              <p className="font-mono text-xs text-primary tracking-wide uppercase mb-5">
                Human Resources Technology Strategist · Talent Acquisition Architect · Instructor · Writer · Career Advocate
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-[54ch]">
                Jackye Clayton is a Human Resources Technology strategist and talent acquisition architect who has spent 20 years inside the machinery of hiring — building recruiting technology stacks, auditing talent pipelines, and advising organizations on everything from artificial intelligence screening tools to structured hiring and pay transparency.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[54ch]">
                She is a{" "}
                <a href="https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn Learning instructor</a>,
                {" "}Associate Editor at{" "}
                <a href="https://hr-gazette.com/category/news-reviews/events/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Human Resources Gazette</a>,
                {" "}and host of{" "}
                <a href="https://www.inclusiveafpodcast.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Inclusive AF</a>
                {" "}and{" "}
                <a href="https://wrkdefined.com/podcast/but-first-coffee" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">But First, Coffee</a>.
                {" "}She is known for her work in ethical human resources technology, inclusion, structured hiring, pay transparency, and worker-centered career thinking.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            2 — WHAT SHE HAS SEEN
        ═══════════════════════════════════════════ */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">What I've Seen in the World of Work</h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                I've sat in the rooms where hiring decisions are made. I've seen how companies build employer brands that look nothing like the actual employee experience. I've watched people accept offers at companies that were three months from layoffs, because nobody told them to look at the signals that were already public.
              </p>
              <p>
                The hiring process is a one-way mirror. Companies run background checks, behavioral assessments, and artificial intelligence screenings on you. And what do you get? A careers page, a mission statement, and maybe some anonymous reviews. That is not enough to make a career decision.
              </p>
              <p>
                I got tired of watching workers be asked to show everything while employers got to hide behind branding.
              </p>
            </div>
          </div>
        </section>

        {/* ── GOLD DIVIDER ── */}
        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══════════════════════════════════════════
            3 — WHY WDIWF EXISTS
        ═══════════════════════════════════════════ */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">Why I Built Who Do I Work For</h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                I built Who Do I Work For because people are constantly asked to prove themselves to employers — and employers are rarely asked to prove themselves to workers. Your resume gets scanned. Your references get called. Your social media gets searched. But nobody hands you a dossier on the company's political spending, enforcement history, or lobbying record before you sign.
              </p>
              <p>
                I want people to have great jobs with values and mission alignment — personally and professionally. That means knowing what your labor supports before you commit to it. Not after.
              </p>
              <p>
                A good career is not just about compensation. It is about alignment, clarity, safety, and what your work is helping build.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            4 — WHY PUBLIC RECORDS & ACCOUNTABILITY
        ═══════════════════════════════════════════ */}
        <section className="bg-card border-y border-border px-6 lg:px-16 py-16">
          <div className="max-w-[640px] mx-auto">
            <h2 className="font-sans text-lg font-bold text-foreground mb-4">Why Public Records and Accountability</h2>
            <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                Mission statements are not enough. Companies will always tell you what they think you want to hear. That is marketing. What they actually fund, lobby for, get fined for, and build — that is the record. And it is already public.
              </p>
              <p>
                Who Do I Work For pulls from the Federal Election Commission, the Securities & Exchange Commission, the Bureau of Labor Statistics, the Occupational Safety & Health Administration, the National Labor Relations Board, Senate lobbying disclosures, and more. Every signal is traceable. Every score is explainable. No black boxes. No opinions dressed as data.
              </p>
              <p>
                People deserve to know what their labor supports. Workers should not be the last to know when a company is risky, misaligned, or all talk.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            5 — WHAT JACKYE BELIEVES ABOUT WORK
        ═══════════════════════════════════════════ */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16">
          <div className="max-w-[640px]">
            <h2 className="font-sans text-lg font-bold text-foreground mb-6">What I Believe About Work</h2>
            <div className="space-y-4">
              {[
                "This is bigger than job search. This is about knowing what you are building with your labor and whether you chose it with your eyes open.",
                "Workers deserve receipts, context, and leverage — not just promises.",
                "The best career decisions are made with evidence, not hope.",
                "Companies interview you. Someone should be interviewing them.",
                "You wouldn't buy a house without an inspection. You shouldn't accept a job without one either.",
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
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 pb-12">
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

        {/* ── GOLD DIVIDER ── */}
        <div className="gold-line mx-auto w-full max-w-[200px]" />

        {/* ═══════════════════════════════════════════
            6 — FINAL CTA
        ═══════════════════════════════════════════ */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-20 text-center">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">Know who you work for.</p>
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}>
            Stop applying. Start aligning.
          </h2>
          <p className="text-sm text-muted-foreground max-w-[46ch] mx-auto mb-8">
            Search any employer. Read the receipts. Protect your career. That is what this platform is for.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/join"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold hover:brightness-110 transition-all"
            >
              Protect My Career <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/receipts"
              className="inline-flex items-center justify-center gap-2 border border-border bg-card px-8 py-3.5 font-sans text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              See the Receipts
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
