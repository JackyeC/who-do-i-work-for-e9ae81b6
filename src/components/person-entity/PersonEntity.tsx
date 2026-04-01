import { useState } from "react";
import { ENABLE_PERSON_ENTITIES } from "@/lib/feature-flags";
import { useEntityLinking } from "@/hooks/useEntityLinking";
import { PersonHoverCard } from "./PersonHoverCard";
import { PersonDrawer } from "./PersonDrawer";
import { cn } from "@/lib/utils";

interface PersonEntityProps {
  name: string;
  companyContext?: string;
  className?: string;
}

/**
 * Smart person entity renderer.
 * - If feature flag is off → plain text
 * - If no match found → plain text
 * - If matched → interactive hover card + click to open drawer
 * - Never renders a broken link
 */
export function PersonEntity({ name, companyContext, className }: PersonEntityProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { person, sources, matched } = useEntityLinking({ name, companyContext });

  // Flag off or no match → plain text
  if (!ENABLE_PERSON_ENTITIES || !matched || !person) {
    return <span className={className}>{name}</span>;
  }

  return (
    <>
      <PersonHoverCard person={person} onViewProfile={() => setDrawerOpen(true)}>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "inline text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/70 transition-colors cursor-pointer font-medium",
            className
          )}
        >
          {name}
        </button>
      </PersonHoverCard>

      <PersonDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        person={person}
        sources={sources}
      />
    </>
  );
}
