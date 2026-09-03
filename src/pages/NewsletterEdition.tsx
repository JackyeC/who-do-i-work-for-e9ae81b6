import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { format, parseISO } from "date-fns";
import { ExternalLink, Crown, ArrowLeft } from "lucide-react";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Edition = {
  id: string;
  edition_date: string;
  title: string | null;
  tagline: string | null;
  closing_note: string | null;
  hero_story_id: string | null;
  metadata: {
    intro?: string;
    summary_take?: string;
    editor_letter?: string;
    edition_title?: string;
  } | null;
  status: string;
};

type Story = {
  id: string;
  title: string;
  source: string | null;
  source_url: string | null;
  company_name: string | null;
  company_slug: string | null;
  company_profile_url: string | null;
  topic: string | null;
  severity_score: number | null;
  summary: string | null;
  why_it_matters: string | null;
  verdict: string | null;
  processing_status: string | null;
};

const TOPIC_LABEL: Record<string, string> = {
  labor_policy: "Labor policy",
  layoffs: "Layoffs",
  corporate_accountability: "Accountability",
  future_of_work_ai: "AI & work",
  power_intelligence: "Power",
};

function severityLabel(s: number | null): { label: string; color: string } {
  if (s == null) return { label: "Signal", color: "#64748b" };
  if (s >= 95) return { label: "Breaking", color: "#dc2626" };
  if (s >= 85) return { label: "Critical", color: "#ea580c" };
  if (s >= 70) return { label: "High", color: "#d97706" };
  if (s >= 50) return { label: "Medium", color: "#475569" };
  return { label: "Low", color: "#94a3b8" };
}

function cleanTagline(t: string | null | undefined): string {
  const fallback = "Every company runs a background check on you. Who's running one on them?";
  if (!t) return fallback;
  return t.replace(/\s—\s/g, ". ").replace(/\s–\s/g, ". ");
}

/**
 * Render inline markdown links [text](url) in a paragraph.
 * Kept intentionally minimal — no full markdown parser dep required.
 */
function InlineMarkdown({ text }: { text: string }) {
  const parts: Array<string | { text: string; url: string }> = [];
  const re = /\[([^\]]+)\]\((https?:[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ text: m[1], url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline hover:text-blue-900 break-words"
          >
            {p.text}
          </a>
        )
      )}
    </>
  );
}

function useEdition(editionDate: string) {
  return useQuery({
    queryKey: ["newsletter-edition", editionDate],
    queryFn: async () => {
      const { data: edition, error: edErr } = await (supabase as any)
        .from("newsletter_editions")
        .select(
          "id, edition_date, title, tagline, closing_note, hero_story_id, metadata, status"
        )
        .eq("edition_date", editionDate)
        .eq("status", "published")
        .maybeSingle();
      if (edErr) throw edErr;
      if (!edition) return { edition: null as Edition | null, stories: [] as Story[] };

      const { data: stories, error: stErr } = await (supabase as any)
        .from("newsletter_stories")
        .select(
          "id, title, source, source_url, company_name, company_slug, company_profile_url, topic, severity_score, summary, why_it_matters, verdict, processing_status"
        )
        .eq("edition_id", edition.id)
        .in("processing_status", ["approved", "published"])
        .order("severity_score", { ascending: false, nullsFirst: false });
      if (stErr) throw stErr;
      return { edition: edition as Edition, stories: (stories ?? []) as Story[] };
    },
    staleTime: 300_000,
  });
}

