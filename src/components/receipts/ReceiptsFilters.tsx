import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Flame, Filter } from "lucide-react";
import { RECEIPT_CATEGORIES, HEAT_LABELS, type ReceiptSortMode } from "./heat-config";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ReceiptsFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  sortMode: ReceiptSortMode;
  onSortChange: (v: ReceiptSortMode) => void;
  heatFilter: number | null;
  onHeatFilterChange: (v: number | null) => void;
}

const SORT_OPTIONS: { value: NonNullable<ReceiptSortMode>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "hottest", label: "Hottest" },
  { value: "drama", label: "Drama" },
];

export function ReceiptsFilters({
  search, onSearchChange,
  category, onCategoryChange,
  sortMode, onSortChange,
  heatFilter, onHeatFilterChange,
}: ReceiptsFiltersProps) {
  const [showHeatFilter, setShowHeatFilter] = useState(false);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search receipts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border h-10"
        />
      </div>

      {/* Category tabs — collapsible chips on mobile */}
      <div className="flex flex-wrap gap-1.5">
        {RECEIPT_CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            size="sm"
            variant={category === cat.value ? "default" : "secondary"}
            className={cn(
              "text-xs h-8 px-3 rounded-full font-semibold transition-all",
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

      {/* Sort + Heat controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort — toggle behavior: clicking active sort returns to default */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={sortMode === opt.value ? "default" : "ghost"}
              className={cn(
                "text-xs h-7 px-2.5 font-semibold",
                sortMode === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSortChange(sortMode === opt.value ? "drama" : opt.value)}
            >
              {opt.value === "hottest" && <Flame className="w-3 h-3 mr-1" />}
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Heat filter toggle */}
        <Button
          size="sm"
          variant={showHeatFilter ? "default" : "outline"}
          className={cn(
            "text-xs h-7 px-2.5 gap-1 font-semibold",
            showHeatFilter ? "bg-primary text-primary-foreground" : ""
          )}
          onClick={() => {
            setShowHeatFilter(!showHeatFilter);
            if (showHeatFilter) onHeatFilterChange(null);
          }}
        >
          <Filter className="w-3 h-3" />
          Heat
          {heatFilter && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1 h-4">
              {heatFilter}
            </Badge>
          )}
        </Button>
      </div>

      {/* Heat level filter pills — large tap targets on mobile */}
      {showHeatFilter && (
        <div className="flex flex-wrap gap-2 pb-1">
          {[1, 2, 3, 4, 5].map((level) => {
            const heat = HEAT_LABELS[level];
            const isActive = heatFilter === level;
            return (
              <button
                key={level}
                onClick={() => onHeatFilterChange(isActive ? null : level)}
                className={cn(
                  "inline-flex items-center gap-1.5 font-bold border rounded-full transition-all",
                  // Mobile-first: large tap targets
                  "text-[13px] px-4 py-2.5 md:text-xs md:px-3 md:py-1.5",
                  isActive
                    ? cn(heat.bg, "ring-2 ring-offset-1 ring-offset-background ring-current shadow-sm")
                    : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                )}
              >
                <Flame className="w-4 h-4 md:w-3 md:h-3" fill={isActive ? "currentColor" : "none"} />
                <span className="md:hidden">{heat.mobile}</span>
                <span className="hidden md:inline">{heat.full}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
