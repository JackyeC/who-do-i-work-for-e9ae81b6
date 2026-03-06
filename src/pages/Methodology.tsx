import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Methodology() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Methodology</h1>
          <p className="text-muted-foreground mb-10">
            How we collect, classify, and present data — and what our limitations are.
          </p>

          <div className="space-y-10">
            {/* Data Sources */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Data Sources</h2>
              <div className="space-y-3">
                {[
                  { name: "Federal Election Commission (FEC)", desc: "Official source for federal campaign contributions, PAC filings, and individual donor records." },
                  { name: "OpenSecrets.org", desc: "Aggregated data linking PACs, donors, and candidates. Used for cross-referencing and industry-level analysis." },
                  { name: "Lobbying Disclosure Act filings", desc: "Federal lobbying registrations and quarterly spending reports filed with the Senate and House." },
                  { name: "Corporate filings & tax records", desc: "SEC filings, 990 nonprofit tax returns, and state corporate registrations." },
                  { name: "Civil rights watchdog reports", desc: "SPLC, ADL, and other organizations that track extremist affiliations and designations." },
                  { name: "Public reporting", desc: "Investigative journalism from ProPublica, Reuters, AP, and other outlets." },
                ].map((source) => (
                  <Card key={source.name}>
                    <CardContent className="p-4">
                      <div className="font-medium text-foreground text-sm">{source.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{source.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* What Counts as Support */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">What Counts as "Support"</h2>
              <p className="text-sm text-muted-foreground mb-4">
                We separate types of financial and organizational connections because not all support is the same.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-foreground">Type</th>
                      <th className="text-left py-2 font-medium text-foreground">What It Means</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-foreground">Corporate PAC</td><td className="py-2">Company-organized political action committee makes direct contributions to candidates.</td></tr>
                    <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-foreground">Executive Personal</td><td className="py-2">Individual executives donate their own money. This does not represent official corporate policy.</td></tr>
                    <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-foreground">Lobbying</td><td className="py-2">Corporate spending to directly influence legislation, regulation, or government procurement.</td></tr>
                    <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-foreground">Trade Association</td><td className="py-2">Membership fees fund industry groups that lobby and advocate on behalf of members.</td></tr>
                    <tr className="border-b border-border"><td className="py-2 pr-4 font-medium text-foreground">Foundation Grant</td><td className="py-2">Corporate or family foundations provide grants to organizations with political agendas.</td></tr>
                    <tr><td className="py-2 pr-4 font-medium text-foreground">Board/Amicus</td><td className="py-2">Board service, legal briefs (amicus), or advisory roles connecting leadership to advocacy organizations.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Confidence Ratings */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Confidence Ratings</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Every claim is labeled with a confidence level so you know how solid the evidence is.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-civic-green border-civic-green/30 shrink-0 mt-0.5">Direct</Badge>
                  <p className="text-sm text-muted-foreground">Supported by official filings, public records, or direct disclosure. Highest reliability.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-civic-yellow border-civic-yellow/30 shrink-0 mt-0.5">Inferred</Badge>
                  <p className="text-sm text-muted-foreground">Reasonable conclusion based on multiple indirect sources — e.g., trade association membership + that association's lobbying positions.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-civic-red border-civic-red/30 shrink-0 mt-0.5">Unverified</Badge>
                  <p className="text-sm text-muted-foreground">Reported by credible sources but not yet confirmed through official records. Included for transparency, flagged clearly.</p>
                </div>
              </div>
            </section>

            {/* Civic Footprint Score */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">The Civic Footprint Score</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The Civic Footprint score (0–100) measures how <strong>concentrated</strong> a company's political influence is — 
                not how "good" or "bad" they are. A higher score means spending and affiliations are heavily concentrated 
                in one political direction. A lower score means influence is either broadly distributed or minimal.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This is not a moral judgment. It is a transparency metric. Two companies with the same score may support 
                opposite political directions. The score tells you about concentration, not alignment.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3"><Badge className="bg-civic-green/10 text-civic-green border border-civic-green/20">0–39</Badge><span className="text-sm text-muted-foreground">Broad / Low Influence</span></div>
                <div className="flex items-center gap-3"><Badge className="bg-civic-yellow/10 text-civic-yellow border border-civic-yellow/20">40–69</Badge><span className="text-sm text-muted-foreground">Mixed Influence</span></div>
                <div className="flex items-center gap-3"><Badge className="bg-civic-red/10 text-civic-red border border-civic-red/20">70–100</Badge><span className="text-sm text-muted-foreground">High Concentration</span></div>
              </div>
            </section>

            {/* Update Cadence */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Update Frequency</h2>
              <p className="text-sm text-muted-foreground">
                Company profiles are reviewed at least quarterly and after major FEC filing deadlines. 
                Each profile displays its "Last Reviewed" date and confidence rating. 
                Breaking news or significant events may trigger out-of-cycle updates.
              </p>
            </section>

            {/* Corrections */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">Corrections &amp; Disputes</h2>
              <p className="text-sm text-muted-foreground mb-4">
                We take accuracy seriously. If you believe information on CivicLens is incorrect, incomplete, 
                or misleading, we want to hear from you.
              </p>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-foreground mb-2">To request a correction:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Email <a href="mailto:corrections@civiclens.org" className="text-primary hover:underline">corrections@civiclens.org</a> with the company name and specific claim.</li>
                    <li>Include source material or documentation supporting your correction.</li>
                    <li>We review all submissions and update profiles within 7 business days.</li>
                    <li>Corrections are noted in the profile's revision history.</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Disclaimer */}
            <section className="border-t border-border pt-8">
              <p className="text-xs text-muted-foreground">
                CivicLens helps people make informed work and spending decisions using publicly available data 
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
