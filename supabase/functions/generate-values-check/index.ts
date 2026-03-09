import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ISSUE_AREA_KEYWORDS: Record<string, string[]> = {
  gun_policy: ["gun", "firearm", "NRA", "second amendment", "2nd amendment", "assault weapon", "background check", "concealed carry", "gun control", "gun rights"],
  reproductive_rights: ["abortion", "reproductive", "planned parenthood", "pro-life", "pro-choice", "Roe", "contraception", "family planning"],
  labor_rights: ["union", "labor", "minimum wage", "worker", "collective bargaining", "right to work", "NLRB", "overtime", "wage theft"],
  climate: ["climate", "carbon", "fossil fuel", "renewable", "EPA", "emissions", "green energy", "sustainability", "net zero", "oil", "gas", "coal"],
  civil_rights: ["civil rights", "discrimination", "NAACP", "racial justice", "equity", "DEI", "diversity", "affirmative action", "EEOC"],
  lgbtq_rights: ["LGBTQ", "gay", "transgender", "marriage equality", "HRC", "pride", "gender identity", "sexual orientation", "conversion therapy"],
  voting_rights: ["voting", "election", "ballot", "gerrymandering", "voter ID", "voter suppression", "election integrity", "redistricting"],
  immigration: ["immigration", "border", "DACA", "deportation", "visa", "asylum", "ICE", "migrant", "refugee"],
  education: ["education", "school", "student", "teacher", "charter school", "voucher", "curriculum", "higher education", "student loan"],
  healthcare: ["healthcare", "ACA", "Obamacare", "Medicare", "Medicaid", "pharmaceutical", "drug pricing", "health insurance", "public option"],
  consumer_protection: ["consumer", "CFPB", "FTC", "antitrust", "privacy", "data protection", "monopoly", "price gouging"],
};

