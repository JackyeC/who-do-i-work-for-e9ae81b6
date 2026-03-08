import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Methodology() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-display text-3xl md:text-4xl text-foreground mb-4">Methodology</h1>
          <p className="text-body-lg text-muted-foreground mb-14 leading-relaxed">
            How we collect, classify, and present data — and what our limitations are.
          </p>

          <div className="space-y-14">
            {/* Data Sources */}
            <section>
              <h2 className="text-title text-foreground mb-5">Data Sources</h2>
              <div className="space-y-3">
                {[
                  { name: "Federal Election Commission (FEC)", desc: "Official source for federal campaign contributions, PAC filings, and individual donor records via the OpenFEC API." },
                  { name: "USASpending.gov", desc: "Federal contracts, grants, subsidies, and procurement awards from the official government spending database." },
                  { name: "Senate Lobbying Disclosure Act (LDA)", desc: "Federal lobbying registrations and quarterly spending reports filed with the U.S. Senate." },
                  { name: "SEC EDGAR", desc: "Public company filings, executive compensation disclosures, and financial reports from the SEC." },
                  { name: "OpenCorporates", desc: "Global corporate registry data for company structure, officers, directors, and jurisdictions." },
                  { name: "DOL Enforcement Data", desc: "OSHA inspections and Wage & Hour Division enforcement records from the Department of Labor." },
                  { name: "Corporate filings & tax records", desc: "990 nonprofit tax returns and state corporate registrations." },
                  { name: "Civil rights watchdog reports", desc: "SPLC, ADL, and other organizations that track extremist affiliations and designations." },
                  { name: "Public reporting", desc: "Investigative journalism from ProPublica, Reuters, AP, and other outlets." },
                ].map((source) => (
                  <Card key={source.name}>
                    <CardContent className="p-5">
                      <div className="font-semibold text-foreground text-body mb-1">{source.name}</div>
                      <p className="text-caption text-muted-foreground leading-relaxed">{source.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* What Counts as Support */}
            <section>
              <h2 className="text-title text-foreground mb-5">What Counts as "Support"</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                We separate types of financial and organizational connections because not all support is the same.
              </p>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60">
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">Type</th>
                          <th className="text-left py-3.5 px-5 font-semibold text-foreground text-caption uppercase tracking-wider">What It Means</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {[
                          ["Corporate PAC", "Company-organized political action committee makes direct contributions to candidates."],
                          ["Executive Personal", "Individual executives donate their own money. This does not represent official corporate policy."],
                          ["Lobbying", "Corporate spending to directly influence legislation, regulation, or government procurement."],
                          ["Trade Association", "Membership fees fund industry groups that lobby and advocate on behalf of members."],
                          ["Foundation Grant", "Corporate or family foundations provide grants to organizations with political agendas."],
                          ["Board/Amicus", "Board service, legal briefs (amicus), or advisory roles connecting leadership to advocacy organizations."],
                        ].map(([type, desc], i, arr) => (
                          <tr key={type} className={i < arr.length - 1 ? "border-b border-border/40" : ""}>
                            <td className="py-3 px-5 font-medium text-foreground whitespace-nowrap">{type}</td>
                            <td className="py-3 px-5 leading-relaxed">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Confidence Ratings */}
            <section>
              <h2 className="text-title text-foreground mb-5">Confidence Ratings</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                Every claim is labeled with a confidence level so you know how solid the evidence is.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Direct", color: "text-civic-green border-civic-green/30 bg-civic-green/8", desc: "Supported by official filings, public records, or direct disclosure. Highest reliability." },
                  { label: "Inferred", color: "text-civic-yellow border-civic-yellow/30 bg-civic-yellow/8", desc: "Reasonable conclusion based on multiple indirect sources — e.g., trade association membership + that association's lobbying positions." },
                  { label: "Unverified", color: "text-civic-red border-civic-red/30 bg-civic-red/8", desc: "Reported by credible sources but not yet confirmed through official records. Included for transparency, flagged clearly." },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60">
                    <Badge variant="outline" className={`shrink-0 mt-0.5 ${item.color}`}>{item.label}</Badge>
                    <p className="text-body text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Civic Footprint Score */}
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
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-civic-green/8 border border-civic-green/20">
                  <Badge className="bg-civic-green/15 text-civic-green border border-civic-green/20">0–39</Badge>
                  <span className="text-caption text-muted-foreground">Broad / Low Influence</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-civic-yellow/8 border border-civic-yellow/20">
                  <Badge className="bg-civic-yellow/15 text-civic-yellow border border-civic-yellow/20">40–69</Badge>
                  <span className="text-caption text-muted-foreground">Mixed Influence</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-civic-red/8 border border-civic-red/20">
                  <Badge className="bg-civic-red/15 text-civic-red border border-civic-red/20">70–100</Badge>
                  <span className="text-caption text-muted-foreground">High Concentration</span>
                </div>
              </div>
            </section>

            {/* Update Cadence */}
            <section>
              <h2 className="text-title text-foreground mb-5">Update Frequency</h2>
              <p className="text-body text-muted-foreground leading-relaxed">
                Company profiles are reviewed at least quarterly and after major FEC filing deadlines. 
                Each profile displays its "Last Reviewed" date and confidence rating. 
                Breaking news or significant events may trigger out-of-cycle updates.
              </p>
            </section>

            {/* Corrections */}
            <section>
              <h2 className="text-title text-foreground mb-5">Corrections &amp; Disputes</h2>
              <p className="text-body text-muted-foreground mb-5 leading-relaxed">
                We take accuracy seriously. If you believe information on Offer Check is incorrect, incomplete, 
                or misleading, we want to hear from you.
              </p>
              <Card>
                <CardContent className="p-6">
                  <p className="text-body text-foreground font-medium mb-3">To request a correction:</p>
                  <ul className="text-body text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                    <li>Email <a href="mailto:corrections@civiclens.org" className="text-primary hover:underline">corrections@civiclens.org</a> with the company name and specific claim.</li>
                    <li>Include source material or documentation supporting your correction.</li>
                    <li>We review all submissions and update profiles within 7 business days.</li>
                    <li>Corrections are noted in the profile's revision history.</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Disclaimer */}
            <section className="border-t border-border/60 pt-10">
              <p className="text-caption text-muted-foreground leading-relaxed">
                Offer Check helps people make informed work and spending decisions using publicly available data 
                about political and civic influence. We do not make endorsements, moral judgments, or recommendations.
                All data is sourced from public records and clearly attributed. Individual executive donations 
                reflect personal giving and do not necessarily represent corporate policy.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
