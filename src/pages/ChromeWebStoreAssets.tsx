/**
 * Chrome Web Store listing assets — NOT a user-facing page.
 * Renders promo tile and screenshots for store submission.
 * Access at /store-assets (not linked from nav).
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Shield, Scale, Landmark, TrendingDown, ExternalLink } from "lucide-react";

export default function ChromeWebStoreAssets() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-16">
      <p className="text-xs text-muted-foreground font-mono">
        Chrome Web Store listing assets — screenshot these at the sizes noted.
      </p>

      {/* ─── Small Promo Tile (440x280) ─── */}
      <section>
        <p className="text-xs text-muted-foreground mb-2 font-mono">Small Promo Tile — 440x280px</p>
        <div
          className="relative overflow-hidden rounded-xl"
          style={{ width: 440, height: 280, background: "linear-gradient(135deg, #0A0A0E 0%, #1A1A2E 100%)" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="text-4xl font-black text-white mb-1">
              W<span className="text-[#F0C040]">?</span>
            </div>
            <h2 className="text-xl font-bold text-[#F0EBE0] mb-2">
              Who Do I Work For?
            </h2>
            <p className="text-sm text-[#F0EBE0]/70 mb-4 leading-snug">
              Career intelligence at the moment of decision.<br />
              See signal scores, notable patterns, and receipts — right on the job page.
            </p>
            <div className="flex gap-2">
              <Badge className="bg-[#F0C040]/20 text-[#F0C040] border-[#F0C040]/30 text-xs">
                FEC Data
              </Badge>
              <Badge className="bg-[#F0C040]/20 text-[#F0C040] border-[#F0C040]/30 text-xs">
                SEC Filings
              </Badge>
              <Badge className="bg-[#F0C040]/20 text-[#F0C040] border-[#F0C040]/30 text-xs">
                WARN Act
              </Badge>
            </div>
          </div>
          {/* Gold accent line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F0C040]" />
        </div>
      </section>

      {/* ─── Screenshot 1: Side panel with integrity score (1280x800) ─── */}
      <section>
        <p className="text-xs text-muted-foreground mb-2 font-mono">Screenshot 1 — 1280x800 (Side panel with score)</p>
        <div
          className="relative overflow-hidden rounded-xl border border-border"
          style={{ width: 1280, height: 800, background: "#0A0A0E" }}
        >
          <div className="flex h-full">
            {/* Mock job page (left side) */}
            <div className="flex-1 bg-white p-8">
              <div className="max-w-xl mx-auto">
                <div className="h-4 w-24 bg-blue-100 rounded mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Senior Software Engineer</h3>
                <p className="text-gray-500 mb-1">Meta · Menlo Park, CA</p>
                <p className="text-gray-400 text-sm mb-6">$185,000 - $265,000 · Full-time · Remote eligible</p>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-5/6 bg-gray-100 rounded" />
                  <div className="h-3 w-4/6 bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded" />
                </div>
                <div className="mt-6 flex gap-3">
                  <div className="h-10 w-32 bg-blue-500 rounded-lg" />
                  <div className="h-10 w-24 bg-gray-100 rounded-lg" />
                </div>
              </div>
            </div>

            {/* WDIWF Side panel (right side) */}
            <div className="w-[380px] bg-[#1A1A1A] p-5 flex flex-col gap-5 border-l border-[#333]">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A0A0E] flex items-center justify-center">
                  <span className="text-lg font-black text-white">W<span className="text-[#F0C040]">?</span></span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F0EBE0]">Meta</h4>
                  <p className="text-xs text-[#F0EBE0]/50">linkedin.com · high confidence</p>
                </div>
              </div>

              {/* Score ring */}
              <div className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
                  style={{ background: "conic-gradient(#EF4444 0% 72%, #333 72% 100%)" }}>
                  <div className="w-24 h-24 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#EF4444]">72</span>
                  </div>
                </div>
                <p className="text-xs text-[#F0EBE0]/60 mt-2 font-mono">Integrity Score · Preliminary</p>
                <p className="text-xs text-[#F0EBE0]/40 mt-1">Higher = more concern</p>
              </div>

              {/* Pillars */}
              <div className="space-y-2.5">
                {[
                  { icon: Scale, label: "Integrity Gap", value: 78, color: "#F0C040" },
                  { icon: TrendingDown, label: "Labor Impact", value: 65, color: "#EF4444" },
                  { icon: Shield, label: "Safety Alert", value: 42, color: "#22C55E" },
                  { icon: Landmark, label: "Connected Dots", value: 81, color: "#F97316" },
                ].map((p) => (
                  <div key={p.label} className="flex items-center gap-2.5">
                    <p.icon className="w-3.5 h-3.5 shrink-0" style={{ color: p.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[#F0EBE0]/70">{p.label}</span>
                        <span className="font-mono" style={{ color: p.color }}>{p.value}</span>
                      </div>
                      <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.value}%`, background: p.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flags */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-[#F0EBE0]/80 uppercase tracking-wider">Top Flags</h5>
                <div className="p-2.5 rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/5">
                  <Badge className="bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30 text-[10px] mb-1">Labor Impact</Badge>
                  <p className="text-xs text-[#F0EBE0]/70">DEI team dissolved Jan 2025 · 155 WARN filings in 2024</p>
                </div>
                <div className="p-2.5 rounded-lg border border-[#F0C040]/20 bg-[#F0C040]/5">
                  <Badge className="bg-[#F0C040]/20 text-[#F0C040] border-[#F0C040]/30 text-[10px] mb-1">Integrity Gap</Badge>
                  <p className="text-xs text-[#F0EBE0]/70">PAC: $341K · 57% Republican allocation · Values claim mismatch</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-auto space-y-2">
                <a className="block w-full py-2.5 rounded-lg bg-[#F0C040] text-[#0A0A0E] text-sm font-bold text-center">
                  View Full Dossier →
                </a>
                <a className="block w-full py-2 rounded-lg border border-[#F0C040]/30 text-[#F0C040] text-xs font-medium text-center">
                  Read the Receipts →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Screenshot 2: Receipts page with spice meters (1280x800) ─── */}
      <section>
        <p className="text-xs text-muted-foreground mb-2 font-mono">Screenshot 2 — 1280x800 (Receipts with spice + drama)</p>
        <div
          className="relative overflow-hidden rounded-xl border border-border"
          style={{ width: 1280, height: 800, background: "#0A0A0E" }}
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-[#F0C040] font-mono text-sm tracking-[0.2em] uppercase mb-2">The Receipts</p>
              <h2 className="text-3xl font-bold text-[#F0EBE0]">Follow the money. Find the truth.</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { name: "Meta", spice: 5, drama: 94, signal: "DEI dissolved + 155 WARN filings", sector: "Big Tech" },
                { name: "Amazon", spice: 5, drama: 91, signal: "14K HR cuts + 4,085 WARN notices", sector: "Big Tech" },
                { name: "AT&T", spice: 5, drama: 88, signal: "Publicly declared DEI doesn't exist", sector: "Telecom" },
              ].map((c, i) => (
                <Card key={c.name} className="bg-[#1A1A1A] border-[#333]">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[#333] font-mono">{i + 1}</span>
                      <div>
                        <span className="text-lg font-bold text-[#F0EBE0]">{c.name}</span>
                        <p className="text-xs text-[#F0EBE0]/50">{c.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Flame
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= c.spice ? "text-destructive" : "text-[#333]"}`}
                          fill={n <= c.spice ? "currentColor" : "none"}
                        />
                      ))}
                      <span className="text-xs font-mono text-destructive ml-1">Five Alarm</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-[#F0EBE0]/40 mb-1">
                        <span>Drama Score</span>
                      </div>
                      <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-destructive" style={{ width: `${c.drama}%` }} />
                      </div>
                      <span className="text-xs font-mono text-[#F0EBE0]/40 float-right mt-0.5">{c.drama}</span>
                    </div>
                    <div className="bg-[#0A0A0E] rounded-lg p-2.5 border border-[#333]/50">
                      <p className="text-xs text-[#F0EBE0]/80">{c.signal}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-[10px]">Gov (3)</Badge>
                      <Badge className="bg-[#F0C040]/10 text-[#F0C040] border-[#F0C040]/20 text-[10px]">Watchdog (2)</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Store listing text ─── */}
      <section className="max-w-2xl">
        <p className="text-xs text-muted-foreground mb-2 font-mono">Store listing copy (paste into Chrome Dev Console)</p>
        <Card className="bg-card">
          <CardContent className="p-6 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-1">Short description (132 chars):</p>
              <p className="text-muted-foreground font-mono text-xs bg-muted/30 p-2 rounded">
                Career intelligence at the moment of decision. See integrity scores, political spending, and labor impact for any employer.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Detailed description:</p>
              <pre className="text-muted-foreground font-mono text-xs bg-muted/30 p-3 rounded whitespace-pre-wrap leading-relaxed">
{`WDIWF — Who Do I Work For? gives you employer intelligence right when you need it: on the job page.

WHAT IT DOES
When you browse job listings on LinkedIn, Indeed, Greenhouse, Lever, Workday, and 6 more platforms, WDIWF automatically detects the employer and shows you:

- Integrity Score (0-100) based on public records
- Four-pillar analysis: Integrity Gap, Labor Impact, Safety Alert, Connected Dots
- Top red flags from FEC filings, WARN Act data, SEC EDGAR, and court records
- Link to full company dossier and "The Receipts" investigative reports

For any other career page, click the extension icon to scan.

DATA SOURCES
All data comes from verified public records:
- FEC/OpenFEC (political contributions)
- SEC EDGAR (insider trading, financial filings)
- WARN Act (layoff notifications)
- Senate LDA (lobbying disclosures)
- USAspending.gov (federal contracts)
- CourtListener/PACER (court records)
- OpenSecrets, LittleSis, SPLC, ADL (watchdog organizations)

NO TRACKING
We do not track your browsing history. The extension only activates on job board pages or when you click the icon. We do not sell data.

Built by Jackye Clayton — giving workers the intelligence they deserve.

https://wdiwf.jackyeclayton.com`}
              </pre>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Category:</p>
              <p className="text-muted-foreground">Productivity</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Privacy policy URL:</p>
              <p className="text-muted-foreground font-mono text-xs">https://wdiwf.jackyeclayton.com/privacy</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Single purpose justification:</p>
              <p className="text-muted-foreground font-mono text-xs bg-muted/30 p-2 rounded">
                This extension provides employer transparency data (integrity scores, political spending, labor impact) from public government records when users browse job listings. It helps job seekers make informed career decisions by surfacing verified public data about potential employers.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Host permission justification (for Supabase):</p>
              <p className="text-muted-foreground font-mono text-xs bg-muted/30 p-2 rounded">
                The extension queries our Supabase backend database to retrieve company integrity data, political spending records, and labor impact signals. This is our own first-party API — the extension cannot function without it.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
