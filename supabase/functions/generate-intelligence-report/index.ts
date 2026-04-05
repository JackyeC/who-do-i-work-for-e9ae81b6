import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTACT_EMAIL = "jackye@jackyeclayton.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { employer_name, role_title, email, location, concern, request_id } =
      await req.json();

    if (!employer_name || !role_title || !email) {
      return json({ error: "Missing required fields" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    if (!lovableApiKey) {
      return json({ error: "AI service not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // --- 1. Find the company ---
    const searchName = employer_name.trim().toLowerCase();
    const { data: companies } = await supabase
      .from("companies")
      .select(
        "id, name, industry, state, civic_footprint_score, lobbying_spend, total_pac_spending, employee_count, corporate_pac_exists, effective_tax_rate, government_contracts, description, career_intelligence_score, employer_clarity_score, is_publicly_traded, revenue, parent_company"
      )
      .or(
        `name.ilike.%${searchName}%,canonical_name.ilike.%${searchName}%`
      )
      .limit(1);

    const company = companies?.[0];

    let signalData = "";

    if (company) {
      // --- 2. Pull signals in parallel ---
      const [
        claimsRes,
        warnRes,
        courtRes,
        candidatesRes,
        sentimentRes,
        dossierRes,
        accountabilityRes,
        aiHrRes,
        diversityRes,
      ] = await Promise.all([
        supabase
          .from("company_claims")
          .select("claim_text, claim_type, source_label, confidence_score, decision_impact")
          .eq("company_id", company.id)
          .eq("is_active", true)
          .order("confidence_score", { ascending: false })
          .limit(15),
        supabase
          .from("company_warn_notices")
          .select("notice_date, employees_affected, location, reason")
          .eq("company_id", company.id)
          .order("notice_date", { ascending: false })
          .limit(5),
        supabase
          .from("company_court_cases")
          .select("case_name, case_type, nature_of_suit, status, date_filed, summary")
          .eq("company_id", company.id)
          .limit(5),
        supabase
          .from("company_candidates")
          .select("name, party, amount, donation_type, flagged, flag_reason")
          .eq("company_id", company.id)
          .order("amount", { ascending: false })
          .limit(10),
        supabase
          .from("company_worker_sentiment")
          .select("sentiment, source, quote, topic")
          .eq("company_id", company.id)
          .limit(10),
        supabase
          .from("company_dossiers")
          .select("score, risk_level, risk_signals, fit_signals, bottom_line, insights")
          .eq("company_id", company.id)
          .limit(1),
        supabase
          .from("accountability_signals")
          .select("headline, severity, signal_type, source_name, why_it_matters")
          .eq("company_id", company.id)
          .limit(5),
        supabase
          .from("ai_hr_signals")
          .select("signal_type, signal_category, tool_name, vendor_name, status, confidence")
          .eq("company_id", company.id)
          .limit(5),
        supabase
          .from("company_diversity_disclosures")
          .select("disclosure_type, year, is_published")
          .eq("company_id", company.id)
          .limit(5),
      ]);

      // --- 3. Build signal context ---
      const sections: string[] = [];

      sections.push(`COMPANY PROFILE:
Name: ${company.name}
Industry: ${company.industry}
State: ${company.state}
Employees: ${company.employee_count || "Unknown"}
Revenue: ${company.revenue || "Unknown"}
Publicly Traded: ${company.is_publicly_traded ? "Yes" : "No"}
Parent Company: ${company.parent_company || "None"}
Civic Footprint Score: ${company.civic_footprint_score}/100
Career Intelligence Score: ${company.career_intelligence_score ?? "Not calculated"}
Lobbying Spend: $${(company.lobbying_spend || 0).toLocaleString()}
Total PAC Spending: $${(company.total_pac_spending || 0).toLocaleString()}
Corporate PAC: ${company.corporate_pac_exists ? "Yes" : "No"}
Government Contracts: ${company.government_contracts || "Unknown"}`);

      if (dossierRes.data?.length) {
        const d = dossierRes.data[0];
        sections.push(`EXISTING DOSSIER:
Score: ${d.score}/100 | Risk: ${d.risk_level}
Bottom Line: ${d.bottom_line}
Risk Signals: ${d.risk_signals?.join("; ") || "None"}
Fit Signals: ${d.fit_signals?.join("; ") || "None"}
Insights: ${d.insights?.join("; ") || "None"}`);
      }

      if (claimsRes.data?.length) {
        sections.push(
          `VERIFIED CLAIMS (${claimsRes.data.length}):\n` +
            claimsRes.data
              .map(
                (c) =>
                  `- [${c.claim_type}] ${c.claim_text} (Source: ${c.source_label}, Confidence: ${c.confidence_score}%)${c.decision_impact ? ` → ${c.decision_impact}` : ""}`
              )
              .join("\n")
        );
      }

      if (warnRes.data?.length) {
        sections.push(
          `WARN ACT LAYOFF NOTICES (${warnRes.data.length}):\n` +
            warnRes.data
              .map(
                (w) =>
                  `- ${w.notice_date}: ${w.employees_affected} employees in ${w.location}${w.reason ? ` (${w.reason})` : ""}`
              )
              .join("\n")
        );
      }

      if (courtRes.data?.length) {
        sections.push(
          `COURT CASES (${courtRes.data.length}):\n` +
            courtRes.data
              .map(
                (c) =>
                  `- ${c.case_name} [${c.case_type || "Unknown type"}] — ${c.status || "Unknown status"}${c.nature_of_suit ? ` (${c.nature_of_suit})` : ""}${c.summary ? `: ${c.summary}` : ""}`
              )
              .join("\n")
        );
      }

      if (candidatesRes.data?.length) {
        sections.push(
          `POLITICAL DONATIONS (${candidatesRes.data.length}):\n` +
            candidatesRes.data
              .map(
                (c) =>
                  `- $${c.amount.toLocaleString()} to ${c.name} (${c.party}) via ${c.donation_type}${c.flagged ? ` ⚠️ ${c.flag_reason}` : ""}`
              )
              .join("\n")
        );
      }

      if (sentimentRes.data?.length) {
        sections.push(
          `WORKER SENTIMENT (${sentimentRes.data.length}):\n` +
            sentimentRes.data
              .map(
                (s) =>
                  `- [${s.sentiment}] ${s.topic ? `(${s.topic}) ` : ""}${s.quote || "No quote"} — ${s.source}`
              )
              .join("\n")
        );
      }

      if (accountabilityRes.data?.length) {
        sections.push(
          `ACCOUNTABILITY SIGNALS (${accountabilityRes.data.length}):\n` +
            accountabilityRes.data
              .map(
                (a) =>
                  `- [${a.severity}] ${a.headline} (${a.signal_type}, Source: ${a.source_name})${a.why_it_matters ? ` — ${a.why_it_matters}` : ""}`
              )
              .join("\n")
        );
      }

      if (aiHrRes.data?.length) {
        sections.push(
          `AI/HR SIGNALS (${aiHrRes.data.length}):\n` +
            aiHrRes.data
              .map(
                (a) =>
                  `- ${a.signal_type} (${a.signal_category}): ${a.tool_name || a.vendor_name || "Unknown tool"} — ${a.status} [${a.confidence}]`
              )
              .join("\n")
        );
      }

      if (diversityRes.data?.length) {
        sections.push(
          `DIVERSITY DISCLOSURES:\n` +
            diversityRes.data
              .map(
                (d) =>
                  `- ${d.disclosure_type} (${d.year}): ${d.is_published ? "Published" : "Not published"}`
              )
              .join("\n")
        );
      }

      signalData = sections.join("\n\n");
    } else {
      signalData = `COMPANY NOT FOUND IN DATABASE: "${employer_name}"\nNo existing records. The report should acknowledge limited data and provide general guidance based on the role and any concerns raised.`;
    }

    // --- 4. Generate AI report ---
    const systemPrompt = `You are Jackyé Clayton's AI assistant at "Who Do I Work For?" (WDIWF), a career intelligence platform. You generate employer intelligence snapshots for job seekers.

Your tone: Direct, empathetic, no corporate fluff. You speak like a trusted career advisor who has seen it all. Be specific, cite the data provided, and flag patterns.

RULES:
- Never use em-dashes (—). Use commas or periods instead.
- Never say "in conclusion" or use corporate jargon
- Be honest about data gaps. Say "we don't have data on X" rather than inventing
- Every claim must reference the signal data provided
- Focus on what matters for someone CONSIDERING working there
- If the company is not in the database, be transparent and give general guidance
- Keep the report scannable with clear sections
- Address the person's specific concerns if provided`;

    const userPrompt = `Generate an employer intelligence snapshot for this request:

REQUESTER INFO:
- Role they're considering: ${role_title}
- Location: ${location || "Not specified"}
- Their concerns: ${concern || "No specific concerns mentioned"}

SIGNAL DATA:
${signalData}

Write the intelligence snapshot with these sections:
1. **The Quick Take** — 2-3 sentences. What's the vibe? Would you take this meeting?
2. **What the Public Record Shows** — Key findings from the data. Political spending, lawsuits, layoffs, worker sentiment. Only include sections where we have data.
3. **Red Flags & Watch Items** — Specific things that should give pause. Be direct.
4. **Green Flags** — Positive signals if any exist.
5. **What to Ask in Your Interview** — 3 specific questions tailored to this company and role.
6. **Bottom Line** — One honest paragraph. "Here's what I'd tell a friend."

If we have limited data, say so clearly and explain what that means for the candidate's decision.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI generation failed:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return json({ error: "AI service is busy. Please try again shortly." }, 429);
      }
      if (aiResponse.status === 402) {
        return json({ error: "AI credits exhausted." }, 402);
      }
      return json({ error: "Failed to generate report" }, 500);
    }

    const aiResult = await aiResponse.json();
    const reportMarkdown =
      aiResult.choices?.[0]?.message?.content || "Report generation failed.";

    // --- 5. Convert markdown to HTML for email ---
    const reportHtml = markdownToHtml(reportMarkdown);

    // --- 6. Email the report to the requester ---
    const requesterSubject = `Your Intelligence Snapshot: ${employer_name}`;
    const requesterHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:680px;margin:0 auto;padding:24px;">
        <div style="border-bottom:3px solid #000;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="font-size:22px;margin:0 0 4px;font-weight:800;">Employer Intelligence Snapshot</h1>
          <p style="font-size:13px;color:#6b7280;margin:0;">${escapeHtml(employer_name)} · ${escapeHtml(role_title)}${location ? ` · ${escapeHtml(location)}` : ""}</p>
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">Generated by Who Do I Work For? · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        ${reportHtml}
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">This snapshot was generated using publicly available data including SEC filings, FEC records, OSHA reports, court records, and verified worker sentiment.</p>
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">WDIWF provides career intelligence and education, not legal or financial advice.</p>
          <p style="font-size:12px;color:#9ca3af;margin:0;">Questions? Reply to this email or visit <a href="https://who-do-i-work-for.lovable.app/contact" style="color:#6366f1;">who-do-i-work-for.lovable.app/contact</a></p>
        </div>
      </div>
    `;

    const requesterText = `Employer Intelligence Snapshot: ${employer_name}\nRole: ${role_title}\n\n${reportMarkdown}\n\n---\nThis snapshot was generated using publicly available data. WDIWF provides career intelligence and education, not legal or financial advice.`;

    await fetch("https://email.lovable.dev/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: requesterSubject,
        html: requesterHtml,
        text: requesterText,
      }),
    });

    // --- 7. Notify Jackyé ---
    const jackyeHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:680px;margin:0 auto;padding:24px;">
        <h1 style="font-size:20px;margin:0 0 16px;">📋 Auto-Generated Intelligence Report Sent</h1>
        <p style="margin:0 0 8px;"><strong>Employer:</strong> ${escapeHtml(employer_name)}</p>
        <p style="margin:0 0 8px;"><strong>Role:</strong> ${escapeHtml(role_title)}</p>
        <p style="margin:0 0 8px;"><strong>Requester:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0 0 8px;"><strong>Location:</strong> ${escapeHtml(location || "Not specified")}</p>
        <p style="margin:0 0 8px;"><strong>Company in DB:</strong> ${company ? "Yes" : "No"}</p>
        <p style="margin:20px 0 8px;"><strong>Concerns:</strong></p>
        <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">${escapeHtml(concern || "None specified")}</div>
        <div style="margin-top:20px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f0f0ff;">
          <p style="font-size:12px;color:#6b7280;margin:0;"><strong>Note:</strong> An AI-generated snapshot was auto-sent to the requester. Review if needed.</p>
        </div>
      </div>
    `;

    await fetch("https://email.lovable.dev/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: CONTACT_EMAIL,
        subject: `[Auto-Sent] Intelligence Report: ${employer_name}`,
        html: jackyeHtml,
        text: `Auto-generated intelligence report sent to ${email} for ${employer_name} (${role_title}).`,
      }),
    });

    // --- 8. Update request status ---
    if (request_id) {
      await supabase
        .from("intelligence_requests")
        .update({ status: "report_sent" })
        .eq("id", request_id);
    }

    return json({ success: true, companyFound: !!company });
  } catch (error) {
    console.error("generate-intelligence-report error:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/** Simple markdown → HTML converter for email */
function markdownToHtml(md: string): string {
  return md
    .split("\n\n")
    .map((block) => {
      block = block.trim();
      if (!block) return "";

      // Headers
      if (block.startsWith("### "))
        return `<h3 style="font-size:16px;font-weight:700;color:#111827;margin:24px 0 8px;">${formatInline(block.slice(4))}</h3>`;
      if (block.startsWith("## "))
        return `<h2 style="font-size:18px;font-weight:700;color:#111827;margin:28px 0 8px;">${formatInline(block.slice(3))}</h2>`;
      if (block.startsWith("# "))
        return `<h1 style="font-size:22px;font-weight:800;color:#111827;margin:28px 0 8px;">${formatInline(block.slice(2))}</h1>`;

      // Numbered/bullet lists
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*[-*•]\s/.test(l) || /^\s*\d+[.)]\s/.test(l))) {
        const items = lines
          .map((l) => `<li style="margin:4px 0;">${formatInline(l.replace(/^\s*[-*•\d.)\s]+/, ""))}</li>`)
          .join("");
        return `<ul style="margin:8px 0;padding-left:20px;">${items}</ul>`;
      }

      // Paragraphs
      return `<p style="font-size:14px;color:#374151;line-height:1.7;margin:8px 0;">${formatInline(block.replace(/\n/g, "<br/>"))}</p>`;
    })
    .join("");
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;">$1</code>');
}
