import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_LABELS, TIER_COLORS } from "@/lib/evidenceQualityScore";
import type { SourceTier } from "@/lib/evidenceQualityScore";

export default function Methodology() {
  usePageSEO({
    title: "Methodology — How We Verify Company Intelligence",
    description: "Our evidence quality framework: tiered source verification, confidence ratings, and transparent methodology for all employer intelligence data.",
    path: "/methodology",
    jsonLd: {
      "@type": "AboutPage",
      name: "Methodology — How We Verify Company Intelligence",
      description: "Tiered source verification framework using FEC filings, SEC EDGAR, BLS data, Senate lobbying disclosures, and USAspending.gov.",
      isPartOf: { "@type": "WebApplication", name: "Who Do I Work For?" },
      author: { "@type": "Person", name: "Jackye Clayton" },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-display text-3xl md:text-4xl text-foreground mb-4">How We Verify Company Intelligence</h1>
          <p className="text-body-lg text-muted-foreground mb-14 leading-relaxed">
            How we collect, classify, verify, and present data — and what our limitations are.
          </p>

          <div className="space-y-14">
            {/* ───── Source Hierarchy ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Source Hierarchy (Tiers 1–5)</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Not all sources are equal. Every claim on our platform is scored based on the authority of its source.
                Higher-tier sources carry more weight in our confidence calculations.
              </p>
              <div className="space-y-3">
                {([
                  { tier: 1 as SourceTier, examples: "SEC EDGAR, FEC/OpenFEC, LDA.gov, USAspending.gov, EPA ECHO, OSHA, NLRB, PACER/CourtListener, CFPB, BLS", desc: "Official government filings, regulatory databases, and court records. Highest reliability. These are the legal record." },
                  { tier: 2 as SourceTier, examples: "Proxy statements, investor relations pages, annual reports, ESG disclosures, corporate press releases", desc: "Information published directly by the company. Reliable for stated positions; may reflect corporate framing." },
                  { tier: 3 as SourceTier, examples: "ProPublica, Reuters, AP, investigative journalism, SPLC, ADL, HRC", desc: "High-quality secondary reporting and established watchdog organizations. Cross-checked where possible." },
                  { tier: 4 as SourceTier, examples: "People Data Labs, OpenCorporates, commercial databases", desc: "Commercial data enrichment services. Useful for workforce signals and entity resolution but treated as supplementary." },
                  { tier: 5 as SourceTier, examples: "Anonymous reviews, forums, social media, single-source mentions", desc: "Unverified or anonymous sources. Included for transparency only when clearly labeled. Never used for scoring." },
                ]).map((item) => (
                  <Card key={item.tier}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] font-mono ${TIER_COLORS[item.tier]}`}>
                          Tier {item.tier}
                        </Badge>
                        <span className="font-semibold text-foreground text-body">{TIER_LABELS[item.tier]}</span>
                      </div>
                      <p className="text-caption text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                      <p className="text-caption text-muted-foreground/70 font-mono text-[10px]">{item.examples}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ───── Evidence Quality Scoring ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Evidence Quality Scoring</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Every section on a company report displays an Evidence Quality score (0–100) computed from four factors:
              </p>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">Factor</th>
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">Weight</th>
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">How It Works</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {[
                          ["Source Tier", "1.0 → 0.1", "Government records (1.0) outweigh unverified sources (0.1)."],
                          ["Recency", "1.0 → 0.4", "Data less than 30 days old scores 1.0; over 180 days scores 0.4."],
                          ["Cross-Verification", "+10 each", "Bonus when 2+ independent sources agree on the same claim."],
                          ["Contradiction Penalty", "−15 each", "Deducted when reputable sources disagree on a claim."],
                          ["Entity Match", "Multiplier", "Higher confidence in legal entity matching increases all scores."],
                        ].map(([factor, weight, desc], i, arr) => (
                          <tr key={factor} className={i < arr.length - 1 ? "border-b border-border/40" : ""}>
                            <td className="py-3 px-5 font-medium text-foreground whitespace-nowrap">{factor}</td>
                            <td className="py-3 px-5 font-mono text-xs">{weight}</td>
                            <td className="py-3 px-5 leading-relaxed">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ───── Entity Matching ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Entity Resolution</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Matching the right legal entity is one of the most important — and most error-prone — parts of corporate intelligence.
                Our system uses multiple signals to resolve company names into verified legal entities:
              </p>
              <div className="space-y-3">
                {[
                  { method: "SEC CIK Match", desc: "For public companies, we match against SEC EDGAR's Central Index Key for exact legal entity identification." },
                  { method: "OpenCorporates Registry", desc: "Cross-reference against 140+ official corporate registries worldwide for officers, subsidiaries, and related entities." },
                  { method: "Parent/Subsidiary Chain", desc: "Map ownership chains to ensure subsidiary data rolls up correctly to the parent entity." },
                  { method: "Stock Ticker Verification", desc: "When available, ticker symbols provide an additional identity anchor." },
                ].map((item) => (
                  <div key={item.method} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <span className="text-primary font-mono text-xs mt-0.5 shrink-0">▸</span>
                    <div>
                      <span className="font-medium text-foreground text-sm">{item.method}</span>
                      <p className="text-caption text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-caption text-muted-foreground mt-4 leading-relaxed">
                Every company profile displays an "Entity Match" confidence badge showing the search name, matched legal entity,
                resolution method, and confidence percentage. This is fully transparent.
              </p>
            </section>

            {/* ───── Verification Badges ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Verification Badges</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Every claim is labeled with a verification status so you know exactly how solid the evidence is.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Cross-Verified", color: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/8", desc: "Confirmed by 2+ independent reputable sources. Highest reliability." },
                  { label: "Verified", color: "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/8", desc: "Confirmed from a primary source (official filing, regulatory database, or direct company disclosure)." },
                  { label: "Pending", color: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/8", desc: "Data found but verification is still in progress. Included for completeness, flagged clearly." },
                  { label: "Stale", color: "text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/8", desc: "Source is older than our freshness threshold. May no longer reflect current conditions." },
                  { label: "Conflict Detected", color: "text-destructive border-destructive/30 bg-destructive/8", desc: "Reputable sources disagree on this claim. Both positions are shown with evidence links." },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60">
                    <Badge variant="outline" className={`shrink-0 mt-0.5 ${item.color}`}>{item.label}</Badge>
                    <p className="text-body text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ───── Media Bias Transparency ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Media Bias Transparency</h2>
              <div className="space-y-4 text-body text-muted-foreground leading-relaxed">
                <p>
                  When news articles or commentary are cited, we display the outlet's political lean and reliability rating
                  based on publicly available classification data from AllSides, Ad Fontes Media, and Media Bias Fact Check.
                </p>
                <p>
                  <strong className="text-foreground">Important:</strong> Bias labels are only applied to journalism and opinion sources.
                  Government filings, court records, and regulatory databases are labeled "Primary Record — No perspective applied."
                </p>
                <p>
                  We also show a <strong className="text-foreground">Coverage Balance</strong> chart for each company, showing
                  the political perspective distribution of all news coverage. When over 80% of coverage comes from one perspective,
                  we flag a "Narrative Risk" indicator.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                {[
                  { label: "Left", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
                  { label: "Lean Left", color: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
                  { label: "Center", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" },
                  { label: "Lean Right", color: "bg-red-400/10 text-red-400 border-red-400/20" },
                  { label: "Right", color: "bg-red-500/10 text-red-500 border-red-500/20" },
                ].map((item) => (
                  <Badge key={item.label} variant="outline" className={`${item.color}`}>{item.label}</Badge>
                ))}
              </div>
            </section>

            {/* ───── Refresh Cadence ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Refresh Cadence</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">Data Type</th>
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">Refresh Frequency</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {[
                          ["SEC / FEC / USAspending / EPA", "Daily to weekly"],
                          ["Lobbying disclosures (LDA)", "Quarterly (aligned with filing deadlines)"],
                          ["Court records / Litigation", "Daily"],
                          ["Company IR pages / Press releases", "Weekly"],
                          ["News monitoring", "Daily"],
                          ["Commercial enrichment (workforce signals)", "Monthly"],
                          ["WARN Act layoff notices", "Daily (where state data is available)"],
                          ["OSHA / NLRB", "Weekly"],
                        ].map(([type, freq], i, arr) => (
                          <tr key={type} className={i < arr.length - 1 ? "border-b border-border/40" : ""}>
                            <td className="py-3 px-5 font-medium text-foreground">{type}</td>
                            <td className="py-3 px-5">{freq}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <p className="text-caption text-muted-foreground mt-3 leading-relaxed">
                Each profile displays its "Last Reviewed" date and confidence rating. Breaking news or significant events may trigger out-of-cycle updates.
              </p>
            </section>

            {/* ───── Civic Footprint Score ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">The Civic Footprint Score</h2>
              <div className="space-y-4 text-body text-muted-foreground leading-relaxed">
                <p>
                  The Civic Footprint score (0–100) measures how <strong className="text-foreground">concentrated</strong> a company's political influence is — 
                  not how "good" or "bad" they are. A higher score means spending and affiliations are heavily concentrated 
                  in one political direction.
                </p>
                <p>
                  This is not a moral judgment. It is a transparency metric. Two companies with the same score may support 
                  opposite political directions. The score tells you about concentration, not alignment.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[hsl(var(--civic-green))]/8 border border-[hsl(var(--civic-green))]/20">
                  <Badge className="bg-[hsl(var(--civic-green))]/15 text-[hsl(var(--civic-green))] border border-[hsl(var(--civic-green))]/20">0–39</Badge>
                  <span className="text-caption text-muted-foreground">Broad / Low Influence</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[hsl(var(--civic-yellow))]/8 border border-[hsl(var(--civic-yellow))]/20">
                  <Badge className="bg-[hsl(var(--civic-yellow))]/15 text-[hsl(var(--civic-yellow))] border border-[hsl(var(--civic-yellow))]/20">40–69</Badge>
                  <span className="text-caption text-muted-foreground">Mixed Influence</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20">
                  <Badge className="bg-destructive/15 text-destructive border border-destructive/20">70–100</Badge>
                  <span className="text-caption text-muted-foreground">High Concentration</span>
                </div>
              </div>
            </section>

            {/* ───── Known Limitations ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Known Limitations</h2>
              <div className="space-y-3">
                {[
                  "Private companies have significantly less disclosure. SEC filings, PAC data, and shareholder information may be unavailable.",
                  "WARN Act layoff data is fragmented across 50 states with no unified federal API. Coverage varies by state.",
                  "Government databases can lag. FEC filings may be 30–90 days behind actual transactions.",
                  "Subsidiary-level data sometimes reflects the parent company rather than the specific entity.",
                  "International operations and non-U.S. regulatory data have limited coverage in this version.",
                  "Labor complaint data (NLRB, OSHA) reflects filed cases, not necessarily proven violations.",
                  "Commercial enrichment sources (Tier 4) may have different update cycles than official records.",
                ].map((limitation, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <span className="text-[hsl(var(--civic-yellow))] font-mono text-xs mt-0.5 shrink-0">⚠</span>
                    <p className="text-caption text-muted-foreground leading-relaxed">{limitation}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ───── Corrections & Disputes ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Corrections &amp; Disputes</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                We take accuracy seriously. If you believe information on this platform is incorrect, incomplete, 
                or misleading, we want to hear from you.
              </p>
              <Card>
                <CardContent className="p-6">
                  <p className="text-body text-foreground font-medium mb-3">To request a correction:</p>
                  <ul className="text-body text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                    <li>Email <a href="mailto:corrections@whodoimworkfor.com" className="text-primary hover:underline">corrections@whodoimworkfor.com</a> with the company name and specific claim.</li>
                    <li>Include source material or documentation supporting your correction.</li>
                    <li>We review all submissions and update profiles within 7 business days.</li>
                    <li>Corrections are noted in the profile's revision history.</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* ───── Our Standard ───── */}
            <section>
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs font-mono uppercase tracking-wider">Our Standard</Badge>
                  </div>
                  <p className="text-body text-foreground leading-relaxed font-medium">
                    Public records only. Verified watchdog data. No partisan endorsements. We connect the dots; you make the call.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* ───── Legal Disclaimer ───── */}
            <section className="border-t border-border/60 pt-10">
              <p className="text-caption text-muted-foreground leading-relaxed">
                WDIWF reports publicly available data and does not provide character assessments, legal advice, or employment recommendations.
                All signals are sourced from public records and verified watchdog databases (SPLC, ADL, FEC, SEC, BLS, EPA, OSHA, NLRB, CourtListener). 
                Individual executive donations reflect personal giving and do not necessarily represent corporate policy.
                Users should independently verify information before making employment decisions.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
