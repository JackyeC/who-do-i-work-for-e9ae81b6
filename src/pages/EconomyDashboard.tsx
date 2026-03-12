import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Factory,
  BarChart3, Activity, Building2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06 },
  }),
};

const MACRO_SIGNALS = [
  { label: "Fed Funds Rate", value: "4.75%", change: "-0.25%", direction: "down", source: "FRED" },
  { label: "Unemployment", value: "3.9%", change: "+0.1%", direction: "up", source: "BLS" },
  { label: "GDP Growth (Q4)", value: "2.4%", change: "+0.3%", direction: "up", source: "BEA" },
  { label: "Federal Contracts (YTD)", value: "$412B", change: "+8.2%", direction: "up", source: "USAspending" },
];

const INDUSTRY_GROWTH = [
  { name: "Clean Energy", growth: "+12.3%", gdp: "$89B", employment: "1.2M", trend: "up" },
  { name: "AI & Machine Learning", growth: "+18.7%", gdp: "$124B", employment: "890K", trend: "up" },
  { name: "Healthcare IT", growth: "+9.1%", gdp: "$67B", employment: "560K", trend: "up" },
  { name: "Cybersecurity", growth: "+14.2%", gdp: "$52B", employment: "420K", trend: "up" },
  { name: "Traditional Retail", growth: "-3.1%", gdp: "$320B", employment: "4.2M", trend: "down" },
  { name: "Commercial Real Estate", growth: "-5.8%", gdp: "$198B", employment: "890K", trend: "down" },
];

const LABOR_SIGNALS = [
  { occupation: "AI/ML Engineer", growth: "+32%", medianSalary: "$165,000", openings: "145K", source: "BLS" },
  { occupation: "Data Privacy Officer", growth: "+28%", medianSalary: "$142,000", openings: "38K", source: "BLS" },
  { occupation: "Solar Installation Tech", growth: "+27%", medianSalary: "$52,000", openings: "62K", source: "BLS" },
  { occupation: "Nurse Practitioner", growth: "+26%", medianSalary: "$121,000", openings: "118K", source: "BLS" },
  { occupation: "Healthcare Compliance", growth: "+22%", medianSalary: "$98,000", openings: "28K", source: "BLS" },
];

const FEDERAL_SPENDING = [
  { agency: "Dept. of Defense", amount: "$168B", change: "+4.2%", contractors: 2840 },
  { agency: "Dept. of Health & Human Services", amount: "$89B", change: "+7.1%", contractors: 1560 },
  { agency: "Dept. of Energy", amount: "$42B", change: "+12.8%", contractors: 890 },
  { agency: "NASA", amount: "$28B", change: "+3.5%", contractors: 420 },
  { agency: "Dept. of Homeland Security", amount: "$24B", change: "+6.3%", contractors: 710 },
];

export default function EconomyDashboard() {
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get("view") || "overview";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-border/30 bg-gradient-to-b from-civic-green/[0.04] to-transparent">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <motion.div initial="hidden" animate="show" className="max-w-3xl">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-civic-green" />
              <span className="text-sm font-semibold text-civic-green uppercase tracking-wider">Economic Intelligence</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3 tracking-tight"
            >
              Economic signals that shape careers
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-2xl">
              Macroeconomic indicators, industry growth, labor market trends, and federal spending — all connected to help you make better career decisions.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Macro overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {MACRO_SIGNALS.map((sig, i) => (
            <motion.div key={sig.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{sig.label}</span>
                    <Badge variant="outline" className="text-[10px]">{sig.source}</Badge>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold font-display text-foreground">{sig.value}</span>
                    <span className={`text-xs font-medium flex items-center gap-0.5 mb-1 ${
                      sig.direction === "up" ? "text-civic-green" : "text-civic-red"
                    }`}>
                      {sig.direction === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {sig.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue={activeView === "industries" ? "industries" : activeView === "labor" ? "labor" : activeView === "spending" ? "spending" : "industries"}>
          <TabsList className="mb-6">
            <TabsTrigger value="industries">Industry Growth</TabsTrigger>
            <TabsTrigger value="labor">Labor Market</TabsTrigger>
            <TabsTrigger value="spending">Federal Spending</TabsTrigger>
          </TabsList>

          <TabsContent value="industries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Factory className="w-4 h-4 text-civic-blue" />
                  Industry Growth Rankings
                  <span className="text-xs text-muted-foreground font-normal ml-2">Source: BEA, BLS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {INDUSTRY_GROWTH.map((ind) => (
                    <div key={ind.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        ind.trend === "up" ? "bg-civic-green/10 text-civic-green" : "bg-civic-red/10 text-civic-red"
                      }`}>
                        {ind.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-foreground">{ind.name}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${ind.trend === "up" ? "text-civic-green" : "text-civic-red"}`}>{ind.growth}</span>
                        <p className="text-[10px] text-muted-foreground">GDP: {ind.gdp}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className="text-xs text-muted-foreground">{ind.employment} employed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labor">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Users className="w-4 h-4 text-civic-gold" />
                  Fastest Growing Occupations
                  <span className="text-xs text-muted-foreground font-normal ml-2">Source: BLS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {LABOR_SIGNALS.map((occ) => (
                    <div key={occ.occupation} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-civic-green/10 text-civic-green flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-foreground">{occ.occupation}</span>
                        <p className="text-[10px] text-muted-foreground">{occ.openings} open positions</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-civic-green">{occ.growth}</span>
                        <p className="text-[10px] text-muted-foreground">projected growth</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className="text-sm font-medium text-foreground">{occ.medianSalary}</span>
                        <p className="text-[10px] text-muted-foreground">median salary</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Federal Contract Spending by Agency
                  <span className="text-xs text-muted-foreground font-normal ml-2">Source: USAspending.gov</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {FEDERAL_SPENDING.map((agency) => (
                    <div key={agency.agency} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-foreground">{agency.agency}</span>
                        <p className="text-[10px] text-muted-foreground">{agency.contractors.toLocaleString()} contractors</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">{agency.amount}</span>
                        <p className="text-[10px] text-civic-green">{agency.change} YoY</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
