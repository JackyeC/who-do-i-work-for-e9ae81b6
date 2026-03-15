import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { AddCompanyModal } from "./AddCompanyModal";

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  industry: string;
  civic_footprint_score: number;
  total_pac_spending: number;
  lobbying_spend: number | null;
  government_contracts: number | null;
  employee_count: string | null;
  state: string;
}

interface CompanySelectorProps {
  label: string;
  company: CompanyData | null;
  search: string;
  suggestions: CompanyData[];
  onSearchChange: (value: string) => void;
  onSelect: (company: CompanyData) => void;
  onClear: () => void;
}

export function CompanySelector({ label, company, search, suggestions, onSearchChange, onSelect, onClear }: CompanySelectorProps) {
  const [showAdd, setShowAdd] = useState(false);

  if (company) {
    return (
      <div className="bg-card border border-border p-5 relative group hover:border-primary/30 transition-all">
        <div className="absolute top-3 right-3">
          <button onClick={onClear} className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors">
            Change
          </button>
        </div>
        <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-primary mb-2">{label}</div>
        <div className="font-bold text-lg text-foreground mb-1">{company.name}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{company.industry} · {company.state}</div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-mono text-3xl font-black text-primary">{company.civic_footprint_score}</span>
          <span className="font-mono text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
    );
  }

  const showNoResults = search.length >= 2 && suggestions.length === 0;

  return (
    <div>
      <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{label}</div>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search employer..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-mono text-xs pl-9"
          />
        </div>
        {(suggestions.length > 0 || showNoResults) && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border shadow-xl">
            {suggestions.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center justify-between border-b border-border last:border-0"
              >
                <div>
                  <span className="text-foreground font-medium text-sm">{c.name}</span>
                  <span className="ml-2 font-mono text-[9px] text-muted-foreground">{c.industry}</span>
                </div>
                <span className="font-mono text-xs font-bold text-primary">{c.civic_footprint_score}</span>
              </button>
            ))}
            {showNoResults && (
              <div className="px-4 py-3 text-center">
                <div className="text-[12px] text-muted-foreground mb-2">No employers found for "{search}"</div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add this company
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddCompanyModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onCompanyAdded={(c) => onSelect(c)}
        initialName={search}
      />
    </div>
  );
}
