import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, ExternalLink, Calendar,
  AlertTriangle, DollarSign, Users, Flag
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlignmentBadge } from "@/components/AlignmentBadge";
import { companies, formatCurrency, getScoreLabel } from "@/data/sampleData";

export default function CompanyProfile() {
  const { id } = useParams();
  const company = companies.find((c) => c.id === id);

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Company Not Found</h1>
            <Link to="/" className="text-primary hover:underline">Go back home</Link>
          </div>
        </div>
      </div>
    );
  }

  const { label: scoreLabel } = getScoreLabel(company.alignmentScore);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Company Header */}
          <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{company.name}</h1>
              <p className="text-muted-foreground mb-3">{company.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{company.industry}</Badge>
                <Badge variant="secondary">{company.state}</Badge>
                <Badge variant="secondary">Revenue: {company.revenue}</Badge>
                <AlignmentBadge score={company.alignmentScore} />
              </div>
            </div>
          </div>

          {/* Score + Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Alignment Score
                </div>
                <div className="text-3xl font-bold text-foreground">{company.alignmentScore}/100</div>
                <p className="text-sm text-muted-foreground mt-1">{scoreLabel}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  Total PAC Spending
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {company.totalPacSpending > 0 ? formatCurrency(company.totalPacSpending) : "None"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Current election cycle</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Flag className="w-4 h-4" />
                  Flagged Candidates
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {company.candidates.filter((c) => c.flagged).length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  of {company.candidates.length} total supported
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Party Breakdown Pie */}
            {company.totalPacSpending > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PAC Spending by Party</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={company.partyBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="party"
                        >
                          {company.partyBreakdown.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    {company.partyBreakdown.map((entry) => (
                      <div key={entry.party} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.party}: {formatCurrency(entry.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Candidates */}
            {company.candidates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Candidates Supported</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {company.candidates.map((candidate) => (
                      <div
                        key={candidate.name}
                        className={`flex items-start justify-between p-3 rounded-lg border ${
                          candidate.flagged ? "border-civic-red/20 bg-civic-red/5" : "border-border"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm">{candidate.name}</span>
                            <Badge
                              variant="outline"
                              className={
                                candidate.party === "R"
                                  ? "text-civic-red border-civic-red/30"
                                  : candidate.party === "D"
                                  ? "text-civic-blue border-civic-blue/30"
                                  : "text-muted-foreground"
                              }
                            >
                              {candidate.party}
                            </Badge>
                            {candidate.flagged && (
                              <AlertTriangle className="w-3.5 h-3.5 text-civic-red" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {candidate.state}{candidate.district ? ` — ${candidate.district} District` : ""}
                          </p>
                          {candidate.flagReason && (
                            <p className="text-xs text-civic-red mt-1">{candidate.flagReason}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground shrink-0">
                          {formatCurrency(candidate.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Executive Donors */}
          {company.executives.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Executive Donors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {company.executives.map((exec) => (
                    <div key={exec.name} className="border-b border-border pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-foreground">{exec.name}</div>
                          <div className="text-sm text-muted-foreground">{exec.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{formatCurrency(exec.totalDonations)}</div>
                          <div className="text-xs text-muted-foreground">Total personal donations</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {exec.topRecipients.map((r) => (
                          <div key={r.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  r.party === "R"
                                    ? "text-civic-red border-civic-red/30 text-xs"
                                    : "text-civic-blue border-civic-blue/30 text-xs"
                                }
                              >
                                {r.party}
                              </Badge>
                              <span className="text-muted-foreground">{r.name}</span>
                            </div>
                            <span className="font-medium text-foreground">{formatCurrency(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sources */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Last updated: {company.lastUpdated}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Data sourced from FEC.gov, OpenSecrets.org, and public filings. Individual donations may reflect personal views 
                and not necessarily corporate policy. CivicLens provides public data for informational purposes only.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
