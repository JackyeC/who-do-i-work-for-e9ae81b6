import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, Calendar, DollarSign, Users, Flag,
  Network, Scale, MessageSquareWarning, ExternalLink, Shield, Megaphone,
  AlertTriangle, EyeOff, RotateCcw, TrendingUp, Landmark, FileText,
  BarChart3
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CivicFootprintBadge } from "@/components/CivicFootprintBadge";
import { companies, formatCurrency, getFootprintLabel } from "@/data/sampleData";
import { cn } from "@/lib/utils";
import { InfluenceROICard } from "@/components/InfluenceROICard";
import { HypocrisyIndexCard } from "@/components/HypocrisyIndexCard";
import { PoliticalRiskCard } from "@/components/PoliticalRiskCard";
import { BenchmarkCard } from "@/components/BenchmarkCard";

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

  const flaggedCandidates = company.candidates.filter((c) => c.flagged);
  const totalIndirectInfluence = company.superPacs.reduce((s, p) => s + p.amount, 0) +
    company.darkMoneyOrgs.reduce((s, d) => s + (d.estimatedAmount || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to directory
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* ── Company Overview ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{company.name}</h1>
              {company.parentCompany && (
                <p className="text-sm text-muted-foreground mb-1">Parent: {company.parentCompany}</p>
              )}
              <p className="text-muted-foreground mb-3">{company.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{company.industry}</Badge>
                <Badge variant="secondary">{company.state}</Badge>
                <Badge variant="secondary">Revenue: {company.revenue}</Badge>
                {company.employeeCount && <Badge variant="secondary">{company.employeeCount} employees</Badge>}
                <CivicFootprintBadge score={company.civicFootprintScore} />
              </div>
            </div>
          </div>

          {/* ── Summary Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Scale className="w-3.5 h-3.5" />
                  Civic Footprint
                </div>
                <div className="text-2xl font-bold text-foreground">{company.civicFootprintScore}<span className="text-sm text-muted-foreground">/100</span></div>
                <CivicFootprintBadge score={company.civicFootprintScore} size="sm" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  PAC Spending
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {company.totalPacSpending > 0 ? formatCurrency(company.totalPacSpending) : "None"}
                </div>
                <p className="text-xs text-muted-foreground">Current cycle</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Megaphone className="w-3.5 h-3.5" />
                  Lobbying
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {company.lobbyingSpend ? formatCurrency(company.lobbyingSpend) : "None"}
                </div>
                <p className="text-xs text-muted-foreground">Annual</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <EyeOff className="w-3.5 h-3.5" />
                  Indirect Influence
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalIndirectInfluence > 0 ? formatCurrency(totalIndirectInfluence) : "None"}
                </div>
                <p className="text-xs text-muted-foreground">Super PACs &amp; dark money</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Flag className="w-3.5 h-3.5" />
                  Risk Signals
                </div>
                <div className="text-2xl font-bold text-foreground">{company.flaggedOrgTies.length + flaggedCandidates.length + company.darkMoneyOrgs.length}</div>
                <p className="text-xs text-muted-foreground">Flagged ties</p>
              </CardContent>
            </Card>
          </div>

          {/* ── SCORING & INTELLIGENCE ─────────────────────────────── */}
          {(company.influenceROI || company.hypocrisyIndex || company.politicalRisk || company.benchmark) && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Intelligence Scores
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Predictive risk scores, ROI metrics, and peer benchmarking.</p>
              <div className="grid lg:grid-cols-2 gap-6">
                {company.influenceROI && <InfluenceROICard data={company.influenceROI} />}
                {company.hypocrisyIndex && <HypocrisyIndexCard data={company.hypocrisyIndex} />}
                {company.politicalRisk && <PoliticalRiskCard data={company.politicalRisk} />}
                {company.benchmark && (
                  <BenchmarkCard data={{
                    ...company.benchmark,
                    companyCivicFootprint: company.civicFootprintScore,
                    companyLobbying: company.lobbyingSpend || 0,
                    companyPacSpending: company.totalPacSpending,
                  }} />
                )}
              </div>
            </div>
          )}

          {/* ── SECTION 1: Money Trail ─────────────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Money Trail
            </h2>
            <p className="text-sm text-muted-foreground mb-4">PAC contributions, candidate support, lobbying, and executive personal giving.</p>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Party Breakdown */}
              {company.partyBreakdown.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">PAC Spending by Party</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={company.partyBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="amount" nameKey="party">
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
                  <CardHeader><CardTitle className="text-lg">Candidates Supported</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {company.candidates.map((candidate) => (
                        <div
                          key={candidate.name}
                          className={cn(
                            "flex items-start justify-between p-3 rounded-lg border",
                            candidate.flagged ? "border-civic-red/20 bg-civic-red/5" : "border-border"
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{candidate.name}</span>
                              <Badge variant="outline" className={candidate.party === "R" ? "text-civic-red border-civic-red/30" : candidate.party === "D" ? "text-civic-blue border-civic-blue/30" : "text-muted-foreground"}>
                                {candidate.party}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-muted-foreground">{candidate.type === "corporate-pac" ? "PAC" : candidate.type === "super-pac" ? "Super PAC" : "Personal"}</Badge>
                              {candidate.flagged && <AlertTriangle className="w-3.5 h-3.5 text-civic-red" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {candidate.state}{candidate.district ? ` — ${candidate.district} District` : ""}
                            </p>
                            {candidate.flagReason && <p className="text-xs text-civic-red mt-1">{candidate.flagReason}</p>}
                          </div>
                          <span className="text-sm font-medium text-foreground shrink-0">{formatCurrency(candidate.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Government ROI */}
            {(company.governmentContracts || company.subsidiesReceived || company.effectiveTaxRate) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="w-5 h-5" />
                    Government ROI — Subsidies vs. Spending
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">The return on political investment: what they spend versus what they receive.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {company.governmentContracts && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-foreground">{formatCurrency(company.governmentContracts)}</div>
                        <div className="text-xs text-muted-foreground">Government Contracts</div>
                      </div>
                    )}
                    {company.subsidiesReceived && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-foreground">{formatCurrency(company.subsidiesReceived)}</div>
                        <div className="text-xs text-muted-foreground">Subsidies &amp; Tax Breaks</div>
                      </div>
                    )}
                    {company.effectiveTaxRate && (
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-foreground">{company.effectiveTaxRate}</div>
                        <div className="text-xs text-muted-foreground">Effective Tax Rate</div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Compare political spending ({formatCurrency(company.totalPacSpending + (company.lobbyingSpend || 0))}) against government benefits received.
                    Sources: USASpending.gov, Good Jobs First, public filings.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Executive Donors */}
          {company.executives.length > 0 && (
            <Card className="mb-10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Executive &amp; Leadership Donors
                </CardTitle>
                <p className="text-xs text-muted-foreground">Personal donations by executives. These reflect individual giving, not necessarily corporate policy.</p>
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
                              <Badge variant="outline" className={cn("text-xs", r.party === "R" ? "text-civic-red border-civic-red/30" : "text-civic-blue border-civic-blue/30")}>
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

          {/* ── SECTION: Indirect Influence (Dark Money & Super PACs) ──── */}
          {(company.superPacs.length > 0 || company.darkMoneyOrgs.length > 0) && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-primary" />
                Indirect Influence
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Super PACs, 527 committees, and dark money (501(c)(4)) organizations linked to this company's leadership.</p>

              <div className="grid md:grid-cols-2 gap-6">
                {company.superPacs.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Super PACs &amp; 527s</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {company.superPacs.map((pac) => (
                          <div key={pac.name} className="border-b border-border pb-3 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground text-sm">{pac.name}</span>
                              <Badge variant="outline" className="text-xs capitalize">{pac.type}</Badge>
                            </div>
                            <div className="text-lg font-bold text-foreground">{formatCurrency(pac.amount)}</div>
                            <p className="text-xs text-muted-foreground mt-1">{pac.description}</p>
                            <Badge variant="outline" className={cn("text-xs mt-1", pac.confidence === "direct" ? "text-civic-green border-civic-green/30" : pac.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-muted-foreground")}>
                              {pac.confidence}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {company.darkMoneyOrgs.length > 0 && (
                  <Card className="border-civic-red/20">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-civic-red" />
                        Dark Money Organizations
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">501(c)(4) and similar organizations that do not disclose donors.</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {company.darkMoneyOrgs.map((org) => (
                          <div key={org.name} className="border-b border-border pb-3 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground text-sm">{org.name}</span>
                              <Badge variant="outline" className="text-xs">{org.type}</Badge>
                            </div>
                            {org.estimatedAmount && (
                              <div className="text-lg font-bold text-foreground">{formatCurrency(org.estimatedAmount)}</div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{org.description}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className={cn("text-xs", org.confidence === "direct" ? "text-civic-green border-civic-green/30" : org.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-red border-civic-red/30")}>
                                {org.confidence}
                              </Badge>
                            </div>
                            {org.source && <p className="text-xs text-muted-foreground mt-1">Source: {org.source}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ── Revolving Door ─────────────────────────────────────────── */}
          {company.revolvingDoor.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                Revolving Door
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Connections between company leadership and government positions.</p>
              <div className="space-y-3">
                {company.revolvingDoor.map((entry, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground text-sm">{entry.person}</div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground uppercase tracking-wider font-medium">Former</span>
                              <p className="text-foreground mt-0.5">{entry.formerRole}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground uppercase tracking-wider font-medium">Current/Recent</span>
                              <p className="text-foreground mt-0.5">{entry.currentRole}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{entry.relevance}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-xs shrink-0", entry.confidence === "direct" ? "text-civic-green border-civic-green/30" : entry.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-red border-civic-red/30")}>
                          {entry.confidence}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── Spending History ────────────────────────────────────────── */}
          {company.spendingHistory.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Spending Trajectory
              </h2>
              <p className="text-sm text-muted-foreground mb-4">How political spending has changed over recent election cycles.</p>
              <Card>
                <CardContent className="p-5">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={company.spendingHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="cycle" className="text-xs" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="pacSpending" name="PAC Spending" fill="hsl(220, 65%, 48%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="lobbyingSpend" name="Lobbying" fill="hsl(215, 15%, 47%)" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="executiveGiving" name="Executive Giving" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SECTION 2: Influence Network ───────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Influence Network
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Trade groups, think tanks, advocacy orgs, and board memberships.</p>

            <div className="grid md:grid-cols-2 gap-6">
              {company.tradeAssociations.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Trade Associations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.tradeAssociations.map((ta) => (
                        <Badge key={ta} variant="secondary">{ta}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {company.boardAffiliations.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Board &amp; Leadership Affiliations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.boardAffiliations.map((ba) => (
                        <Badge key={ba} variant="secondary">{ba}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {company.flaggedOrgTies.length > 0 && (
              <Card className="mt-6 border-civic-red/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-civic-red">
                    <AlertTriangle className="w-4 h-4" />
                    Flagged Organization Ties
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Connections to organizations flagged by civil rights watchdogs or advocacy trackers.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {company.flaggedOrgTies.map((tie) => (
                      <div key={tie.orgName} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="font-medium text-foreground text-sm">{tie.orgName}</div>
                          <div className="flex gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs capitalize">{tie.relationship.replace(/-/g, " ")}</Badge>
                            <Badge variant="outline" className={cn("text-xs", tie.confidence === "direct" ? "text-civic-green border-civic-green/30" : tie.confidence === "inferred" ? "text-civic-yellow border-civic-yellow/30" : "text-muted-foreground")}>
                              {tie.confidence}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{tie.description}</p>
                        {tie.source && <p className="text-xs text-muted-foreground mt-1">Source: {tie.source}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── SECTION 3: Public Stance vs Spending ───────────────────── */}
          {company.publicStances.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-primary" />
                Public Stance vs. Spending
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Where marketing language and money trail align or diverge.</p>
              <div className="space-y-4">
                {company.publicStances.map((stance) => (
                  <Card key={stance.topic}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-foreground text-sm">{stance.topic}</span>
                        <Badge variant="outline" className={cn("text-xs capitalize", stance.gap === "contradictory" ? "text-civic-red border-civic-red/30" : stance.gap === "mixed" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-green border-civic-green/30")}>
                          {stance.gap}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">What they say</div>
                          <p className="text-sm text-foreground">{stance.publicPosition}</p>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Where the money goes</div>
                          <p className="text-sm text-foreground">{stance.spendingReality}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 4: Why This Matters ────────────────────────────── */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Why This Matters
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Practical relevance for candidates, employees, and consumers.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">For Workers &amp; Candidates</div>
                  <p className="text-sm text-foreground">{company.workerRelevance}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">For Consumers</div>
                  <p className="text-sm text-foreground">{company.consumerRelevance}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── SECTION 5: Sources & Confidence ────────────────────────── */}
          <Card className="mb-4">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Last reviewed: {company.lastUpdated}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Badge variant="outline" className={cn("text-xs capitalize", company.confidenceRating === "high" ? "text-civic-green border-civic-green/30" : company.confidenceRating === "medium" ? "text-civic-yellow border-civic-yellow/30" : "text-civic-red border-civic-red/30")}>
                      {company.confidenceRating}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {company.careersUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={company.careersUrl} target="_blank" rel="noopener noreferrer">
                        Careers Page <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/methodology">Our Methodology</Link>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Data sourced from FEC.gov, OpenSecrets.org, lobbying disclosures, USASpending.gov, Good Jobs First, and public filings. 
                Executive donations reflect personal giving and do not necessarily represent corporate policy.
                Dark money estimates are based on available tax filings and may not represent total giving.
                CivicLens provides publicly available data for informational purposes only and does not make endorsements or moral judgments.
              </p>
            </CardContent>
          </Card>

          {/* Correction Request */}
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              See something wrong or missing?{" "}
              <a href="mailto:corrections@civiclens.org" className="text-primary hover:underline">
                Request a correction or provide updated source material
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
