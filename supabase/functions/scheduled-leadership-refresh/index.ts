import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    // ── Auth gate: only service-role or admin users allowed ──
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const anonSb = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { data: userData, error: authErr } = await anonSb.auth.getUser(token);
      if (authErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roles } = await createClient(supabaseUrl, serviceKey)
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .in("role", ["admin", "owner"]);
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const companyId = body.company_id;
    const refreshType = body.refresh_type || "monthly";

    // Get companies to refresh
    let query = sb.from("companies").select("id, name, ticker, sec_cik, website_url, careers_url");
    if (companyId) {
      query = query.eq("id", companyId);
    } else {
      const threshold = refreshType === "daily" ? 1 : refreshType === "monthly" ? 30 : 365;
      const cutoff = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000).toISOString();
      query = query.or(`updated_at.lt.${cutoff},updated_at.is.null`).limit(20);
    }

    const { data: companies, error: compErr } = await query;
    if (compErr) throw compErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No companies need refresh" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const company of companies) {
      try {
        // Get current executives and board members
        const [execRes, boardRes] = await Promise.all([
          sb.from("company_executives").select("id, name, title, last_verified_at, verification_status").eq("company_id", company.id),
          sb.from("board_members").select("id, name, title, last_verified_at, committees, verification_status").eq("company_id", company.id),
        ]);

        const currentExecs = execRes.data || [];
        const currentBoard = boardRes.data || [];

        // ── Step 1: Try Firecrawl to get current leadership page ──
        let liveLeadershipNames: string[] = [];
        let firecrawlUsed = false;

        if (firecrawlKey) {
          try {
            // Try the company's about/leadership page
            const baseUrl = (company.website_url || `https://www.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`).replace(/\/$/, '');
            const leadershipUrls = [
              `${baseUrl}/about/leadership`,
              `${baseUrl}/leadership`,
              `${baseUrl}/about/our-team`,
              `${baseUrl}/about`,
              `${baseUrl}/corporate/leadership`,
            ];

            for (const url of leadershipUrls) {
              try {
                const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${firecrawlKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    url,
                    formats: ['markdown'],
                    onlyMainContent: true,
                    waitFor: 3000,
                  }),
                });

                if (scrapeResp.ok) {
                  const scrapeData = await scrapeResp.json();
                  const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
                  
                  // Only use if it looks like a leadership page
                  if (markdown.length > 200 && /\b(CEO|Chief|President|Officer|Director|Board|Executive|Vice President|SVP|EVP)\b/i.test(markdown)) {
                    // Use AI to extract structured leadership data from the page
                    if (lovableKey) {
                      const extractPrompt = `Extract all current leaders from this company leadership page. Return ONLY a JSON array of objects with "name" and "title" fields. Include executives AND board members. If no leaders found, return [].

Page content:
${markdown.slice(0, 8000)}`;

                      const extractRes = await fetch(AI_URL, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${lovableKey}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          model: "google/gemini-2.5-flash",
                          messages: [{ role: "user", content: extractPrompt }],
                          temperature: 0.1,
                        }),
                      });

                      if (extractRes.ok) {
                        const extractData = await extractRes.json();
                        const content = extractData.choices?.[0]?.message?.content || "";
                        const jsonMatch = content.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                          const leaders = JSON.parse(jsonMatch[0]);
                          liveLeadershipNames = leaders.map((l: any) => l.name?.toUpperCase?.() || '');
                          firecrawlUsed = true;
                          console.log(`[leadership-refresh] ${company.name}: Found ${leaders.length} leaders on live page (${url})`);

                          // Upsert new leaders found on the live page
                          for (const leader of leaders) {
                            if (!leader.name) continue;
                            const isBoard = /\b(Director|Board|Independent|Non-Executive|Chairm)/i.test(leader.title || '');
                            const isExec = /\b(CEO|COO|CFO|CTO|CIO|CHRO|CLO|CPO|CRO|CMO|Chief|President|SVP|EVP|Senior Vice President|Executive Vice President|Vice President|VP|Founder)\b/i.test(leader.title || '');

                            if (isBoard) {
                              const exists = currentBoard.some((b: any) => 
                                b.name.toUpperCase().includes(leader.name.toUpperCase()) || 
                                leader.name.toUpperCase().includes(b.name.toUpperCase())
                              );
                              if (!exists) {
                                await sb.from("board_members").insert({
                                  company_id: company.id,
                                  name: leader.name,
                                  title: leader.title || "Director",
                                  source: "firecrawl_leadership_page",
                                  verification_status: "verified",
                                  last_verified_at: new Date().toISOString(),
                                });
                                console.log(`[leadership-refresh] ${company.name}: Added new board member: ${leader.name}`);
                              }
                            } else if (isExec) {
                              const exists = currentExecs.some((e: any) =>
                                e.name.toUpperCase().includes(leader.name.toUpperCase()) || 
                                leader.name.toUpperCase().includes(e.name.toUpperCase())
                              );
                              if (!exists) {
                                await sb.from("company_executives").insert({
                                  company_id: company.id,
                                  name: leader.name,
                                  title: leader.title || "Executive",
                                  total_donations: 0,
                                  source: "firecrawl_leadership_page",
                                  verification_status: "verified",
                                  last_verified_at: new Date().toISOString(),
                                });
                                console.log(`[leadership-refresh] ${company.name}: Added new executive: ${leader.name}`);
                              }
                            }
                          }
                        }
                      }
                    }
                    break; // Found a good leadership page, stop trying URLs
                  }
                }
              } catch (urlErr) {
                // Try next URL
                continue;
              }
            }
          } catch (fcErr) {
            console.warn(`[leadership-refresh] Firecrawl failed for ${company.name}:`, fcErr);
          }
        }

        // ── Step 2: Cross-reference and mark departed execs ──
        if (firecrawlUsed && liveLeadershipNames.length > 0) {
          // Mark execs NOT found on live page as "former"
          for (const exec of currentExecs) {
            const nameUpper = exec.name.toUpperCase();
            // Check if this person's name appears anywhere in the live leadership names
            const foundOnPage = liveLeadershipNames.some(liveName => 
              liveName.includes(nameUpper) || nameUpper.includes(liveName) ||
              // Also check last name match for "KESSEL, STEVEN" vs "Steven Kessel" format
              nameUpper.split(/[,\s]+/).some(part => part.length > 2 && liveLeadershipNames.some(ln => ln.includes(part)))
            );

            if (foundOnPage) {
              await sb.from("company_executives").update({
                verification_status: "verified",
                last_verified_at: new Date().toISOString(),
              }).eq("id", exec.id);
            } else if (exec.verification_status !== "former") {
              await sb.from("company_executives").update({
                verification_status: "former",
                departed_at: new Date().toISOString(),
              }).eq("id", exec.id);
              console.log(`[leadership-refresh] ${company.name}: Marked ${exec.name} as FORMER (not on current leadership page)`);
            }
          }

          for (const member of currentBoard) {
            const nameUpper = member.name.toUpperCase();
            const foundOnPage = liveLeadershipNames.some(liveName => 
              liveName.includes(nameUpper) || nameUpper.includes(liveName) ||
              nameUpper.split(/[,\s]+/).some(part => part.length > 2 && liveLeadershipNames.some(ln => ln.includes(part)))
            );

            if (foundOnPage) {
              await sb.from("board_members").update({
                verification_status: "verified",
                last_verified_at: new Date().toISOString(),
              }).eq("id", member.id);
            } else if (member.verification_status !== "former") {
              await sb.from("board_members").update({
                verification_status: "former",
                departed_at: new Date().toISOString(),
              }).eq("id", member.id);
              console.log(`[leadership-refresh] ${company.name}: Marked board member ${member.name} as FORMER`);
            }
          }

          results.push({ company: company.name, status: "verified_via_firecrawl", liveLeaders: liveLeadershipNames.length });
        } else {
          // ── Fallback: Use AI knowledge to detect changes ──
          if (lovableKey) {
            const prompt = `You are a corporate intelligence analyst. For the company "${company.name}" (ticker: ${company.ticker || "N/A"}):

Current known executives: ${currentExecs.map((e: any) => `${e.name} - ${e.title}`).join(", ") || "None"}
Current known board members: ${currentBoard.map((b: any) => `${b.name} - ${b.title}`).join(", ") || "None"}

Based on your knowledge, identify:
1. Any executives who have DEPARTED or changed roles
2. Any NEW executives or board members
3. Any board membership changes

IMPORTANT: If someone has departed, you MUST include them with change_type "departed".

Respond in JSON:
{
  "changes_detected": boolean,
  "executive_changes": [{"name": "...", "new_title": "...", "change_type": "new|departed|title_change", "departed_year": null, "source_hint": "..."}],
  "board_changes": [{"name": "...", "new_title": "...", "change_type": "new|departed|committee_change", "departed_year": null, "committees": ["..."], "source_hint": "..."}],
  "confidence": "high|medium|low"
}`;

            const aiRes = await fetch(AI_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const content = aiData.choices?.[0]?.message?.content || "";
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                if (parsed.changes_detected && parsed.confidence !== "low") {
                  for (const change of parsed.executive_changes || []) {
                    if (change.change_type === "departed") {
                      // Mark as former
                      const match = currentExecs.find((e: any) => 
                        e.name.toUpperCase().includes(change.name.toUpperCase()) ||
                        change.name.toUpperCase().includes(e.name.toUpperCase())
                      );
                      if (match) {
                        await sb.from("company_executives").update({
                          verification_status: "former",
                          departed_at: change.departed_year ? new Date(`${change.departed_year}-01-01`).toISOString() : new Date().toISOString(),
                          title: `Former ${match.title.replace(/^Former\s+/i, '')}`,
                        }).eq("id", match.id);
                        console.log(`[leadership-refresh] AI: Marked ${match.name} as FORMER at ${company.name}`);
                      }
                    } else if (change.change_type === "new") {
                      const exists = currentExecs.some(
                        (e: any) => e.name.toLowerCase() === change.name.toLowerCase()
                      );
                      if (!exists) {
                        await sb.from("company_executives").insert({
                          company_id: company.id,
                          name: change.name,
                          title: change.new_title || "Executive",
                          total_donations: 0,
                          source: "ai_refresh",
                          verification_status: "ai_verified",
                          last_verified_at: new Date().toISOString(),
                        });
                      }
                    } else if (change.change_type === "title_change") {
                      const match = currentExecs.find((e: any) => 
                        e.name.toUpperCase().includes(change.name.toUpperCase()) ||
                        change.name.toUpperCase().includes(e.name.toUpperCase())
                      );
                      if (match && change.new_title) {
                        await sb.from("company_executives").update({
                          title: change.new_title,
                          verification_status: "ai_verified",
                          last_verified_at: new Date().toISOString(),
                        }).eq("id", match.id);
                      }
                    }
                  }

                  for (const change of parsed.board_changes || []) {
                    if (change.change_type === "departed") {
                      const match = currentBoard.find((b: any) => 
                        b.name.toUpperCase().includes(change.name.toUpperCase()) ||
                        change.name.toUpperCase().includes(b.name.toUpperCase())
                      );
                      if (match) {
                        await sb.from("board_members").update({
                          verification_status: "former",
                          departed_at: change.departed_year ? new Date(`${change.departed_year}-01-01`).toISOString() : new Date().toISOString(),
                          title: `Former ${match.title.replace(/^Former\s+/i, '')}`,
                        }).eq("id", match.id);
                        console.log(`[leadership-refresh] AI: Marked board member ${match.name} as FORMER at ${company.name}`);
                      }
                    } else if (change.change_type === "new") {
                      const exists = currentBoard.some(
                        (b: any) => b.name.toLowerCase() === change.name.toLowerCase()
                      );
                      if (!exists) {
                        await sb.from("board_members").insert({
                          company_id: company.id,
                          name: change.name,
                          title: change.new_title || "Director",
                          committees: change.committees || [],
                          source: "ai_refresh",
                          verification_status: "ai_verified",
                          last_verified_at: new Date().toISOString(),
                        });
                      }
                    }
                  }
                }
              }
            }
          }

          // Update last_verified_at for records that weren't individually updated
          const now = new Date().toISOString();
          await Promise.all([
            sb.from("company_executives")
              .update({ last_verified_at: now })
              .eq("company_id", company.id)
              .eq("verification_status", "unverified"),
            sb.from("board_members")
              .update({ last_verified_at: now })
              .eq("company_id", company.id)
              .eq("verification_status", "unverified"),
          ]);

          results.push({ company: company.name, status: "refreshed_via_ai" });
        }
      } catch (err: any) {
        results.push({ company: company.name, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
