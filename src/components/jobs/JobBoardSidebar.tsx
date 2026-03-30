import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Search, X, Wifi, Monitor, Home, DollarSign, Shield, ShieldCheck,
  Sparkles, Clock, Eye, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface JobBoardFilterState {
  search: string;
  workMode: string;
  seniority: string;
  department: string;
  trustFilter: string;
  payTransparent: boolean;
  highClarity: boolean;
  valuesAligned: boolean;
  freshOnly: boolean;
  salaryMin: number;
  location: string;
}

interface JobBoardSidebarProps {
  filters: JobBoardFilterState;
  onFiltersChange: (filters: JobBoardFilterState) => void;
  availableDepartments: string[];
  availableSeniority: string[];
  jobCount: number;
  departmentCounts?: Record<string, number>;
  seniorityCounts?: Record<string, number>;
  workModeCounts?: Record<string, number>;
}

const WORK_MODES = [
  { value: "all", label: "All", icon: null },
  { value: "remote", label: "Remote", icon: Wifi },
  { value: "hybrid", label: "Hybrid", icon: Monitor },
  { value: "on-site", label: "On-site", icon: Home },
];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        {title}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function JobBoardSidebar({
  filters, onFiltersChange, availableDepartments, availableSeniority,
  jobCount, departmentCounts = {}, seniorityCounts = {}, workModeCounts = {},
}: JobBoardSidebarProps) {
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

  return (
    <aside className="w-full space-y-1">
      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">
          {jobCount} <span className="text-muted-foreground font-normal">roles</span>
        </p>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-6 text-muted-foreground" onClick={clearFilters}>
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Intelligence Quick Toggles */}
      <div className="flex flex-wrap gap-1.5 pb-3 border-b border-border/40">
        <ChipToggle active={filters.payTransparent} onClick={() => toggleChip("payTransparent")} icon={<DollarSign className="w-3 h-3" />} label="Pay" />
        <ChipToggle active={filters.highClarity} onClick={() => toggleChip("highClarity")} icon={<Eye className="w-3 h-3" />} label="Clarity" />
        <ChipToggle active={filters.valuesAligned} onClick={() => toggleChip("valuesAligned")} icon={<Sparkles className="w-3 h-3" />} label="Values" />
        <ChipToggle active={filters.freshOnly} onClick={() => toggleChip("freshOnly")} icon={<Clock className="w-3 h-3" />} label="Fresh" />
      </div>

      {/* Location */}
      <FilterSection title="Location">
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input value={filters.location} onChange={(e) => update({ location: e.target.value })} placeholder="City, state..." className="h-8 text-xs pl-7" />
        </div>
      </FilterSection>

      {/* Work Mode */}
      <FilterSection title="Work Mode">
        <div className="space-y-1">
          {WORK_MODES.map((wm) => {
            const count = workModeCounts[wm.value] || 0;
            const active = filters.workMode === wm.value;
            return (
              <button
                key={wm.value}
                onClick={() => update({ workMode: wm.value })}
                className={cn(
                  "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {wm.icon && <wm.icon className="w-3 h-3" />}
                  {wm.label}
                </span>
                {wm.value !== "all" && count > 0 && (
                  <span className="text-xs text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Seniority */}
      <FilterSection title="Experience Level" defaultOpen={false}>
        <div className="space-y-1">
          <button
            onClick={() => update({ seniority: "all" })}
            className={cn(
              "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors",
              filters.seniority === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            All Levels
          </button>
          {availableSeniority.map((s) => {
            const count = seniorityCounts[s] || 0;
            return (
              <button
                key={s}
                onClick={() => update({ seniority: s })}
                className={cn(
                  "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                  filters.seniority === s ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{s}</span>
                {count > 0 && <span className="text-xs text-muted-foreground">{count}</span>}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Department */}
      <FilterSection title="Department" defaultOpen={false}>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => update({ department: "all" })}
            className={cn(
              "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors",
              filters.department === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            All Departments
          </button>
          {availableDepartments.map((d) => {
            const count = departmentCounts[d] || 0;
            return (
              <button
                key={d}
                onClick={() => update({ department: d })}
                className={cn(
                  "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                  filters.department === d ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span className="truncate">{d}</span>
                {count > 0 && <span className="text-xs text-muted-foreground shrink-0 ml-1">{count}</span>}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Trust Level */}
      <FilterSection title="Trust Level">
        <div className="space-y-1">
          {[
            { value: "all", label: "All Companies", icon: null },
            { value: "verified", label: "Verified+", icon: Shield },
            { value: "certified", label: "Certified Only", icon: ShieldCheck },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => update({ trustFilter: t.value })}
              className={cn(
                "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                filters.trustFilter === t.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {t.icon && <t.icon className="w-3 h-3" />}
              {t.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Salary */}
      <FilterSection title={`Salary ${filters.salaryMin > 0 ? `· $${(filters.salaryMin * 1000).toLocaleString()}+` : ""}`}>
        <Slider value={[filters.salaryMin]} onValueChange={([v]) => update({ salaryMin: v })} min={0} max={250} step={10} className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Any</span><span>$250k+</span>
        </div>
      </FilterSection>
    </aside>
  );
}

function ChipToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-all",
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
