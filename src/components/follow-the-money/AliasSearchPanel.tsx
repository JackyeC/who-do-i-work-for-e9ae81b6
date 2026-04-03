import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  aliases: string[];
}

export function AliasSearchPanel({ aliases }: Props) {
  if (aliases.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Employer Aliases Searched
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="Employer name variants searched in FEC records">
        {aliases.map((alias) => (
          <Badge
            key={alias}
            variant="secondary"
            className="text-xs font-mono bg-muted/30 text-foreground/80"
          >
            {alias}
          </Badge>
        ))}
      </div>
    </div>
  );
}
