import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EPSTEIN_API = "https://epsteinexposed.com/api/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin/owner role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);

    const { action, companyId, query, page, per_page } = await req.json();

    // ACTION: cross-check a company's executives against Epstein persons
    if (action === "cross-check") {
      if (!companyId) throw new Error("companyId required");

      // Get all executives and board members for this company
      const [execRes, boardRes] = await Promise.all([
        supabaseClient.from("company_executives").select("id, name, title").eq("company_id", companyId),
        supabaseClient.from("board_members").select("id, name, title").eq("company_id", companyId),
      ]);

      const names = [
        ...(execRes.data || []).map((e: any) => ({ ...e, type: "executive" })),
        ...(boardRes.data || []).map((b: any) => ({ ...b, type: "board_member" })),
      ];

      const results: any[] = [];

      for (const person of names) {
        try {
          const resp = await fetch(`${EPSTEIN_API}/persons?q=${encodeURIComponent(person.name)}&per_page=5`);
          if (!resp.ok) continue;
          const apiData = await resp.json();

          if (apiData.data && apiData.data.length > 0) {
            for (const match of apiData.data) {
              // Basic fuzzy: check if names are close enough
              const matchName = (match.name || "").toLowerCase().trim();
              const searchName = person.name.toLowerCase().trim();
              
              if (!matchName.includes(searchName.split(" ").pop()) && 
                  !searchName.includes(matchName.split(" ").pop())) {
                continue;
              }

              // Fetch full person detail for stats
              let personDetail = match;
              try {
                const detailResp = await fetch(`${EPSTEIN_API}/persons/${match.slug}`);
                if (detailResp.ok) {
                  const detailData = await detailResp.json();
                  personDetail = detailData.data || match;
                }
              } catch (_) {}

              // Upsert into epstein_persons
              await supabaseClient.from("epstein_persons").upsert({
                external_slug: match.slug,
                name: match.name,
                category: match.category,
                aliases: match.aliases || [],
                bio: personDetail.bio || null,
                tags: match.tags || [],
                black_book: match.black_book || false,
                stats: personDetail.stats || match.stats || {},
                raw_data: personDetail,
              }, { onConflict: "external_slug" });

              // Get the epstein_person record
              const { data: epPerson } = await supabaseClient
                .from("epstein_persons")
                .select("id")
                .eq("external_slug", match.slug)
                .single();

              if (epPerson) {
                const crossRef = {
                  company_id: companyId,
                  executive_id: person.type === "executive" ? person.id : null,
                  board_member_id: person.type === "board_member" ? person.id : null,
                  epstein_person_id: epPerson.id,
                  match_type: "name_match",
                  match_confidence: matchName === searchName ? "high" : "medium",
                  match_details: {
                    searched_name: person.name,
                    matched_name: match.name,
                    category: match.category,
                    slug: match.slug,
                  },
                  connection_count: personDetail.stats?.connections || 0,
                  flight_count: personDetail.stats?.flights || 0,
                  document_count: personDetail.stats?.documents || 0,
                };

                await supabaseClient.from("epstein_cross_references").upsert(crossRef, {
                  onConflict: "id",
                });

                results.push({
                  person_name: person.name,
                  person_title: person.title,
                  person_type: person.type,
                  match: {
                    name: match.name,
                    slug: match.slug,
                    category: match.category,
                    black_book: match.black_book,
                    stats: personDetail.stats || {},
                  },
                  confidence: matchName === searchName ? "high" : "medium",
                });
              }
            }
          }

          // Rate limit courtesy delay
          await new Promise((r) => setTimeout(r, 200));
        } catch (e) {
          console.error(`Error checking ${person.name}:`, e);
        }
      }

      return new Response(JSON.stringify({ results, checked: names.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: import/sync persons from Epstein API
    if (action === "import-persons") {
      if (!roles?.length) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pageNum = page || 1;
      const perPage = per_page || 100;
      const searchQuery = query || "";

      const url = `${EPSTEIN_API}/persons?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&per_page=${perPage}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const apiData = await resp.json();

      let imported = 0;
      for (const person of apiData.data || []) {
        const { error } = await supabaseClient.from("epstein_persons").upsert({
          external_slug: person.slug,
          name: person.name,
          category: person.category,
          aliases: person.aliases || [],
          tags: person.tags || [],
          black_book: person.black_book || false,
          stats: person.stats || {},
          raw_data: person,
        }, { onConflict: "external_slug" });
        if (!error) imported++;
      }

      return new Response(JSON.stringify({
        imported,
        total: apiData.meta?.total || 0,
        page: pageNum,
        has_more: apiData.meta?.has_more || false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: import flights
    if (action === "import-flights") {
      if (!roles?.length) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pageNum = page || 1;
      const perPage = per_page || 100;

      const url = `${EPSTEIN_API}/flights?page=${pageNum}&per_page=${perPage}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const apiData = await resp.json();

      let imported = 0;
      for (const flight of apiData.data || []) {
        const externalId = flight.id || flight.flight_id || `flight-${pageNum}-${imported}`;
        const { error } = await supabaseClient.from("epstein_flights").upsert({
          external_id: String(externalId),
          flight_date: flight.date || flight.flight_date || null,
          origin: flight.origin || null,
          destination: flight.destination || null,
          passengers: flight.passengers || [],
          raw_data: flight,
        }, { onConflict: "external_id" });
        if (!error) imported++;
      }

      return new Response(JSON.stringify({
        imported,
        total: apiData.meta?.total || 0,
        page: pageNum,
        has_more: apiData.meta?.has_more || false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: search Epstein persons via API
    if (action === "search") {
      const searchQuery = query || "";
      const resp = await fetch(`${EPSTEIN_API}/persons?q=${encodeURIComponent(searchQuery)}&per_page=${per_page || 20}`);
      if (!resp.ok) throw new Error(`API returned ${resp.status}`);
      const apiData = await resp.json();

      return new Response(JSON.stringify(apiData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Epstein cross-check error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