function StoryCard({ story, isHero }: { story: Story; isHero: boolean }) {
  const sev = severityLabel(story.severity_score);
  const topic = story.topic ? TOPIC_LABEL[story.topic] ?? story.topic : null;
  return (
    <article
      className={`border rounded-lg p-6 mb-6 bg-white ${
        isHero ? "border-amber-400 shadow-md ring-1 ring-amber-100" : "border-slate-200"
      }`}
    >
      {isHero && (
        <div className="flex items-center gap-2 mb-3 text-amber-700 font-mono text-[11px] uppercase tracking-widest">
          <Crown className="w-3.5 h-3.5" /> Top signal
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.15em] font-mono">
        <span style={{ color: sev.color }}>{sev.label}</span>
        {topic && <span className="text-slate-500">· {topic}</span>}
        {story.source && <span className="text-slate-500">· {story.source}</span>}
      </div>
      <h2 className={`font-serif ${isHero ? "text-2xl" : "text-xl"} font-bold text-slate-900 mb-3 leading-tight`}>
        {story.title}
      </h2>
      {story.summary && (
        <p className="text-slate-700 leading-relaxed mb-4">
          <InlineMarkdown text={story.summary} />
        </p>
      )}
      {story.why_it_matters && (
        <div className="mb-4">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono mb-1">
            Why it matters if you are applying
          </div>
          <p className="text-slate-700 leading-relaxed">
            <InlineMarkdown text={story.why_it_matters} />
          </p>
        </div>
      )}
      {story.verdict && (
        <div className="mb-4 border-l-4 border-amber-500 pl-4 py-1 bg-amber-50/40">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-800 font-mono mb-1 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Verdict
          </div>
          <p className="text-slate-800 leading-relaxed">
            <InlineMarkdown text={story.verdict} />
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 text-sm">
        {story.source_url && (
          <a
            href={story.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900"
          >
            Read source <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {story.company_profile_url && story.company_name && (
          <Link
            to={story.company_profile_url.replace(/^https?:\/\/[^/]+/, "")}
            className="text-slate-600 hover:text-slate-900"
          >
            {story.company_name} profile →
          </Link>
        )}
      </div>
    </article>
  );
}

export default function NewsletterEdition() {
  const { editionDate = "" } = useParams<{ editionDate: string }>();
  const validDate = DATE_RE.test(editionDate);
  const { data, isLoading, error } = useEdition(validDate ? editionDate : "");

  usePageSEO({
    title: data?.edition
      ? `${data.edition.title ?? "The Work Signal"} · ${format(
          parseISO(data.edition.edition_date),
          "MMMM d, yyyy"
        )}`
      : "The Work Signal",
    description:
      data?.edition?.metadata?.intro?.slice(0, 160) ??
      "The Work Signal · daily labor and work-news briefing.",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [editionDate]);

  if (!validDate) return <Navigate to="/newsletter" replace />;
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-slate-500">Loading edition…</p>
      </div>
    );
  }
  if (error || !data?.edition) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/newsletter" className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to newsletter
        </Link>
        <h1 className="font-serif text-3xl font-bold text-slate-900 mb-3">Edition not found</h1>
        <p className="text-slate-600">
          No published edition on record for {editionDate}. Check{" "}
          <Link to="/newsletter" className="text-blue-700 underline">
            the archive
          </Link>
          .
        </p>
      </div>
    );
  }

  const { edition, stories } = data;
  const heroIdx = edition.hero_story_id
    ? stories.findIndex((s) => s.id === edition.hero_story_id)
    : -1;
  const hero = heroIdx >= 0 ? stories[heroIdx] : stories[0] ?? null;
  const rest = stories.filter((s) => s.id !== hero?.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        to="/newsletter"
        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> All editions
      </Link>

      <header className="mb-8 pb-8 border-b border-slate-200">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 font-mono mb-2">
          {format(parseISO(edition.edition_date), "EEEE · MMMM d, yyyy")}
        </div>
        <h1 className="font-serif text-4xl font-bold text-slate-900 mb-4 leading-tight">
          {edition.title ?? "The Work Signal · Morning Briefing"}
        </h1>
        {edition.metadata?.editor_letter && (
          <div className="bg-slate-50 border-l-4 border-slate-400 p-4 mb-6 text-slate-700 leading-relaxed">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono mb-2">
              From the editor
            </div>
            <InlineMarkdown text={edition.metadata.editor_letter} />
          </div>
        )}
        {edition.metadata?.intro && (
          <p className="text-lg text-slate-700 leading-relaxed">
            <InlineMarkdown text={edition.metadata.intro} />
          </p>
        )}
      </header>

      {hero && <StoryCard story={hero} isHero />}
      {rest.map((s) => (
        <StoryCard key={s.id} story={s} isHero={false} />
      ))}

      {(edition.closing_note || edition.metadata?.summary_take) && (
        <section className="mt-10 pt-8 border-t border-slate-200">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono mb-3">
            Summary
          </div>
          <p className="text-slate-700 leading-relaxed">
            <InlineMarkdown text={edition.closing_note ?? edition.metadata?.summary_take ?? ""} />
          </p>
        </section>
      )}

      <p className="mt-12 italic text-slate-500 text-center">
        {cleanTagline(edition.tagline)}
      </p>
    </div>
  );
}
