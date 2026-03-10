import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserConnection {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  title: string | null;
  email: string | null;
  connection_date: string | null;
  created_at: string;
}

export interface ConnectionCompanyMap {
  id: string;
  connection_id: string;
  company_id: string;
  match_confidence: number;
  created_at: string;
}

export interface EnrichedConnection extends UserConnection {
  matched_company?: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    civic_footprint_score: number;
    logo_url: string | null;
    state: string;
  } | null;
  match_confidence?: number;
}

export function useConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["user-connections", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_connections")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as UserConnection[];
    },
    enabled: !!user,
  });

  const { data: companyMaps = [] } = useQuery({
    queryKey: ["connection-company-maps", user?.id],
    queryFn: async () => {
      if (!connections.length) return [];
      const connectionIds = connections.map((c) => c.id);
      const { data, error } = await (supabase as any)
        .from("connection_company_map")
        .select("*, company:companies(id, name, slug, industry, civic_footprint_score, logo_url, state)")
        .in("connection_id", connectionIds);
      if (error) throw error;
      return (data || []) as (ConnectionCompanyMap & { company: any })[];
    },
    enabled: !!user && connections.length > 0,
  });

  const enrichedConnections: EnrichedConnection[] = connections.map((conn) => {
    const map = companyMaps.find((m) => m.connection_id === conn.id);
    return {
      ...conn,
      matched_company: map?.company || null,
      match_confidence: map?.match_confidence,
    };
  });

  const uploadConnections = useMutation({
    mutationFn: async (parsed: Omit<UserConnection, "id" | "user_id" | "created_at">[]) => {
      if (!user) throw new Error("Must be logged in");

      // Insert connections
      const rows = parsed.map((p) => ({ ...p, user_id: user.id }));
      const { data: inserted, error } = await (supabase as any)
        .from("user_connections")
        .insert(rows)
        .select();
      if (error) throw error;

      // Match against companies
      if (inserted && inserted.length > 0) {
        const companyNames = [...new Set(inserted.filter((r: any) => r.company).map((r: any) => r.company.toLowerCase()))];
        if (companyNames.length > 0) {
          const { data: companies } = await supabase
            .from("companies")
            .select("id, name")
            .limit(1000);

          if (companies) {
            const maps: { connection_id: string; company_id: string; match_confidence: number }[] = [];
            for (const conn of inserted as any[]) {
              if (!conn.company) continue;
              const connCompanyLower = conn.company.toLowerCase().trim();
              for (const company of companies) {
                const companyLower = company.name.toLowerCase().trim();
                if (companyLower === connCompanyLower) {
                  maps.push({ connection_id: conn.id, company_id: company.id, match_confidence: 1.0 });
                } else if (companyLower.includes(connCompanyLower) || connCompanyLower.includes(companyLower)) {
                  maps.push({ connection_id: conn.id, company_id: company.id, match_confidence: 0.7 });
                }
              }
            }
            if (maps.length > 0) {
              await (supabase as any).from("connection_company_map").upsert(maps, { onConflict: "connection_id,company_id" });
            }
          }
        }
      }

      return inserted;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-connections"] });
      queryClient.invalidateQueries({ queryKey: ["connection-company-maps"] });
      toast.success(`${data?.length || 0} connections imported successfully`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    connections,
    enrichedConnections,
    companyMaps,
    isLoading,
    uploadConnections,
    connectionCount: connections.length,
    matchedCount: companyMaps.length,
  };
}

export function parseLinkedInCSV(csvText: string): Omit<UserConnection, "id" | "user_id" | "created_at">[] {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  // Find header row (LinkedIn CSVs sometimes have notes before headers)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("first name") || lower.includes("first_name") || lower.includes("firstname")) {
      headerIndex = i;
      break;
    }
  }

  const headers = lines[headerIndex].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const firstNameIdx = headers.findIndex((h) => h.includes("first") && h.includes("name"));
  const lastNameIdx = headers.findIndex((h) => h.includes("last") && h.includes("name"));
  const companyIdx = headers.findIndex((h) => h === "company" || h === "organization");
  const titleIdx = headers.findIndex((h) => h === "position" || h === "title");
  const emailIdx = headers.findIndex((h) => h.includes("email"));
  const dateIdx = headers.findIndex((h) => h.includes("connected") || h.includes("date"));

  const results: Omit<UserConnection, "id" | "user_id" | "created_at">[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse (handles basic cases)
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

    const firstName = firstNameIdx >= 0 ? cols[firstNameIdx] : "";
    const lastName = lastNameIdx >= 0 ? cols[lastNameIdx] : "";
    if (!firstName && !lastName) continue;

    results.push({
      first_name: firstName || "",
      last_name: lastName || "",
      company: companyIdx >= 0 ? cols[companyIdx] || null : null,
      title: titleIdx >= 0 ? cols[titleIdx] || null : null,
      email: emailIdx >= 0 ? cols[emailIdx] || null : null,
      connection_date: dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : null,
    });
  }

  return results;
}
