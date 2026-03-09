import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function extractTextFromFile(fileData: Blob, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  
  if (ext === "docx") {
    const arrayBuffer = await fileData.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else if (ext === "pdf") {
    // Use dynamic import from lib path to avoid pdf-parse test file filesystem issue in Deno
    const { default: pdfParse } = await import("npm:pdf-parse/lib/pdf-parse.js");
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const result = await pdfParse(buffer);
    return result.text;
  } else if (ext === "txt" || ext === "md") {
    return await fileData.text();
  } else {
    // Fallback: try as text
    const text = await fileData.text();
    return text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { documentId } = await req.json();
    if (!documentId) throw new Error("Missing documentId");

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: doc, error: docError } = await adminClient
      .from("user_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();
    if (docError || !doc) throw new Error("Document not found");

    await adminClient.from("user_documents").update({ status: "parsing" }).eq("id", documentId);

    // Download the file
    const { data: fileData, error: fileError } = await adminClient.storage
      .from("career_docs")
      .download(doc.file_path);
    if (fileError) throw new Error(`File download failed: ${fileError.message}`);

    // Extract text based on file type
    const documentText = await extractTextFromFile(fileData, doc.original_filename || doc.file_path);

    if (documentText.length < 20) {
      await adminClient.from("user_documents").update({ status: "error", confidence_level: "low" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: "Insufficient text extracted from document" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracted text length:", documentText.length, "chars");
    console.log("First 500 chars:", documentText.slice(0, 500));

    // Build prompt based on document type
    const docType = doc.document_type;
    let systemPrompt = "";
    let toolName = "";
    let toolParams: any = {};

    if (docType === "offer_letter") {
      systemPrompt = `You are a specialized employment document analyzer. Extract structured signals from this offer letter. Detect: salary, bonus, equity, vesting schedule, non-compete language, arbitration clause, severance terms, remote policy signals. Flag risk signals like mandatory arbitration or broad non-competes. This is signal detection, NOT legal advice.`;
      toolName = "parse_offer_letter";
      toolParams = {
        type: "object",
        properties: {
          financials: {
            type: "object",
            properties: {
              base_salary: { type: "string" }, bonus: { type: "string" }, equity: { type: "string" },
              vesting_schedule: { type: "string" }, signing_bonus: { type: "string" }, severance: { type: "string" },
            },
            additionalProperties: false,
          },
          risk_signals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["arbitration", "non_compete", "non_solicitation", "clawback", "at_will", "other"] },
                severity: { type: "string", enum: ["high", "medium", "low"] },
                summary: { type: "string" },
                extracted_text: { type: "string" },
              },
              required: ["type", "severity", "summary"], additionalProperties: false,
            },
          },
          work_arrangement: {
            type: "object",
            properties: { remote_policy: { type: "string" }, location: { type: "string" }, start_date: { type: "string" } },
            additionalProperties: false,
          },
          overall_confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["financials", "risk_signals", "work_arrangement", "overall_confidence"],
        additionalProperties: false,
      };
    } else if (docType === "resume") {
      systemPrompt = `You are a career profile analyzer. Extract structured career signals from this resume: full name, job titles held, industries worked in, skills (technical and soft), seniority level (entry/mid/senior/executive), management scope, years of experience, and generate a concise professional bio (2-3 sentences) summarizing their career.`;
      toolName = "parse_resume";
      toolParams = {
        type: "object",
        properties: {
          full_name: { type: "string", description: "The person's full name" },
          professional_bio: { type: "string", description: "A 2-3 sentence professional summary based on their experience" },
          job_titles: { type: "array", items: { type: "string" } },
          industries: { type: "array", items: { type: "string" } },
          skills: { type: "array", items: { type: "string" } },
          seniority_level: { type: "string", enum: ["entry", "mid", "senior", "executive"] },
          management_scope: { type: "string" },
          years_experience: { type: "number" },
          education: { type: "array", items: { type: "string" } },
          linkedin_url: { type: "string", description: "LinkedIn URL if present" },
          overall_confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["job_titles", "industries", "skills", "seniority_level", "overall_confidence"],
        additionalProperties: false,
      };
    } else if (docType === "job_description") {
      systemPrompt = `You are a job posting analyzer. Extract structured signals from this job description: role title, required skills, salary transparency (whether salary is disclosed), benefits signals, location requirements, hiring technology signals (ATS platforms like Greenhouse, Lever, Workday detected in URLs or text), and any AI hiring tool references.`;
      toolName = "parse_job_description";
      toolParams = {
        type: "object",
        properties: {
          role_title: { type: "string" },
          required_skills: { type: "array", items: { type: "string" } },
          preferred_skills: { type: "array", items: { type: "string" } },
          salary_transparency: { type: "object", properties: { disclosed: { type: "boolean" }, range: { type: "string" } }, additionalProperties: false },
          benefits_signals: { type: "array", items: { type: "string" } },
          location: { type: "object", properties: { requirement: { type: "string" }, remote_eligible: { type: "boolean" } }, additionalProperties: false },
          hiring_tech_signals: { type: "array", items: { type: "string" } },
          seniority_level: { type: "string", enum: ["entry", "mid", "senior", "executive"] },
          overall_confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["role_title", "required_skills", "overall_confidence"],
        additionalProperties: false,
      };
    } else {
      throw new Error("Unsupported document type");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${docType.replace("_", " ")}:\n---\n${documentText.slice(0, 15000)}\n---` },
        ],
        tools: [{ type: "function", function: { name: toolName, description: `Extract structured signals from a ${docType.replace("_", " ")}.`, parameters: toolParams } }],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      await adminClient.from("user_documents").update({ status: "error", confidence_level: "low" }).eq("id", documentId);

      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured output");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Update document with parsed signals
    await adminClient.from("user_documents").update({
      parsed_signals: parsed,
      parsed_summary: { document_type: docType, signal_count: Object.keys(parsed).length },
      confidence_level: parsed.overall_confidence || "medium",
      status: "parsed",
    }).eq("id", documentId);

    // Auto-update career profile from any document type
    const { data: existing } = await adminClient.from("user_career_profile").select("*").eq("user_id", user.id).single();
    const profileUpdates: Record<string, any> = { user_id: user.id, auto_generated: true };

    if (docType === "resume") {
      profileUpdates.skills = parsed.skills || [];
      profileUpdates.industries = parsed.industries || [];
      profileUpdates.seniority_level = parsed.seniority_level || null;
      profileUpdates.job_titles = parsed.job_titles || [];
      profileUpdates.management_scope = parsed.management_scope || null;
    } else if (docType === "offer_letter") {
      // Extract salary info from offer to enrich profile
      const salary = parsed.financials?.base_salary;
      if (salary) {
        const numericSalary = parseInt(String(salary).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(numericSalary) && numericSalary > 0) {
          profileUpdates.salary_range_min = Math.round(numericSalary * 0.9);
          profileUpdates.salary_range_max = Math.round(numericSalary * 1.15);
        }
      }
      const location = parsed.work_arrangement?.location;
      if (location && location !== "Not specified") {
        profileUpdates.preferred_locations = [location];
      }
    } else if (docType === "job_description") {
      // Merge skills from JD into existing profile skills
      const jdSkills = parsed.required_skills || [];
      const existingSkills = existing?.skills || [];
      const mergedSkills = [...new Set([...existingSkills, ...jdSkills])];
      if (mergedSkills.length > 0) profileUpdates.skills = mergedSkills;

      if (parsed.seniority_level) profileUpdates.seniority_level = parsed.seniority_level;

      const loc = parsed.location?.requirement;
      if (loc && loc !== "Not specified") {
        const existingLocs = existing?.preferred_locations || [];
        profileUpdates.preferred_locations = [...new Set([...existingLocs, loc])];
      }
    }

    if (existing) {
      await adminClient.from("user_career_profile").update(profileUpdates).eq("user_id", user.id);
    } else {
      await adminClient.from("user_career_profile").insert(profileUpdates);
    }

    return new Response(JSON.stringify({ success: true, documentId, parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("parse-career-document error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
