import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Star, Filter, Clock } from "lucide-react";
import type { ReceiptSortMode } from "./heat-config";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Stargaze labels for filter pills
const STARGAZE_FILTER_LABELS: Record<number, string> = {
  1: "Worth a glance",
  2: "Mild drama",
  3: "Screenshot this",
  4: "Group chat material",
  5: "Career-defining receipt",
};

// ─── Required category filters ───
const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "ai_workplace", label: "AI" },
  { value: "future_of_work", label: "Work" },
  { value: "labor_organizing", label: "Labor" },
  { value: "worker_rights", label: "DEI" },
  { value: "pay_equity", label: "Money" },
  { value: "regulation", label: "Policy" },
  { value: "layoffs", label: "Layoffs" },
  { value: "legislation", label: "Hiring" },
];

// ─── Bias filter options ───
const BIAS_FILTERS = [
  { value: "all", label: "All Bias" },
  { value: "left", label: "Left" },
  { value: "lean-left", label: "Lean Left" },
  { value: "center", label: "Center" },
  { value: "lean-right", label: "Lean Right" },
  { value: "right", label: "Right" },
];

// ─── Time filter options ───
const TIME_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
];

interface ReceiptsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  sortMode: ReceiptSortMode;
  onSortChange: (v: ReceiptSortMode) => void;
  heatFilter: number | null;
  onHeatFilterChange: (v: number | null) => void;
  biasFilter?: string;
  onBiasFilterChange?: (v: string) => void;
  timeFilter?: string;
  onTimeFilterChange?: (v: string) => void;
}

const SORT_OPTIONS: { value: NonNullable<ReceiptSortMode>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "hottest", label: "⭐ Hottest" },
  { value: "consequential", label: "Consequential" },
  { value: "drama", label: "Drama" },
];

export function ReceiptsFilters({
  search, onSearchChange,
  category, onCategoryChange,
  sortMode, onSortChange,
  heatFilter, onHeatFilterChange,
  biasFilter = "all", onBiasFilterChange,
  timeFilter = "all", onTimeFilterChange,
}: ReceiptsFiltersProps) {
  const [showStarFilter, setShowStarFilter] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stories..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border h-11 text-base"
        />
      </div>

      {/* Category filters — scrollable row */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {CATEGORY_FILTERS.map((cat) => (
          <Button
            key={cat.value}
            size="sm"
            variant={category === cat.value ? "default" : "secondary"}
            className={cn(
              "text-sm h-9 px-4 rounded-full font-semibold transition-all whitespace-nowrap shrink-0",
              category === cat.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            onClick={() => onCategoryChange(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Sort + Bias + Time + Stargaze controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={sortMode === opt.value ? "default" : "ghost"}
              className={cn(
                "text-sm h-8 px-3 font-semibold",
                sortMode === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Bias filter dropdown */}
        {onBiasFilterChange && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-mono">Bias:</span>
            <select
              value={biasFilter}
              onChange={(e) => onBiasFilterChange(e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-card text-sm text-foreground cursor-pointer hover:border-primary/40 transition-colors"
            >
              {BIAS_FILTERS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Time filter */}
        {onTimeFilterChange && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {TIME_FILTERS.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={timeFilter === t.value ? "default" : "ghost"}
                className={cn(
                  "text-xs h-7 px-2.5 font-semibold",
                  timeFilter === t.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => onTimeFilterChange(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        )}

        {/* Stargaze filter toggle */}
        <Button
          size="sm"
          variant={showStarFilter ? "default" : "outline"}
          className={cn(
            "text-sm h-8 px-3 gap-1 font-semibold",
            showStarFilter ? "bg-primary text-primary-foreground" : ""
          )}
          onClick={() => {
            setShowStarFilter(!showStarFilter);
            if (showStarFilter) onHeatFilterChange(null);
          }}
        >
          <Star className="w-3.5 h-3.5" />
          Stargaze
          {heatFilter && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1 h-5">
              {heatFilter}⭐
            </Badge>
          )}
        </Button>
      </div>

      {/* Stargaze level filter pills */}
      {showStarFilter && (
        <div className="flex flex-wrap gap-2 pb-1">
          {[1, 2, 3, 4, 5].map((level) => {
            const isActive = heatFilter === level;
            const starColor =
              level >= 5 ? "hsl(var(--primary))" :
              level >= 4 ? "#F59E0B" :
              level >= 3 ? "#3B82F6" :
              "hsl(var(--muted-foreground))";
            return (
              <button
                key={level}
                onClick={() => onHeatFilterChange(isActive ? null : level)}
                className={cn(
                  "inline-flex items-center gap-1.5 font-bold border rounded-full transition-all",
                  "text-sm px-4 py-2.5 md:text-sm md:px-3 md:py-2",
                  isActive
                    ? "bg-primary/10 border-primary/40 text-primary ring-2 ring-offset-1 ring-offset-background ring-primary/30 shadow-sm"
                    : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-px">
                  {Array.from({ length: level }).map((_, i) => (
                    <span key={i} style={{ fontSize: 12 }}>⭐</span>
                  ))}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: isActive ? starColor : undefined }}>
                  {STARGAZE_FILTER_LABELS[level]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
