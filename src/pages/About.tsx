import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowRight, ExternalLink } from "lucide-react";
import jackyeHeadshotSm from "@/assets/jackye-headshot-sm.webp";

const CREDENTIAL_BADGES: { label: string; url: string | null }[] = [
  { label: "LinkedIn Learning Instructor", url: "https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" },
  { label: "Associate Editor, HR Gazette", url: "https://hr-gazette.com/category/news-reviews/events/" },
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
  { label: "Textio", url: null },
  { label: "SeekOut", url: null },
];

const About = () => {
  usePageSEO({
    title: "About — WDIWF by Jackye Clayton",
    description:
      "Meet Jackye Clayton — TA architect, HR Tech strategist, and voice behind the Inclusive AF podcast and But First, Coffee. After building hiring systems for companies like Textio and SeekOut, she built the tool she wished candidates always had.",
    path: "/about",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* ── Page Header ── */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 pt-20 pb-12">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-4">
            The Mission
          </p>
          <h1
            className="font-sans text-foreground leading-[1.1] mb-6"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px", maxWidth: "20ch" }}
          >
            After years of building hiring systems for companies, I realized nobody was building the reverse.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[52ch]">
            A system that lets people evaluate companies with the same rigor companies use to evaluate them. That's WDIWF.
          </p>
        </section>

        {/* ── Two-column: Photo + Story ── */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <img
                src={jackyeHeadshotSm}
                alt="Jackye Clayton, Founder of WDIWF"
                className="w-full aspect-[3/4] object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-8">
              <div>
                <h2 className="font-sans text-lg font-bold text-foreground mb-3">The Origin</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Jackye Clayton has spent her career inside the machinery of hiring — building recruiting tech stacks, auditing talent acquisition pipelines, and advising HR teams on everything from AI screening tools to DEIB strategy. She's worked with companies like Textio and SeekOut, spoken on stages at Unleash America, Workhuman Live, and Transform, and currently serves as Associate Editor at <a href="https://hr-gazette.com/category/news-reviews/events/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">The HR Gazette</a>.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Along the way, she noticed a fundamental asymmetry: companies have sophisticated systems for evaluating candidates. Candidates have Glassdoor and Google. That's the gap WDIWF was built to close.
                </p>
              </div>

              <div>
                <h2 className="font-sans text-lg font-bold text-foreground mb-3">The Why</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The hiring process is a one-way mirror. Companies run background checks, behavioral assessments, and AI screenings on you while you're left making career decisions based on marketing copy and anonymous reviews. WDIWF flips that dynamic by giving candidates and employees the same quality of intelligence that companies use to evaluate them.
                </p>
              </div>

              <div>
                <h2 className="font-sans text-lg font-bold text-foreground mb-3">The Voice Behind It</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As the host of the <a href="https://www.inclusiveafpodcast.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Inclusive AF podcast</a>, co-host of <a href="https://wrkdefined.com/podcast/but-first-coffee" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">But First, Coffee</a> and <a href="https://www.linkedin.com/posts/jackyeclayton_people-in-squares-valentines-day-show-activity-7428078957075525633-kxn8" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">People in Squares</a>, and as a <a href="https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn Learning instructor</a>, Jackye has spent years having the conversations the industry avoids — about accountability, performative diversity, and what "people-first culture" actually looks like when the cameras are off. WDIWF is the logical next step: turning those conversations into a tool.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap pt-2">
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
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-[1100px] mx-auto px-6 lg:px-16 py-20 text-center">
          <h2 className="font-sans text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800 }}>
            Join the movement.
          </h2>
          <p className="text-sm text-muted-foreground max-w-[44ch] mx-auto mb-8">
            Be among the first to use the career intelligence platform that holds employers accountable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 font-sans text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
            >
              Get Early Access <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/receipts"
              className="inline-flex items-center justify-center gap-2 border border-border bg-card px-8 py-3.5 font-sans text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all rounded-lg"
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
