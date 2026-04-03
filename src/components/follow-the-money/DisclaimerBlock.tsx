import { AlertTriangle } from "lucide-react";

export function DisclaimerBlock() {
  return (
    <aside
      role="note"
      aria-label="How to read this data"
      className="rounded-lg border border-border/40 bg-muted/10 px-4 py-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-foreground">How to read this data</span>
      </div>
      <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc list-inside pl-1">
        <li>
          These records come from official FEC filings and use the employer field reported on contribution forms.
        </li>
        <li>
          Employer names are self-reported and can be inconsistent, abbreviated, or misspelled, which means some records may be missing or grouped imperfectly.
        </li>
        <li>
          This view may include employee, executive, or PAC-linked activity associated with the employer name, and it should not be read as proof of direct corporate giving in every case.
        </li>
        <li>
          A low or empty result does not always mean zero political activity; it can also reflect naming ambiguity or limited federal reporting matches.
        </li>
      </ul>
    </aside>
  );
}
