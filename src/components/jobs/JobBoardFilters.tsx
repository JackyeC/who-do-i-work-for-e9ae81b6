import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Search, X, Wifi, Monitor, Home, DollarSign, Shield, ShieldCheck,
  Sparkles, Clock, Eye, SlidersHorizontal, ChevronDown, ChevronUp, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface JobBoardFilterState {
  search: string;
  workMode: string;
  seniority: string;
  department: string;
  trustFilter: string;
  // Intelligence chips (toggleable)
  payTransparent: boolean;
  highClarity: boolean;
  valuesAligned: boolean;
  freshOnly: boolean;
  salaryMin: number;
  location: string;
}

interface JobBoardFiltersProps {
  filters: JobBoardFilterState;
  onFiltersChange: (filters: JobBoardFilterState) => void;
  availableDepartments: string[];
  availableSeniority: string[];
}

const WORK_MODES = [
  { value: "all", label: "All Modes", icon: null },
  { value: "remote", label: "Remote", icon: Wifi },
  { value: "hybrid", label: "Hybrid", icon: Monitor },
  { value: "on-site", label: "On-site", icon: Home },
];

export function JobBoardFilters({ filters, onFiltersChange, availableDepartments, availableSeniority }: JobBoardFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  const update = (partial: Partial<JobBoardFilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  const toggleChip = (key: keyof JobBoardFilterState) =>
    update({ [key]: !filters[key] } as any);

  const activeFilterCount = [
    filters.workMode !== "all",
    filters.seniority !== "all",
    filters.department !== "all",
    filters.trustFilter !== "all",
    filters.payTransparent,
    filters.highClarity,
    filters.valuesAligned,
    filters.freshOnly,
    filters.salaryMin > 0,
    filters.location.trim().length > 0,
  ].filter(Boolean).length;

  const clearFilters = () =>
    onFiltersChange({
      search: filters.search,
      workMode: "all",
      seniority: "all",
      department: "all",
      trustFilter: "all",
      payTransparent: false,
      highClarity: false,
      valuesAligned: false,
      freshOnly: false,
      salaryMin: 0,
      location: "",
    });

  const filterContent = (
    <div className="space-y-4">
      {/* Intelligence chips */}
      <div className="flex flex-wrap gap-1.5">
        <ChipToggle active={filters.payTransparent} onClick={() => toggleChip("payTransparent")} icon={<DollarSign className="w-3 h-3" />} label="Pay Transparent" />
        <ChipToggle active={filters.highClarity} onClick={() => toggleChip("highClarity")} icon={<Eye className="w-3 h-3" />} label="High Clarity" />
        <ChipToggle active={filters.valuesAligned} onClick={() => toggleChip("valuesAligned")} icon={<Sparkles className="w-3 h-3" />} label="Values Aligned" />
        <ChipToggle active={filters.freshOnly} onClick={() => toggleChip("freshOnly")} icon={<Clock className="w-3 h-3" />} label="Fresh Only" />
      </div>

      {/* Structured filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Location */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input value={filters.location} onChange={(e) => update({ location: e.target.value })} placeholder="City, state..." className="h-8 text-xs pl-7" />
          </div>
        </div>

        {/* Work Mode */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Work Mode</label>
          <div className="flex flex-wrap gap-1">
            {WORK_MODES.map((wm) => (
              <Button key={wm.value} size="sm" variant={filters.workMode === wm.value ? "default" : "outline"} className="text-[11px] h-8 px-2.5 gap-1" onClick={() => update({ workMode: wm.value })}>
                {wm.icon && <wm.icon className="w-3 h-3" />}
                {wm.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Seniority */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Seniority</label>
          <Select value={filters.seniority} onValueChange={(v) => update({ seniority: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {availableSeniority.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Department</label>
          <Select value={filters.department} onValueChange={(v) => update({ department: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {availableDepartments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Trust Level */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Trust Level</label>
          <Select value={filters.trustFilter} onValueChange={(v) => update({ trustFilter: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All companies" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              <SelectItem value="verified"><span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Verified+</span></SelectItem>
              <SelectItem value="certified"><span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Certified Only</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Salary minimum */}
      <div>
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
          Min Salary {filters.salaryMin > 0 ? `· $${(filters.salaryMin * 1000).toLocaleString()}+` : ""}
        </label>
        <Slider value={[filters.salaryMin]} onValueChange={([v]) => update({ salaryMin: v })} min={0} max={250} step={10} className="w-full" />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>Any</span><span>$250k+</span>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs h-6 text-muted-foreground" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3 mb-6">
      {/* Search + filter trigger */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={filters.search} onChange={(e) => update({ search: e.target.value })} placeholder="Search jobs, companies, locations..." className="pl-9 h-11" />
          {filters.search && (
            <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => update({ search: "" })}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0 h-11 min-w-[44px]">
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{filterContent}</div>
            </SheetContent>
          </Sheet>
        ) : (
          <Button
            variant={expanded ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5 shrink-0 h-11"
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                {activeFilterCount}
              </Badge>
            )}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>

      {/* Desktop: chips always visible */}
      {!isMobile && (
        <div className="flex flex-wrap gap-1.5">
          <ChipToggle active={filters.payTransparent} onClick={() => toggleChip("payTransparent")} icon={<DollarSign className="w-3 h-3" />} label="Pay Transparent" />
          <ChipToggle active={filters.highClarity} onClick={() => toggleChip("highClarity")} icon={<Eye className="w-3 h-3" />} label="High Clarity" />
          <ChipToggle active={filters.valuesAligned} onClick={() => toggleChip("valuesAligned")} icon={<Sparkles className="w-3 h-3" />} label="Values Aligned" />
          <ChipToggle active={filters.freshOnly} onClick={() => toggleChip("freshOnly")} icon={<Clock className="w-3 h-3" />} label="Fresh Only" />
        </div>
      )}

      {/* Desktop: expanded filter panel */}
      {!isMobile && expanded && (
        <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
          {filterContent}
        </div>
      )}
    </div>
  );
}

function ChipToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