function detectIssueAreas(text: string): string[] {
  const lower = text.toLowerCase();
  const matches: string[] = [];
  for (const [area, keywords] of Object.entries(ISSUE_AREA_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      matches.push(area);
    }
  }
  return matches.length > 0 ? matches : ["general"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId } = await req.json();
    if (!companyId) throw new Error("Missing companyId");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // Get company
    const { data: company } = await db.from("companies").select("*").eq("id", companyId).single();
    if (!company) throw new Error("Company not found");

    // Gather all existing evidence in parallel
    const [
      { data: candidates },
      { data: executives },
      { data: lobbying },
      { data: tradeAssocs },
      { data: darkMoney },
      { data: superPacs },
      { data: stances },
      { data: ideology },
      { data: stateContribs },
      { data: stateLobby },
      { data: enrichment },
      { data: execRecipients },
    ] = await Promise.all([
      db.from("company_candidates").select("*").eq("company_id", companyId),
      db.from("company_executives").select("*").eq("company_id", companyId),
      db.from("company_state_lobbying").select("*").eq("company_id", companyId),
      db.from("company_trade_associations").select("*").eq("company_id", companyId),
      db.from("company_dark_money").select("*").eq("company_id", companyId),
      db.from("company_super_pacs").select("*").eq("company_id", companyId),
      db.from("company_public_stances").select("*").eq("company_id", companyId),
      db.from("company_ideology_flags").select("*").eq("company_id", companyId),
      db.from("company_state_contributions").select("*").eq("company_id", companyId),
      db.from("company_state_lobbying").select("*").eq("company_id", companyId),
      db.from("organization_profile_enrichment").select("*").eq("company_id", companyId).maybeSingle(),
      db.from("executive_recipients").select("*, company_executives!inner(company_id)").eq("company_executives.company_id", companyId).order("amount", { ascending: false }),
    ]);

    // Build a map of executive_id → top recipients
    const execRecipientsMap = new Map<string, { name: string; party: string; amount: number }[]>();
    if (execRecipients) {
      for (const r of execRecipients) {
        const list = execRecipientsMap.get(r.executive_id) || [];
        list.push({ name: r.name, party: r.party || "Unknown", amount: r.amount || 0 });
        execRecipientsMap.set(r.executive_id, list);
      }
    }

    const signals: any[] = [];

    // 1. Political Giving — PAC candidates
    if (candidates && candidates.length > 0) {
      for (const c of candidates) {
        const issues = detectIssueAreas(`${c.name} ${c.party} ${c.flag_reason || ""} ${c.state}`);
        for (const issue of issues) {
          signals.push({
            company_id: companyId,
            issue_area: issue,
            signal_category: "political_giving",
            signal_title: `PAC contribution to ${c.name} (${c.party})`,
            signal_description: `${company.name}'s PAC donated ${c.amount ? "$" + Number(c.amount).toLocaleString() : "an amount"} to ${c.name} (${c.party}-${c.state}).${c.flag_reason ? " " + c.flag_reason : ""}`,
            source_name: "FEC",
            source_type: "campaign_finance",
            related_person_name: c.name,
            matched_entity_type: "pac_recipient",
            amount: c.amount,
            confidence_score: 0.85,
            confidence_label: "high",
            verification_status: "verified",
          });
        }
      }
    }

    // 2. Executive activity
    if (executives && executives.length > 0) {
      for (const e of executives) {
        const recipients = execRecipientsMap.get(e.id) || [];
        const topRecipients = recipients.slice(0, 10);
        
        // Build description with recipient info
        let desc = `${e.name} (${e.title}) made ${e.total_donations ? "$" + Number(e.total_donations).toLocaleString() : "reported"} in personal political donations.`;
        if (topRecipients.length > 0) {
          const recipNames = topRecipients.slice(0, 3).map(r => `${r.name} (${r.party})`).join(", ");
          desc += ` Top recipients: ${recipNames}${topRecipients.length > 3 ? ` and ${topRecipients.length - 3} more` : ""}.`;
        }

        signals.push({
          company_id: companyId,
          issue_area: "general",
          signal_category: "executive_activity",
          signal_title: `Executive donations: ${e.name}`,
          signal_description: desc,
          source_name: "FEC",
          source_type: "executive_donation",
          related_person_name: e.name,
          matched_entity_type: "executive",
          amount: e.total_donations,
          confidence_score: 0.8,
          confidence_label: "high",
          verification_status: "verified",
          evidence_json: topRecipients.length > 0 ? { recipients: topRecipients } : null,
        });
      }
    }

    // 3. Lobbying
    if (company.lobbying_spend && company.lobbying_spend > 0) {
      signals.push({
        company_id: companyId,
        issue_area: "general",
        signal_category: "lobbying",
        signal_title: `Federal lobbying: ${company.name}`,
        signal_description: `${company.name} spent $${Number(company.lobbying_spend).toLocaleString()} on federal lobbying.`,
        source_name: "Senate LDA",
        source_type: "lobbying",
        matched_entity_type: "company",
        amount: company.lobbying_spend,
        confidence_score: 0.9,
        confidence_label: "high",
        verification_status: "verified",
      });
    }

    // State lobbying with issue detection
    if (stateLobby && stateLobby.length > 0) {
      for (const sl of stateLobby) {
        const issueText = (sl.issues || []).join(" ");
        const issues = detectIssueAreas(issueText);
        for (const issue of issues) {
          signals.push({
            company_id: companyId,
            issue_area: issue,
            signal_category: "lobbying",
            signal_title: `State lobbying in ${sl.state} (${sl.year})`,
            signal_description: `${company.name} spent $${Number(sl.lobbying_spend).toLocaleString()} lobbying in ${sl.state}. Issues: ${(sl.issues || []).join(", ") || "not specified"}.`,
            source_name: sl.source || "State records",
            source_type: "lobbying",
            matched_entity_type: "company",
            amount: sl.lobbying_spend,
            year: sl.year,
            confidence_score: 0.75,
            confidence_label: "high",
            verification_status: "verified",
          });
        }
      }
    }

    // 4. Trade associations
    if (tradeAssocs && tradeAssocs.length > 0) {
      for (const ta of tradeAssocs) {
        signals.push({
          company_id: companyId,
          issue_area: "general",
          signal_category: "trade_association",
          signal_title: `Member of ${ta.name}`,
          signal_description: `${company.name} is a member of ${ta.name}, a trade association that may engage in political activity on behalf of its members.`,
          source_name: "Public records",
          source_type: "trade_association",
          related_entity_name: ta.name,
          matched_entity_type: "trade_association",
          confidence_score: 0.7,
          confidence_label: "medium",
          verification_status: "partially_verified",
        });
      }
    }

    // 5. Outside spending — Super PACs & dark money
    if (superPacs && superPacs.length > 0) {
      for (const sp of superPacs) {
        signals.push({
          company_id: companyId,
          issue_area: "general",
          signal_category: "outside_spending",
          signal_title: `Connected to ${sp.name} (${sp.pac_type})`,
          signal_description: `${sp.description || sp.name + " is linked to " + company.name}. Amount: $${Number(sp.amount).toLocaleString()}.`,
          source_name: "FEC / OpenSecrets",
          source_type: "outside_spending",
          related_entity_name: sp.name,
          matched_entity_type: "super_pac",
          amount: sp.amount,
          confidence_score: sp.confidence === "direct" ? 0.9 : 0.6,
          confidence_label: sp.confidence === "direct" ? "high" : "medium",
          verification_status: sp.confidence === "direct" ? "verified" : "partially_verified",
        });
      }
    }

    if (darkMoney && darkMoney.length > 0) {
      for (const dm of darkMoney) {
        signals.push({
          company_id: companyId,
          issue_area: "general",
          signal_category: "outside_spending",
          signal_title: `Dark money link: ${dm.name}`,
          signal_description: `${dm.description || dm.name}. Relationship: ${dm.relationship}.${dm.estimated_amount ? " Estimated: $" + Number(dm.estimated_amount).toLocaleString() : ""}`,
          source_name: dm.source || "Public records",
          source_type: "dark_money",
          related_entity_name: dm.name,
          matched_entity_type: "dark_money_org",
          amount: dm.estimated_amount,
          confidence_score: dm.confidence === "direct" ? 0.8 : 0.5,
          confidence_label: dm.confidence === "direct" ? "high" : "low",
          verification_status: dm.confidence === "direct" ? "partially_verified" : "unverified",
        });
      }
    }

    // 6. Ideology flags → issue mapping
    if (ideology && ideology.length > 0) {
      for (const flag of ideology) {
        const issues = detectIssueAreas(`${flag.category} ${flag.org_name} ${flag.description || ""}`);
        for (const issue of issues) {
          signals.push({
            company_id: companyId,
            issue_area: issue,
            signal_category: "issue_alignment",
            signal_title: `${flag.category}: ${flag.org_name}`,
            signal_description: flag.description || `${company.name} has a ${flag.relationship_type} relationship with ${flag.org_name}.`,
            source_name: flag.detected_by || "AI scan",
            source_type: "ideology_flag",
            related_entity_name: flag.org_name,
            matched_entity_type: "flagged_org",
            amount: flag.amount,
            confidence_score: flag.confidence === "direct" ? 0.85 : flag.confidence === "inferred" ? 0.55 : 0.35,
            confidence_label: flag.confidence === "direct" ? "high" : flag.confidence === "inferred" ? "medium" : "low",
            verification_status: flag.confidence === "direct" ? "verified" : "partially_verified",
            evidence_json: { evidence_url: flag.evidence_url },
          });
        }
      }
    }

    // 7. Public stances → issue alignment
    if (stances && stances.length > 0) {
      for (const s of stances) {
        const issues = detectIssueAreas(`${s.topic} ${s.public_position} ${s.spending_reality}`);
        for (const issue of issues) {
          signals.push({
            company_id: companyId,
            issue_area: issue,
            signal_category: "issue_alignment",
            signal_title: `Public stance: ${s.topic}`,
            signal_description: `Public position: "${s.public_position}". Spending reality: "${s.spending_reality}". Gap: ${s.gap}.`,
            source_name: "Public records",
            source_type: "public_stance",
            matched_entity_type: "company",
            confidence_score: 0.7,
            confidence_label: "medium",
            verification_status: "partially_verified",
          });
        }
      }
    }

    // 8. State contributions
    if (stateContribs && stateContribs.length > 0) {
      for (const sc of stateContribs) {
        const issues = detectIssueAreas(`${sc.recipient_name} ${sc.party || ""} ${sc.state}`);
        for (const issue of issues) {
          signals.push({
            company_id: companyId,
            issue_area: issue,
            signal_category: "political_giving",
            signal_title: `State contribution to ${sc.recipient_name}`,
            signal_description: `Contributed $${Number(sc.amount).toLocaleString()} to ${sc.recipient_name}${sc.party ? " (" + sc.party + ")" : ""} in ${sc.state}.`,
            source_name: sc.source_name || "FollowTheMoney",
            source_type: "campaign_finance",
            source_url: sc.source_url,
            related_person_name: sc.recipient_name,
            matched_entity_type: "state_recipient",
            amount: sc.amount,
            year: sc.election_year,
            confidence_score: sc.confidence === "direct" ? 0.85 : 0.6,
            confidence_label: sc.confidence === "direct" ? "high" : "medium",
            verification_status: sc.confidence === "direct" ? "verified" : "partially_verified",
          });
        }
      }
    }

    // 9. OpenSecrets enrichment
    if (enrichment) {
      signals.push({
        company_id: companyId,
        issue_area: "general",
        signal_category: "political_giving",
        signal_title: `OpenSecrets profile: ${enrichment.opensecrets_org_name || company.name}`,
        signal_description: `Third-party summary: contributions total $${Number(enrichment.contributions_total || 0).toLocaleString()}, lobbying total $${Number(enrichment.lobbying_total || 0).toLocaleString()}.`,
        source_name: "OpenSecrets",
        source_type: "third_party_summary",
        source_url: enrichment.profile_url,
        matched_entity_type: "company",
        amount: enrichment.contributions_total,
        confidence_score: 0.6,
        confidence_label: "medium",
        verification_status: enrichment.verification_status === "cross_checked_primary_source" ? "cross_checked" : "third_party",
      });
    }

    // Clear old signals and insert new ones
    await db.from("values_check_signals").delete().eq("company_id", companyId);

    if (signals.length > 0) {
      // Deduplicate by title + issue area
      const seen = new Set<string>();
      const unique = signals.filter((s) => {
        const key = `${s.issue_area}|${s.signal_title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Insert in batches of 50
      for (let i = 0; i < unique.length; i += 50) {
        const batch = unique.slice(i, i + 50);
        await db.from("values_check_signals").insert(batch);
      }
    }

    return new Response(JSON.stringify({ success: true, signalsGenerated: signals.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-values-check error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
