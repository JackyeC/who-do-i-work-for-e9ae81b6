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
    <div className="flex-1">
      <div className="max-w-[900px] mx-auto px-6 lg:px-16 pt-20 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-primary mb-5">Methodology</p>
          <h1
            className="font-sans text-foreground leading-[1.08] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-1px" }}
          >
            How We Verify Company Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mb-14 leading-relaxed max-w-[54ch]">
            How we collect, classify, verify, and present data — and what our limitations are.
          </p>

          <div className="space-y-14">
            {/* ───── The Receipts Framework ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">The Receipts Framework</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Every company investigation is structured around four pillars. Together, they form a complete picture
                of what a company does — not just what it says.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    pillar: "Integrity Gap",
                    desc: "Compares a company's public values claims against their actual behavior — FEC filings, lobbying disclosures, political spending, DEI program changes, and workforce data. Absorbs what we previously tracked as 'Political Giving.'",
                    sources: "FEC/OpenFEC, LDA.gov, SEC EDGAR, company press releases, DEI reports",
                  },
                  {
                    pillar: "Labor Impact",
                    desc: "Tracks WARN Act layoffs, workforce restructuring, hiring freezes, and the human cost of corporate decisions — by state, date, and scale.",
                    sources: "WARN Act filings (state-level), BLS, SEC 8-K filings, NLRB",
                  },
                  {
                    pillar: "Safety Alert",
                    desc: "Surfaces OSHA violations, NLRB complaints, EPA enforcement actions, workplace injury rates, and regulatory penalties.",
                    sources: "OSHA, EPA ECHO, NLRB, MSHA, CFPB, CourtListener",
                  },
                  {
                    pillar: "Connected Dots",
                    desc: "Follows the money: PAC disbursements, executive donations, lobbying ties, federal contract awards, and political influence networks.",
                    sources: "FEC/OpenFEC, USAspending.gov, LDA.gov, OpenSecrets, ProPublica",
                  },
                ].map((item) => (
                  <Card key={item.pillar}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-mono">
                          {item.pillar}
                        </Badge>
                      </div>
                      <p className="text-caption text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                      <p className="text-caption text-muted-foreground/70 font-mono text-xs">Sources: {item.sources}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-caption text-muted-foreground mt-4 leading-relaxed">
                Receipts reports are free and ungated — anyone can read and share them. Our deeper intelligence tools
                (career matching, offer analysis, employer verification) require an account.
              </p>
            </section>

            {/* ───── Source Hierarchy ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Source Hierarchy (Tiers 1–5)</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Not all sources are equal. Every claim on our platform is scored based on the authority of its source.
                Higher-tier sources carry more weight in our confidence calculations.
              </p>
              <div className="space-y-3">
                {([
                  { tier: 1 as SourceTier, examples: "SEC EDGAR, FEC/OpenFEC, LDA.gov, USAspending.gov, EPA ECHO, OSHA, NLRB, PACER/CourtListener, CFPB, BLS, WARN Act, OGE Form 278, FARA, IRS Form 990, Census.gov, FRED, Data.gov", desc: "Official government filings, regulatory databases, court records, ethics disclosures, and tax filings. Highest reliability. These are the legal record." },
                  { tier: 2 as SourceTier, examples: "Proxy statements, investor relations pages, annual reports, ESG disclosures, corporate press releases, diversity reports", desc: "Information published directly by the company. Reliable for stated positions; may reflect corporate framing." },
                  { tier: 3 as SourceTier, examples: "OpenSecrets, LittleSis, ProPublica, SPLC, ADL, HRC, POGO, Revolving Door Project, LegiStorm, Bellingcat, Reuters, AP, Candid/GuideStar, PRRI, Ground News", desc: "Verified watchdog organizations, OSINT databases, and high-quality investigative reporting. Cross-checked where possible." },
                  { tier: 4 as SourceTier, examples: "OpenCorporates, People Data Labs, NNDB, Hunter.io, commercial databases, GDELT, AllSides, Media Bias/Fact Check", desc: "Commercial enrichment, media monitoring, and identity resolution services. Useful for signals and entity resolution but treated as supplementary." },
                  { tier: 5 as SourceTier, examples: "Anonymous reviews, forums, social media, single-source mentions, unverified leaks", desc: "Unverified or anonymous sources. Included for transparency only when clearly labeled. Never used for scoring." },
                ]).map((item) => (
                  <Card key={item.tier}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-xs font-mono ${TIER_COLORS[item.tier]}`}>
                          Tier {item.tier}
                        </Badge>
                        <span className="font-semibold text-foreground text-body">{TIER_LABELS[item.tier]}</span>
                      </div>
                      <p className="text-caption text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                      <p className="text-caption text-muted-foreground/70 font-mono text-xs">{item.examples}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ───── Revolving Door & Influence Intelligence ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Revolving Door &amp; Influence Intelligence</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                We track the movement of individuals between government and the private sector — the "revolving door" —
                and map influence networks using verified public data. Facts over feelings.
              </p>
              <div className="space-y-3">
                {[
                  {
                    category: "Revolving Door Tracking",
                    desc: "Flags executives hired from regulatory agencies into regulated companies within 24 months of leaving office. Cross-references against lobbying registrations.",
                    sources: "OpenSecrets Revolving Door Database, Revolving Door Project, LegiStorm, POGO Brass Parachutes",
                  },
                  {
                    category: "Influence Mapping",
                    desc: "Maps interlocking directorates (people on multiple boards), family connections between business and government, and reciprocal oversight patterns.",
                    sources: "LittleSis, OpenCorporates, SEC EDGAR (Forms 3/4/5), IRS Form 990",
                  },
                  {
                    category: "Political Profit Profiles",
                    desc: "Identifies when former officials' consulting firms win contracts from their former agencies. Tracks the 'own the problem, sell the solution' pattern.",
                    sources: "USAspending.gov, LDA.gov, FARA, OGE Form 278 (financial disclosures)",
                  },
                  {
                    category: "Nepotism & Affinity Signals",
                    desc: "Flags surname clusters in leadership, shared registered agent addresses, and boards where 40%+ graduated from the same institution.",
                    sources: "OpenCorporates, SEC EDGAR, IRS Form 990, state corporate registries",
                  },
                ].map((item) => (
                  <Card key={item.category}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-mono">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-caption text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                      <p className="text-caption text-muted-foreground/70 font-mono text-xs">Sources: {item.sources}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-caption text-muted-foreground mt-4 leading-relaxed">
                A "Red Flag" is an indicator, not an accusation. These are data anomalies worth investigating —
                sometimes a fast-tracked executive is simply exceptional. WDIWF shows the pattern; you make the call.
              </p>
            </section>

            {/* ───── Extremism & Affiliation Transparency ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">Extremism &amp; Affiliation Transparency</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Using only verified, publicly documented data, we surface connections to organizations flagged by
                established civil rights watchdogs. We do not track private beliefs — only documented affiliations.
              </p>
              <div className="space-y-3">
                {[
                  {
                    method: "SPLC Extremist Files",
                    desc: "Searchable database of individuals and organizations identified by the Southern Poverty Law Center. Maps histories, hierarchies, and organizational connections.",
                  },
                  {
                    method: "ADL H.E.A.T. Map",
                    desc: "Tracks documented extremist incidents by location. If an executive was a featured speaker at a flagged event, that's verifiable public record.",
                  },
                  {
                    method: "IRS Form 990 Cross-Reference",
                    desc: "Many extremist or high-control groups are registered as 501(c)(3) or 501(c)(4) organizations. Board of Directors and key employees are public record.",
                  },
                  {
                    method: "Grantmaking Trail (Candid/GuideStar)",
                    desc: "Tracks which corporations and foundations fund specific ideological organizations. This is the company's financial footprint, not opinion.",
                  },
                  {
                    method: "PRRI American Values Atlas",
                    desc: "Localized data on White Christian Nationalism sentiment. Provides geographic context, not individual identification.",
                  },
                ].map((item) => (
                  <div key={item.method} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <span className="text-primary font-mono text-xs mt-0.5 shrink-0">&#9654;</span>
                    <div>
                      <span className="font-medium text-foreground text-sm">{item.method}</span>
                      <p className="text-caption text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Card className="mt-5 border-[hsl(var(--civic-yellow))]/30 bg-[hsl(var(--civic-yellow))]/[0.03]">
                <CardContent className="p-5">
                  <p className="text-body text-foreground font-medium mb-2">Three-Point Verification Standard</p>
                  <p className="text-caption text-muted-foreground leading-relaxed">
                    We never label someone based on a single data point. Our standard requires at least two of three:
                    (1) Direct affiliation — name appears in a 990 filing or verified membership record,
                    (2) Financial link — the individual or their company donated to a flagged organization,
                    (3) Proximity — shared board, registered agent address, or event participation with verified extremist leadership.
                    We use the term "Flagged Affiliation" rather than subjective labels. The data speaks for itself.
                  </p>
                </CardContent>
              </Card>
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
                  { label: "Left", color: "bg-civic-blue/10 text-civic-blue border-civic-blue/20" },
                  { label: "Lean Left", color: "bg-civic-blue/10 text-civic-blue border-civic-blue/20" },
                  { label: "Center", color: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20" },
                  { label: "Lean Right", color: "bg-civic-red/10 text-civic-red border-civic-red/20" },
                  { label: "Right", color: "bg-civic-red/10 text-civic-red border-civic-red/20" },
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

            {/* ───── Employer Clarity Score ───── */}
            <section>
              <h2 className="text-title text-foreground mb-5">The Employer Clarity Score</h2>
              <div className="space-y-4 text-body text-muted-foreground leading-relaxed">
                <p>
                  The Employer Clarity Score score (0–100) measures how <strong className="text-foreground">concentrated</strong> a company's political influence is — 
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
                Who Do I Work For reports publicly available data and does not provide character assessments, legal advice, or employment recommendations.
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
