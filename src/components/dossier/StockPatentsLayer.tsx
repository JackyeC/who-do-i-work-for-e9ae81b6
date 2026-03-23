import { useState } from "react";
import { safeSignalLabel } from "@/utils/signalTextSanitizer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Lightbulb, BarChart3, Loader2, ExternalLink, Calendar, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceDot, CartesianGrid,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StockPatentsProps {
  companyId: string;
  companyName: string;
  /** When false, show blurred teaser */
  unlocked?: boolean;
}

const RANGE_OPTIONS = [
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
  { value: "10y", label: "10Y" },
  { value: "max", label: "All" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatPrice(val: number) {
  return `$${val.toFixed(2)}`;
}

/** Blurred overlay for non-subscribers */
function BlurOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-card/60 backdrop-blur-md">
      <Lock className="w-5 h-5 text-muted-foreground mb-2" />
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-micro text-muted-foreground mt-1">Track this company to unlock</p>
    </div>
  );
}

export function StockPatentsLayer({ companyId, companyName, unlocked = true }: StockPatentsProps) {
  const [range, setRange] = useState("max");

  // Look up ticker from pipeline_entities
  const { data: tickerData } = useQuery({
    queryKey: ["stock-ticker", companyId, companyName],
    queryFn: async () => {
      const { data } = await supabase
        .from("pipeline_entities")
        .select("ticker, canonical_name")
        .ilike("canonical_name", `%${companyName.split(",")[0].split(" Inc")[0].split(" Corp")[0].trim()}%`)
        .not("ticker", "is", null)
        .limit(1);
      return data?.[0]?.ticker || null;
    },
    enabled: !!companyName,
  });

  // Fetch lifetime monthly stock data from edge function
  const { data: stockData, isLoading: loadingStock, error: stockError } = useQuery({
    queryKey: ["stock-chart", tickerData, range],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-stock-chart", {
        body: { ticker: tickerData, range, interval: "1mo" },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!tickerData,
    staleTime: 1000 * 60 * 30,
  });

  // Load inflection-point signals
  const { data: inflectionSignals } = useQuery({
    queryKey: ["stock-inflections", companyId],
    queryFn: async () => {
      const [warnRes, signalRes] = await Promise.all([
        supabase
          .from("company_warn_notices")
          .select("notice_date, employees_affected, layoff_type")
          .eq("company_id", companyId)
          .order("notice_date", { ascending: false })
          .limit(10),
        supabase
          .from("company_signal_scans")
          .select("scan_timestamp, signal_type, signal_category, signal_value")
          .eq("company_id", companyId)
          .in("signal_category", ["leadership", "restructuring", "innovation", "regulatory"])
          .limit(10),
      ]);

      const markers: Array<{ date: string; label: string; type: string }> = [];
      (warnRes.data || []).forEach(w => {
        markers.push({ date: w.notice_date.split("T")[0], label: `WARN: ${w.employees_affected} employees (${w.layoff_type || "Layoff"})`, type: "warn" });
      });
      (signalRes.data || []).forEach(s => {
        markers.push({ date: (s.scan_timestamp || "").split("T")[0], label: safeSignalLabel(s.signal_type, "Signal") || "Signal", type: s.signal_category });
      });
      return markers;
    },
    enabled: !!companyId,
  });

  // Map inflection points to nearest chart data point
  const chartPoints = stockData?.chartData || [];
  const markerPoints = (inflectionSignals || [])
    .map(marker => {
      const closest = chartPoints.reduce((best: any, pt: any) => {
        if (!best) return pt;
        const diff = Math.abs(new Date(pt.date).getTime() - new Date(marker.date).getTime());
        const bestDiff = Math.abs(new Date(best.date).getTime() - new Date(marker.date).getTime());
        return diff < bestDiff ? pt : best;
      }, null);
      if (!closest || Math.abs(new Date(closest.date).getTime() - new Date(marker.date).getTime()) > 90 * 86400000) return null;
      return { ...closest, markerLabel: marker.label, markerType: marker.type };
    })
    .filter(Boolean);

  const noTicker = !tickerData && !loadingStock;

  return (
    <div className="space-y-6">
      {/* ── Stock Chart ─────────────────────────────── */}
      {noTicker ? (
        <div className="text-center py-8 rounded-xl bg-muted/20">
          <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-caption text-muted-foreground">
            No stock ticker found for {companyName}. This company may be private.
          </p>
        </div>
      ) : loadingStock ? (
        <Card className="border-border/30">
          <CardContent className="p-5 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
            <span className="text-caption text-muted-foreground">Loading stock data for {tickerData}…</span>
          </CardContent>
        </Card>
      ) : stockError ? (
        <div className="text-center py-8 rounded-xl bg-destructive/5 border border-destructive/10">
          <BarChart3 className="w-8 h-8 text-destructive/40 mx-auto mb-3" />
          <p className="text-caption text-muted-foreground">Unable to load stock data.</p>
        </div>
      ) : chartPoints.length > 0 ? (
        <div className="relative">
          {!unlocked && <BlurOverlay label="Stock Price History" />}
          <Card className="border-border/30 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-foreground text-body flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[hsl(225,42%,15%)]" />
                    {stockData.companyName || companyName}
                    <Badge variant="secondary" className="text-micro font-mono">{stockData.ticker}</Badge>
                  </h4>
                  <p className="text-micro text-muted-foreground mt-0.5">
                    {stockData.exchange} · {stockData.currency}
                    {chartPoints.length > 0 && ` · Last: ${formatPrice(chartPoints[chartPoints.length - 1].close)}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRange(opt.value)}
                      className={`px-2.5 py-1 text-micro rounded-md font-medium transition-colors ${
                        range === opt.value
                          ? "bg-[hsl(var(--civic-navy))] text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carbon & Indigo Area Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPoints}>
                    <defs>
                      <linearGradient id="carbonIndigoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(225 42% 15%)" stopOpacity={0.35} />
                        <stop offset="50%" stopColor="hsl(245 58% 67%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(245 58% 67%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                      tickFormatter={formatDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--border))"
                      tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatPrice(v), "Close"]}
                      labelFormatter={(label: string) =>
                        new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                      }
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="hsl(225 42% 15%)"
                      strokeWidth={2}
                      fill="url(#carbonIndigoGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: "hsl(245 58% 67%)", stroke: "hsl(225 42% 15%)", strokeWidth: 2 }}
                    />
                    {markerPoints.map((pt: any, idx: number) => (
                      <ReferenceDot
                        key={idx}
                        x={pt.date}
                        y={pt.close}
                        r={6}
                        fill={pt.markerType === "warn" ? "hsl(var(--destructive))" : "hsl(var(--civic-gold))"}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Inflection point legend */}
              {markerPoints.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <h5 className="text-micro font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Inflection Points
                  </h5>
                  {markerPoints.map((pt: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-micro text-muted-foreground">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: pt.markerType === "warn" ? "hsl(var(--destructive))" : "hsl(var(--civic-gold))",
                        }}
                      />
                      <span className="font-mono">{formatDate(pt.date)}</span>
                      <span>—</span>
                      <span>{pt.markerLabel}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
