import { Badge } from "@/components/ui/badge";
import { Clock, Layers } from "lucide-react";

interface InternalGigCardProps {
  title: string;
  description: string | null;
  skillsOffered: string[];
  durationWeeks: number | null;
  department: string | null;
  missingSkills: string[];
}

export function InternalGigCard({
  title,
  description,
  skillsOffered,
  durationWeeks,
  department,
  missingSkills,
}: InternalGigCardProps) {
  // Check how many offered skills match the user's missing skills
  const relevantSkills = skillsOffered.filter(s =>
    missingSkills.some(ms => ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase()))
  );
  const isRelevant = relevantSkills.length > 0;

  return (
    <div className={`border rounded-lg p-3 transition-colors ${isRelevant ? "border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
        {isRelevant && (
          <Badge variant="success" className="text-[10px] flex-shrink-0">Fills Gap</Badge>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {skillsOffered.map((skill, i) => (
          <Badge
            key={i}
            variant={relevantSkills.includes(skill) ? "success" : "secondary"}
            className="text-[10px]"
          >
            {skill}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {durationWeeks && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {durationWeeks}w
          </span>
        )}
        {department && (
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> {department}
          </span>
        )}
      </div>
    </div>
  );
}
