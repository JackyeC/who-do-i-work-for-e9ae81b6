import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Briefcase, Building2, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Person, PersonSource } from "@/types/person-entity";
import { CONFIDENCE_LABEL_DISPLAY, type ConfidenceLabelKey } from "@/types/person-entity";

interface PersonDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  sources: PersonSource[];
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

const confidenceBadgeColor: Record<ConfidenceLabelKey, string> = {
  verified: "bg-green-500/10 text-green-400 border-green-500/20",
  multi_source: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  inferred: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  no_evidence: "bg-muted text-muted-foreground border-border",
};

export function PersonDrawer({ open, onOpenChange, person, sources }: PersonDrawerProps) {
  if (!person) return null;

  const priorRoles = person.prior_roles ?? [];
  const boardRoles = person.board_roles ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side="right">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 border border-border">
              {person.image_url && <AvatarImage src={person.image_url} alt={person.full_name} />}
              <AvatarFallback className="bg-muted text-muted-foreground text-lg font-semibold">
                {getInitials(person.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <SheetTitle className="text-lg">{person.full_name}</SheetTitle>
              <SheetDescription className="text-sm">
                {[person.current_title, person.current_company].filter(Boolean).join(" · ")}
              </SheetDescription>
              {person.location && (
                <p className="text-xs text-muted-foreground">{person.location}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-8">
            {/* Bio */}
            {person.bio_summary && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Summary
                </h4>
                <p className="text-sm text-foreground">{person.bio_summary}</p>
              </div>
            )}

            {/* Confidence */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Record Confidence
              </h4>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round(person.confidence_score * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round(person.confidence_score * 100)}%
                </span>
              </div>
            </div>

            <Separator />

            {/* Sourced facts */}
            {sources.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Sourced Facts
                </h4>
                <div className="space-y-3">
                  {sources.map((s) => (
                    <div key={s.id} className="flex items-start gap-3 text-sm">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 shrink-0 mt-0.5",
                          confidenceBadgeColor[s.confidence_label]
                        )}
                      >
                        {CONFIDENCE_LABEL_DISPLAY[s.confidence_label]}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-foreground">{s.claim_text || s.claim_key}</p>
                        {s.source_url && (
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prior roles */}
            {priorRoles.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" /> Prior Roles
                  </h4>
                  <div className="space-y-2">
                    {priorRoles.map((role, i) => (
                      <div key={i} className="text-sm text-foreground">
                        {String(role.title || role.role || "Unknown")} — {String(role.company || role.org || "")}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Board roles */}
            {boardRoles.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Board Roles
                  </h4>
                  <div className="space-y-2">
                    {boardRoles.map((role, i) => (
                      <div key={i} className="text-sm text-foreground">
                        {String(role.title || role.role || "Board Member")} — {String(role.org || role.company || "")}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Last updated */}
            <Separator />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last updated: {format(new Date(person.updated_at), "MMM d, yyyy")}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
