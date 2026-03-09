import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function tryExtractText(fileData: Blob, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (ext === "txt" || ext === "md") {
    return await fileData.text();
  }

  if (ext === "docx") {
    try {
      const mammoth = await import("npm:mammoth@1.6.0");
      const ab = await fileData.arrayBuffer();
      const result = await mammoth.default.extractRawText({ arrayBuffer: ab });
      if (result.value && result.value.trim().length > 100) {
        return result.value;
      }
      console.log("Mammoth returned short text:", result.value?.length || 0, "chars");
    } catch (e) {
      console.log("Mammoth failed:", e.message);
    }

    // JSZip fallback
    try {
      const JSZip = (await import("npm:jszip@3.10.1")).default;
      const ab = await fileData.arrayBuffer();
      const zip = await JSZip.loadAsync(ab);
      const docXml = await zip.file("word/document.xml")?.async("string");
      if (docXml) {
        const text = docXml
          .replace(/<w:br[^>]*\/>/g, "\n")
          .replace(/<\/w:p>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
          .replace(/\n{3,}/g, "\n\n").trim();
        if (text.length > 100) return text;
        console.log("JSZip returned short text:", text.length, "chars");
      }
    } catch (e) {
      console.log("JSZip failed:", e.message);
    }
  }

  if (ext === "pdf") {
    try {
      const { default: pdfParse } = await import("npm:pdf-parse/lib/pdf-parse.js");
      const ab = await fileData.arrayBuffer();
      const result = await pdfParse(new Uint8Array(ab));
      if (result.text?.trim().length > 100) return result.text;
      console.log("pdf-parse returned short text:", result.text?.length || 0, "chars");
    } catch (e) {
      console.log("pdf-parse failed:", e.message);
    }
  }

  return "";
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const mimes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
  };
  return mimes[ext] || "application/octet-stream";
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

    const { data: fileData, error: fileError } = await adminClient.storage
      .from("career_docs")
      .download(doc.file_path);
    if (fileError) throw new Error(`File download failed: ${fileError.message}`);

    const filename = doc.original_filename || doc.file_path;

    // Try text extraction first
    const documentText = await tryExtractText(fileData, filename);
    console.log("Text extraction result:", documentText.length, "chars");

    // Decide how to send to AI: text or raw file as base64
    const useDirectFile = documentText.length < 100;
    let fileBase64 = "";
    if (useDirectFile) {
      console.log("Text extraction insufficient, sending raw file to Gemini for direct parsing");
      const ab = await fileData.arrayBuffer();
      fileBase64 = arrayBufferToBase64(ab);
    }

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
      systemPrompt = `You are an expert resume parser. Your job is to extract REAL data from this resume.

IMPORTANT RULES:
- Extract the ACTUAL job titles from work experience sections (e.g. "Senior Software Engineer", "VP of Marketing")
- Extract ALL skills, tools, and technologies mentioned
- Identify industries based on companies worked at
- NEVER return "Unknown", "N/A", "Not Specified", or any placeholder
- If you truly cannot find a field, return null or empty array []
- The document may be a DOCX file sent as binary - parse whatever you can see`;
      toolName = "parse_resume";
      toolParams = {
        type: "object",
        properties: {
          full_name: { type: ["string", "null"], description: "The person's full name" },
          professional_bio: { type: ["string", "null"], description: "2-3 sentence professional summary" },
          job_titles: { type: "array", items: { type: "string" }, description: "All job titles from work experience" },
          industries: { type: "array", items: { type: "string" }, description: "Industries worked in" },
          skills: { type: "array", items: { type: "string" }, description: "Technical and soft skills" },
          seniority_level: { type: "string", enum: ["entry", "mid", "senior", "executive"] },
          management_scope: { type: ["string", "null"] },
          years_experience: { type: ["number", "null"] },
          education: { type: "array", items: { type: "string" } },
          linkedin_url: { type: ["string", "null"] },
          overall_confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["job_titles", "skills", "overall_confidence"],
        additionalProperties: false,
      };
    } else if (docType === "job_description") {
      systemPrompt = `You are a job posting analyzer. Extract structured signals from this job description.`;
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

    // Build messages for AI
    const userContent: any[] = [];

    if (useDirectFile) {
      // Send the raw file as base64 inline_data for Gemini to read directly
      userContent.push({
        type: "file",
        file: {
          filename: filename,
          content_type: getMimeType(filename),
          data: fileBase64,
        },
      });
      userContent.push({
        type: "text",
        text: `This is a ${docType.replace("_", " ")} document. Please parse it and extract all structured data. Do NOT return Unknown or N/A for any field - only return data you actually find, or empty arrays/null.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Here is the extracted text from the ${docType.replace("_", " ")}. Parse it carefully:\n\n---\n${documentText.slice(0, 15000)}\n---`,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: useDirectFile ? userContent : userContent[0].text },
        ],
        tools: [{ type: "function", function: { name: toolName, description: `Extract structured data from a ${docType.replace("_", " ")}.`, parameters: toolParams } }],
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
    console.log("AI response received, choices:", aiResult.choices?.length);

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiResult, null, 2));
      throw new Error("AI did not return structured output");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    console.log("Parsed result:", JSON.stringify(parsed, null, 2));

    // Clean arrays - remove junk values
    const junkValues = new Set(["unknown", "n/a", "not specified", "none", "null", "not available", "not found", ""]);
    const cleanArray = (arr: any[]) =>
      (arr || []).filter((v: string) => v && typeof v === "string" && !junkValues.has(v.toLowerCase().trim()));

    if (parsed.job_titles) parsed.job_titles = cleanArray(parsed.job_titles);
    if (parsed.skills) parsed.skills = cleanArray(parsed.skills);
    if (parsed.industries) parsed.industries = cleanArray(parsed.industries);
    if (parsed.education) parsed.education = cleanArray(parsed.education);

    // Update document
    await adminClient.from("user_documents").update({
      parsed_signals: parsed,
      parsed_summary: { document_type: docType, signal_count: Object.keys(parsed).length },
      confidence_level: parsed.overall_confidence || "medium",
      status: "parsed",
    }).eq("id", documentId);

    // Auto-update career profile
    const { data: existing } = await adminClient.from("user_career_profile").select("*").eq("user_id", user.id).single();
    const profileUpdates: Record<string, any> = { user_id: user.id, auto_generated: true };

    if (docType === "resume") {
      if (parsed.job_titles?.length > 0) profileUpdates.job_titles = parsed.job_titles;
      if (parsed.skills?.length > 0) profileUpdates.skills = parsed.skills;
      if (parsed.industries?.length > 0) profileUpdates.industries = parsed.industries;
      if (parsed.seniority_level) profileUpdates.seniority_level = parsed.seniority_level;
      if (parsed.management_scope) profileUpdates.management_scope = parsed.management_scope;
    } else if (docType === "offer_letter") {
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

    // Only update profile if we have meaningful data
    const hasMeaningfulData = profileUpdates.job_titles?.length > 0 || profileUpdates.skills?.length > 0 || profileUpdates.industries?.length > 0;

    if (hasMeaningfulData || docType !== "resume") {
      if (existing) {
        await adminClient.from("user_career_profile").update(profileUpdates).eq("user_id", user.id);
      } else {
        await adminClient.from("user_career_profile").insert(profileUpdates);
      }
      console.log("Profile updated with:", Object.keys(profileUpdates).join(", "));
    } else {
      console.log("No meaningful data extracted, profile NOT updated");
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
