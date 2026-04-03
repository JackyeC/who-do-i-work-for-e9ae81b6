import { Badge } from "@/components/ui/badge";
import { dossierCompactBadgeText } from "@/domain/career/dossier-ui-labels";

export function DossierStatusBadge({ emailStatus }: { emailStatus: string }) {
  return (
    <Badge variant="secondary" className="text-[10px] font-normal gap-1">
      {dossierCompactBadgeText(emailStatus)}
    </Badge>
  );
}
