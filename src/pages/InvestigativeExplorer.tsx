import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search, FileText, Users, Building2, Network, Shield,
  ExternalLink, AlertTriangle, Eye, Filter, ChevronRight,
  Calendar, Hash, MapPin, Loader2
} from "lucide-react";
import { DocumentsTab } from "@/components/investigative/DocumentsTab";
import { PeopleTab } from "@/components/investigative/PeopleTab";
import { OrganizationsTab } from "@/components/investigative/OrganizationsTab";
import { NetworkGraphTab } from "@/components/investigative/NetworkGraphTab";
import { EvidenceTab } from "@/components/investigative/EvidenceTab";
import { usePageSEO } from "@/hooks/use-page-seo";

export default function InvestigativeExplorer() {
  usePageSEO({
    title: "Investigative Data Explorer | Power Networks Archive",
    description: "Search and explore investigative datasets revealing relationships between people, organizations, and influence networks.",
  });

  const [globalSearch, setGlobalSearch] = useState("");
  const [activeTab, setActiveTab] = useState("documents");

  const { data: datasets } = useQuery({
    queryKey: ["power-network-datasets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("power_network_datasets")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["power-network-stats"],
    queryFn: async () => {
      const [docs, entities, relationships] = await Promise.all([
        (supabase as any).from("power_network_documents").select("id", { count: "exact", head: true }),
        (supabase as any).from("power_network_entities").select("id", { count: "exact", head: true }),
        (supabase as any).from("power_network_relationships").select("id", { count: "exact", head: true }),
      ]);
      return {
        documents: docs.count || 0,
        entities: entities.count || 0,
        relationships: relationships.count || 0,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 border border-primary/20">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Investigative Data Explorer
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                Search and explore investigative datasets revealing relationships between people, 
                organizations, and influence networks. Every connection is evidence-linked.
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-6 mt-6">
            {[
              { label: "Documents", value: stats?.documents || 0, icon: FileText },
              { label: "Entities", value: stats?.entities || 0, icon: Users },
              { label: "Relationships", value: stats?.relationships || 0, icon: Network },
              { label: "Datasets", value: datasets?.length || 0, icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-sm">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{stat.label}:</span>
                <span className="font-mono font-semibold text-foreground">
                  {stat.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Global search */}
          <div className="mt-6 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search names, organizations, companies, locations..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-10 bg-background border-border/60 font-mono text-sm"
              />
            </div>
            <Button variant="default" size="default">
              <Search className="h-4 w-4 mr-2" />
              Search Archive
            </Button>
          </div>

          {/* Safety notice */}
          <div className="mt-4 flex items-start gap-2 p-3 bg-civic-yellow/5 border border-civic-yellow/20 text-xs text-civic-yellow/80">
            <Shield className="h-4 w-4 text-civic-yellow mt-0.5 shrink-0" />
            <div>
              <strong className="text-civic-yellow">Context safeguards active.</strong>{" "}
              Victim identities are automatically hidden. Official redactions are respected. 
              All sources are labeled by reliability level. This tool is for research and transparency, 
              not sensationalism.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 border border-border/40 p-1 h-auto gap-1">
            {[
              { value: "documents", label: "Documents", icon: FileText },
              { value: "people", label: "People", icon: Users },
              { value: "organizations", label: "Organizations", icon: Building2 },
              { value: "network", label: "Network Graph", icon: Network },
              { value: "evidence", label: "Evidence", icon: Eye },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-4 py-2 text-sm"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="documents">
              <DocumentsTab searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="people">
              <PeopleTab searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="organizations">
              <OrganizationsTab searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="network">
              <NetworkGraphTab searchQuery={globalSearch} />
            </TabsContent>
            <TabsContent value="evidence">
              <EvidenceTab searchQuery={globalSearch} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
