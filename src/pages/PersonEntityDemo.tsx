import { PersonEntity } from "@/components/person-entity/PersonEntity";
import { PersonHoverCard } from "@/components/person-entity/PersonHoverCard";
import { PersonDrawer } from "@/components/person-entity/PersonDrawer";
import { ENABLE_PERSON_ENTITIES } from "@/lib/feature-flags";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Person, PersonSource } from "@/types/person-entity";

// Hard-coded mock data matching seed SQL — works even with flag off
const MOCK_PERSON: Person = {
  id: "00000000-0000-0000-0000-000000000001",
  full_name: "Jane Doe",
  slug: "jane-doe",
  current_title: "Chief People Officer",
  current_company: "Acme Corp",
  bio_summary: "Veteran HR executive with 20+ years in tech hiring.",
  image_url: null,
  location: "San Francisco, CA",
  prior_roles: [
    { title: "VP People", company: "StartupCo" },
    { title: "HR Director", company: "BigTech Inc" },
  ],
  board_roles: [{ role: "Advisory Board", org: "TechForAll" }],
  advisory_roles: [],
  political_donation_total: 4500,
  confidence_score: 0.85,
  created_at: "2026-03-15T00:00:00Z",
  updated_at: "2026-03-28T00:00:00Z",
};

const MOCK_SOURCES: PersonSource[] = [
  {
    id: "s1",
    person_id: MOCK_PERSON.id,
    claim_key: "current_role",
    claim_text: "CPO at Acme Corp since 2021",
    source_url: "https://example.com/profile",
    source_type: "linkedin",
    confidence_label: "verified",
    collected_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "s2",
    person_id: MOCK_PERSON.id,
    claim_key: "board_seat",
    claim_text: "Serves on TechForAll advisory board",
    source_url: null,
    source_type: "manual",
    confidence_label: "inferred",
    collected_at: "2026-03-16T00:00:00Z",
  },
];

export default function PersonEntityDemo() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-[var(--nav-offset)] px-4 pb-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Person Entity — Stage 3 Demo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Isolated test surface. These components are not wired into any live section.
          </p>
        </div>

        {/* Section 1: Feature flag status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Flag Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={ENABLE_PERSON_ENTITIES ? "default" : "outline"}>
                ENABLE_PERSON_ENTITIES = {String(ENABLE_PERSON_ENTITIES)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {ENABLE_PERSON_ENTITIES
                  ? "Entity linking is active — names will resolve against the database"
                  : "Entity linking is off — all names render as plain text"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: PersonEntity with flag (live behavior) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PersonEntity (Live — Uses Hook)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              These use the real <code>useEntityLinking</code> hook. With flag off, they render as plain text.
              With flag on, they query the database.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Name: <PersonEntity name="Jane Doe" companyContext="Acme Corp" /></span>
              <span>Name: <PersonEntity name="John Smith" /></span>
              <span>Name: <PersonEntity name="Unknown Person" /></span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Section 3: HoverCard with mock data (always visible) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PersonHoverCard (Mock Data — Always Works)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hover over the name below to see the card. This uses hard-coded mock data.
            </p>
            <PersonHoverCard person={MOCK_PERSON} onViewProfile={() => setDrawerOpen(true)}>
              <button className="text-primary underline underline-offset-2 font-medium">
                Jane Doe (hover me)
              </button>
            </PersonHoverCard>
          </CardContent>
        </Card>

        {/* Section 4: Drawer with mock data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PersonDrawer (Mock Data — Always Works)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Click to open the full person profile drawer with sourced facts and confidence labels.
            </p>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              Open Person Drawer
            </Button>
          </CardContent>
        </Card>

        <PersonDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          person={MOCK_PERSON}
          sources={MOCK_SOURCES}
        />
      </div>
    </div>
  );
}
