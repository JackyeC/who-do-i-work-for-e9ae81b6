import { Helmet } from "react-helmet-async";
import { usePageSEO } from "@/hooks/use-page-seo";
import {
  Shield,
  CheckCircle2,
  User,
  Users,
  TrendingUp,
  Star,
  MessageSquare,
  FileText,
  ArrowRight,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
} from "lucide-react";

const amber = "#f0c040";
const cream = "#f0ebe0";
const muted = "#b8b4a8";
const dimmed = "#7a7590";
const cardBg = "rgba(255,255,255,0.025)";
const cardBorder = "1px solid rgba(255,255,255,0.08)";
const accentBg = "rgba(240,192,64,0.10)";
const accentBorder = "1px solid rgba(240,192,64,0.20)";

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-6" style={{ background: cardBg, border: cardBorder }}>
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accentBg }}
        >
          {icon}
        </div>
        <h3 className="font-sans font-bold" style={{ fontSize: 16, color: cream }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Chip({ children, check }: { children: string; check?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: accentBg, color: amber, border: accentBorder }}
    >
      {check && <CheckCircle2 className="w-3 h-3" />}
      {children}
    </span>
  );
}

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span style={{ color: dimmed }}>{icon}</span>
      <span className="text-sm" style={{ color: muted }}>
        {children}
      </span>
    </div>
  );
}

export default function SampleDossier() {
  usePageSEO({
    title: "Sample Application Dossier — WDIWF",
    description:
      "See what candidates receive when the WDIWF Job Search Agent applies on their behalf. Company intel, values match, and interview prep in one dossier.",
    path: "/dossier",
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0e" }}>
      <Helmet>
        <title>Sample Application Dossier — WDIWF</title>
      </Helmet>

      {/* Grain */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0.04 }}>
        <filter id="dossier-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#dossier-grain)" />
      </svg>

      <div className="relative z-[1] flex-1 flex flex-col items-center px-6 py-16 sm:py-20">
        {/* Header */}
        <p className="text-xs uppercase tracking-[3px] font-semibold mb-3" style={{ color: amber }}>
          Sample Dossier
        </p>
        <h1
          className="font-sans text-center leading-[1.08] mb-2"
          style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 800, letterSpacing: "-2px", color: cream }}
        >
          Your Application Dossier
        </h1>
        <p className="text-center mb-10" style={{ fontSize: 15, color: dimmed }}>
          Prepared by your WDIWF Job Search Agent
        </p>

        {/* Dossier document */}
        <div className="w-full max-w-[640px] space-y-5">
          {/* ── Application header card ── */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(240,192,64,0.04)", border: accentBorder }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-sans font-bold" style={{ fontSize: 20, color: cream, letterSpacing: "-0.5px" }}>
                  Meridian Health Tech
                </h2>
                <p className="text-sm mt-0.5" style={{ color: muted }}>
                  Senior Product Manager, Patient Experience
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: accentBg, color: amber, border: accentBorder }}
              >
                <Shield className="w-3.5 h-3.5" />
                84/100 Integrity
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <MetaRow icon={<Briefcase className="w-3.5 h-3.5" />}>Senior Product Manager</MetaRow>
              <MetaRow icon={<MapPin className="w-3.5 h-3.5" />}>Remote-first</MetaRow>
              <MetaRow icon={<DollarSign className="w-3.5 h-3.5" />}>$145K – $165K</MetaRow>
              <MetaRow icon={<Calendar className="w-3.5 h-3.5" />}>Applied March 19, 2026</MetaRow>
            </div>
          </div>

          {/* ── Why we applied ── */}
          <SectionCard icon={<CheckCircle2 className="w-4.5 h-4.5" style={{ color: amber }} />} title="Why We Applied For You">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: amber }} />
                <span className="text-sm" style={{ color: cream }}>
                  Integrity Score: <strong>84/100</strong>{" "}
                  <span className="text-xs ml-1" style={{ color: "#4ade80" }}>Low Risk</span>
                </span>
              </div>
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: dimmed }}>Values match</p>
                <div className="flex flex-wrap gap-2">
                  <Chip check>Mission-driven</Chip>
                  <Chip check>Work-life balance</Chip>
                  <Chip check>Growth</Chip>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: amber }} />
                <span className="text-sm" style={{ color: cream }}>
                  $145K – $165K <span style={{ color: dimmed }}>(within your target)</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: amber }} />
                <span className="text-sm" style={{ color: cream }}>Remote-first company ✓</span>
              </div>
            </div>
          </SectionCard>

          {/* ── Who's there ── */}
          <SectionCard icon={<Users className="w-4.5 h-4.5" style={{ color: amber }} />} title="Who's There">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-0.5 shrink-0" style={{ color: amber }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: cream }}>Jordan Kim</p>
                  <p className="text-xs" style={{ color: dimmed }}>VP of Product · 8 years at company</p>
                </div>
              </div>
              <BulletItem>Team size: ~12 person product org</BulletItem>
              <BulletItem>Recent news: Series B funded Jan 2026, growing 40% YoY</BulletItem>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 shrink-0" style={{ color: amber }} />
                <span className="text-sm" style={{ color: cream }}>
                  Glassdoor: <strong>4.3/5</strong>{" "}
                  <TrendingUp className="w-3 h-3 inline" style={{ color: "#4ade80" }} />{" "}
                  <span className="text-xs" style={{ color: "#4ade80" }}>trending up over 12 months</span>
                </span>
              </div>
            </div>
          </SectionCard>

          {/* ── How to prepare ── */}
          <SectionCard icon={<FileText className="w-4.5 h-4.5" style={{ color: amber }} />} title="How to Prepare">
            <ul className="space-y-2.5">
              <BulletItem>They value "patient-first" framing in interviews</BulletItem>
              <BulletItem>Expect a product case study in round 2</BulletItem>
              <BulletItem>Glassdoor reports panel interviews with Engineering + Design</BulletItem>
            </ul>
          </SectionCard>

          {/* ── Questions to ask ── */}
          <SectionCard icon={<MessageSquare className="w-4.5 h-4.5" style={{ color: amber }} />} title="Questions to Ask Them">
            <ol className="space-y-3">
              {[
                "How does the product team interface with clinical staff?",
                "What does success look like in the first 90 days?",
                "How has the culture changed since the Series B?",
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{ background: accentBg, color: amber }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: cream }}>
                    "{q}"
                  </span>
                </li>
              ))}
            </ol>
          </SectionCard>

          {/* ── Cover letter ── */}
          <SectionCard icon={<FileText className="w-4.5 h-4.5" style={{ color: amber }} />} title="Your Cover Letter">
            <div
              className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}
            >
              <p className="text-sm italic leading-relaxed" style={{ color: dimmed }}>
                [Personalized cover letter generated for this role]
              </p>
            </div>
          </SectionCard>

          {/* ── CTA ── */}
          <div className="pt-6 text-center">
            <a
              href="/hire"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: amber, color: "#0a0a0e" }}
            >
              Get Your Own Dossier
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-xs mt-3" style={{ color: dimmed }}>
              Sign up for early access and your agent starts working in 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: amber }} />
      <span className="text-sm leading-relaxed" style={{ color: cream }}>{children}</span>
    </div>
  );
}
