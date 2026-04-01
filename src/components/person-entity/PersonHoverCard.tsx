import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/types/person-entity";

interface PersonHoverCardProps {
  person: Person;
  children: React.ReactNode;
  onViewProfile?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PersonHoverCard({ person, children, onViewProfile }: PersonHoverCardProps) {
  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 overflow-hidden" side="top" align="start">
        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0 border border-border">
              {person.image_url && <AvatarImage src={person.image_url} alt={person.full_name} />}
              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                {getInitials(person.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{person.full_name}</p>
              {person.current_title && (
                <p className="text-xs text-muted-foreground truncate">{person.current_title}</p>
              )}
              {person.current_company && (
                <p className="text-xs text-muted-foreground truncate">{person.current_company}</p>
              )}
            </div>
          </div>

          {/* Bio summary */}
          {person.bio_summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{person.bio_summary}</p>
          )}

          {/* Confidence badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Confidence: {Math.round(person.confidence_score * 100)}%
            </Badge>
            {onViewProfile && (
              <button
                onClick={onViewProfile}
                className="text-xs text-primary hover:underline font-medium"
              >
                View full profile →
              </button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
