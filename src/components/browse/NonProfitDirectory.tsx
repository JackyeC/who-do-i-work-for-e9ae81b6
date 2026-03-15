import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Landmark, Search, Network, FileText, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.025 } } },
  item: { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } },
};

export function NonProfitDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["nonprofit-directory"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("power_network_entities")
        .select("*")
        .in("entity_type", ["foundation", "organization", "nonprofit", "financial_institution"])
        .order("relationship_count", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!orgs) return [];
    if (!searchQuery.trim()) return orgs;
    const q = searchQuery.toLowerCase();
    return orgs.filter((o: any) =>
      o.name?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q) ||
      o.entity_type?.toLowerCase().includes(q)
    );
  }, [orgs, searchQuery]);

  const typeLabel = (t: string) => t?.replace(/_/g, " ") || "organization";

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-discover", {
        body: { searchQuery: searchQuery.trim(), companyName: searchQuery.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        toast({
          title: data.action === "existing" ? "Organization found" : "Organization discovered",
          description: data.action === "created"
            ? `Building intelligence profile for ${data.identity?.name || searchQuery}...`
            : "Opening existing profile...",
        });
        navigate(`/company/${data.slug}`);
      } else {
        throw new Error(data?.error || "Discovery failed");
      }
    } catch (e: any) {
      toast({ title: "Discovery failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search non-profits & foundations…"
            className="pl-9 h-9 rounded-lg bg-muted/40 border-border/40 text-sm"
          />
        </div>
        {searchQuery.trim().length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={handleDiscover}
            disabled={isDiscovering}
          >
            {isDiscovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isDiscovering ? "Discovering..." : "Discover & Add"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} organization{filtered.length !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <LoadingState message="Loading organizations…" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <EmptyState
            icon={Landmark}
            title="No organizations found"
            description="Non-profits and foundations are extracted automatically from investigative documents and influence data."
          />
          {searchQuery.trim().length >= 2 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Can't find <strong>"{searchQuery}"</strong>? We can discover and research it automatically.
              </p>
              <Button
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="gap-2"
              >
                {isDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isDiscovering ? "Discovering..." : "Discover & Research"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
        >
          {filtered.map((org: any) => (
            <motion.div key={org.id} variants={stagger.item}>
              <Card className="group hover:shadow-md transition-all duration-150 hover:border-primary/20 cursor-pointer h-full border-border/40">
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 bg-primary/5 border border-primary/10 rounded-md mt-0.5 shrink-0">
                        <Landmark className="h-3.5 w-3.5 text-primary/70" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {org.name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                          {typeLabel(org.entity_type)}
                        </Badge>
                        {org.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{org.description}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5 shrink-0 mt-1" />
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-border/30 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {org.document_count || 0} docs
                    </span>
                    <span className="flex items-center gap-1">
                      <Network className="h-3 w-3" />
                      {org.relationship_count || 0} connections
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
