import { AlertTriangle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = ["Tech", "Finance", "Healthcare", "Retail", "Government", "Legal", "Media", "Other"];
const COMPANY_SIZES = ["<50", "50–500", "500–5,000", "5,000–50,000", "50,000+"];
const ENTITY_TYPES = ["Public", "Private", "Nonprofit", "Government"];

export interface UnknownCompanyMeta {
  industry?: string;
  companySize?: string;
  entityType?: string;
}

interface Props {
  companyName: string;
  meta: UnknownCompanyMeta;
  onChange: (meta: UnknownCompanyMeta) => void;
}

export function UnknownCompanyPrompt({ companyName, meta, onChange }: Props) {
  return (
    <div className="mt-2 border border-amber-400/50 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg p-3 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          We don't have <span className="font-semibold">"{companyName}"</span> in our database yet.
          Add a few details and we'll still evaluate your offer.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Industry</label>
          <Select value={meta.industry || ""} onValueChange={v => onChange({ ...meta, industry: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(i => (
                <SelectItem key={i} value={i} className="text-xs">{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Company Size</label>
          <Select value={meta.companySize || ""} onValueChange={v => onChange({ ...meta, companySize: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map(s => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Public / Private</label>
          <Select value={meta.entityType || ""} onValueChange={v => onChange({ ...meta, entityType: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map(t => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
