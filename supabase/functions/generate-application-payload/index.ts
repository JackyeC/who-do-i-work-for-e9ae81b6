const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { company_id } = body;

    // Determine user_id: trust body only for internal service-role calls,
    // otherwise derive exclusively from JWT
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const isServiceCall = token === serviceKey;

    let user_id: string;
    if (isServiceCall) {
      // Internal call from process-apply-queue using service role key
      user_id = body.user_id;
    } else {
      // Normal user call — derive from JWT
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      user_id = user.id;
    }

    if (!company_id || !user_id) {
      return new Response(JSON.stringify({ error: 'company_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch company data
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch company signals + public stances in parallel
    const [
      { data: aiSignals },
      { data: benefitSignals },
      { data: paySignals },
      { data: sentimentData },
      { data: warnNotices },
      { data: publicStances },
    ] = await Promise.all([
      supabase.from('ai_hr_signals').select('signal_type, signal_category, confidence').eq('company_id', company_id).limit(10),
      supabase.from('company_signal_scans').select('signal_type, signal_category, signal_value').eq('company_id', company_id).eq('signal_category', 'worker_benefits').limit(10),
      supabase.from('pay_equity_signals').select('signal_type, signal_category, confidence').eq('company_id', company_id).limit(10),
      supabase.from('company_worker_sentiment').select('overall_rating, sentiment, ai_summary, top_praises, top_complaints').eq('company_id', company_id).order('created_at', { ascending: false }).limit(1),
      supabase.from('company_warn_notices').select('employees_affected, notice_date, layoff_type').eq('company_id', company_id).limit(5),
      supabase.from('company_public_stances').select('topic, public_position, spending_reality, gap').eq('company_id', company_id).limit(10),
    ]);

    // Fetch user preferences
    const { data: preferences } = await supabase
      .from('job_match_preferences')
      .select('signal_key, signal_label, is_required')
      .eq('user_id', user_id);

    // Build signal summary for AI
    const signalSummary = {
      ai_hiring: (aiSignals || []).map(s => s.signal_type),
      worker_benefits: (benefitSignals || []).map(s => `${s.signal_type}: ${s.signal_value}`),
      pay_equity: (paySignals || []).map(s => s.signal_type),
      sentiment: sentimentData?.[0] ? {
        rating: sentimentData[0].overall_rating,
        sentiment: sentimentData[0].sentiment,
        praises: sentimentData[0].top_praises,
        complaints: sentimentData[0].top_complaints,
      } : null,
      warn_notices: (warnNotices || []).length,
      civic_footprint_score: company.civic_footprint_score,
    };

    // Calculate alignment score
    let alignmentScore = company.civic_footprint_score || 0;
    const matchedSignals: string[] = [];
    const missingSignals: string[] = [];

    for (const pref of (preferences || [])) {
      const hasSignal = checkSignalPresent(pref.signal_key, signalSummary);
      if (hasSignal) {
        matchedSignals.push(pref.signal_label);
        alignmentScore = Math.min(100, alignmentScore + 5);
      } else if (pref.is_required) {
        missingSignals.push(pref.signal_label);
        alignmentScore = Math.max(0, alignmentScore - 10);
      }
    }

    // Build detailed signal descriptions for the prompt
    const aiToolNames = (aiSignals || []).map(s => s.signal_type).filter(Boolean);
    const benefitNames = (benefitSignals || []).map(s => `${s.signal_type}: ${s.signal_value}`).filter(Boolean);
    const payNames = (paySignals || []).map(s => s.signal_type).filter(Boolean);
    const biasAuditStatus = aiToolNames.some(s => s.toLowerCase().includes('bias audit')) ? 'Verified Bias Audit' : 'No verified audit';

    // Extract detected AI vendor name
    const aiVendorSignal = (aiSignals || []).find(s => s.signal_type === 'ai_vendor_detected');
    const detectedVendor = aiVendorSignal?.evidence_text?.replace('Known AI vendor: ', '') || 'Unknown';

    // Generate cover letter via AI with tool calling
    const prompt = `Write a short cover letter (120–170 words max) for this candidate applying to ${company.name}.

CANDIDATE:
- Name: ${profile.full_name || 'Not provided'}
- Bio: ${profile.bio || 'Not provided'}
- Skills: ${(profile.skills || []).join(', ') || 'Not provided'}
- Target roles: ${(profile.target_job_titles || []).join(', ') || 'Not provided'}

COMPANY: ${company.name} (${company.industry})
- Civic Footprint Score: ${company.civic_footprint_score}/100
- AI/HR Vendor: ${detectedVendor}
- AI/HR Tools: ${aiToolNames.join(', ') || 'None detected'}
- Worker Benefits: ${benefitNames.join(', ') || 'None detected'}
- Pay Equity Signals: ${payNames.join(', ') || 'None detected'}
- Bias Audit Status: ${biasAuditStatus}
- Worker Sentiment: ${signalSummary.sentiment ? `${signalSummary.sentiment.rating}/5 (${signalSummary.sentiment.sentiment})` : 'No data'}
- WARN Notices: ${signalSummary.warn_notices} on record
- Alignment: ${alignmentScore}% | Matched signals: ${matchedSignals.join(', ') || 'None'} | Missing: ${missingSignals.join(', ') || 'None'}

VOICE RULES (follow exactly):
- Write like an experienced professional talking to another professional. Direct, confident, warm.
- Short sentences. Plain English. No buzzwords, no filler, no consulting-speak.
- NEVER use headers like "THE WHY" / "THE LEAD" / "THE EVIDENCE" / "THE CTA".
- No phrases like "I am writing to express my interest" or "I believe my skills align."
- Sound like a real person who is genuinely interested, not a template.

STRUCTURE (no labels, just flow naturally):
1. Opening (1-2 sentences): Why this role or company caught their eye. Be specific to something the company actually does.
2. Alignment (2-3 sentences): How their background connects to the company's work. Reference a real signal if available.
3. Proof (2-3 sentences): One concrete example — a result, a project, a leadership moment.
4. Close (1 sentence): Confident, friendly, expresses interest in a conversation.

The letter must read like something a smart, busy professional would actually send. If it sounds corporate or robotic, it's wrong.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You write cover letters that sound human, sharp, and credible. You never sound like a template or a consulting report. You write the way a confident professional speaks — clean, direct, and warm. Every word earns its place.' },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_payload',
            description: 'Generate a cover letter and supporting application fields.',
            parameters: {
              type: 'object',
              properties: {
                cover_letter: {
                  type: 'string',
                  description: 'The full cover letter, 120-170 words. No headers, no labels. Just clean paragraphs that flow naturally. Must sound like a real human wrote it.',
                },
                one_line_pitch: {
                  type: 'string',
                  description: 'A single compelling sentence (under 25 words) that captures why this candidate fits this company. Used as a subject line or intro hook.',
                },
                values_alignment_note: {
                  type: 'string',
                  description: 'One sentence noting a specific company practice or signal the candidate values. Written naturally, not like a checkbox.',
                },
              },
              required: ['cover_letter', 'one_line_pitch', 'values_alignment_note'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'generate_payload' } },
      }),
    });

    let matchingStatement = '';
    let targetedIntro = '';
    let valuesCheck = '';

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          matchingStatement = parsed.cover_letter || '';
          targetedIntro = parsed.one_line_pitch || '';
          valuesCheck = parsed.values_alignment_note || '';
        } catch (e) {
          console.error('Failed to parse tool call:', e);
          matchingStatement = aiData.choices?.[0]?.message?.content || '';
        }
      } else {
        matchingStatement = aiData.choices?.[0]?.message?.content || '';
      }
    } else if (aiResponse.status === 429) {
      targetedIntro = `Experienced professional interested in ${company.name}'s approach to ${matchedSignals[0]?.toLowerCase() || 'workplace transparency'}.`;
      matchingStatement = `${company.name} caught my attention because of your ${company.civic_footprint_score}/100 civic footprint score — that kind of transparency is rare. My background in ${(profile.skills || []).slice(0, 2).join(' and ') || 'this space'} maps directly to the work you're doing. I'd love to talk about how I can contribute.`;
      valuesCheck = matchedSignals.length > 0 ? `I value ${company.name}'s commitment to ${matchedSignals.slice(0, 2).join(' and ').toLowerCase()}.` : `I look for employers who prioritize transparency.`;
    } else if (aiResponse.status === 402) {
      targetedIntro = `${company.name}'s transparency practices stand out.`;
      matchingStatement = `I'm drawn to ${company.name}'s approach to civic accountability. My experience aligns well with your mission, and I'd welcome a conversation about the role.`;
      valuesCheck = 'I prioritize employers committed to ethical hiring and workforce transparency.';
    } else {
      console.error('AI gateway error:', aiResponse.status);
      targetedIntro = `Interested in ${company.name}'s mission and culture.`;
      matchingStatement = `${company.name}'s work in ${company.industry} resonates with my background. I'd love to explore how my experience could contribute to your team.`;
      valuesCheck = 'Ethical employment practices matter to me.';
    }

    // Build advocacy dossier data for client-side PDF generation
    const advocacyData = {
      candidateName: profile.full_name || 'Candidate',
      candidateEmail: profile.email || '',
      candidateSkills: profile.skills || [],
      candidateTargetRoles: profile.target_job_titles || [],
      candidateLinkedin: profile.linkedin_url || '',
      candidateBio: profile.bio || '',
      companyName: company.name,
      companyIndustry: company.industry,
      alignmentScore,
      civicFootprintScore: company.civic_footprint_score,
      matchedSignals,
      missingSignals,
      publicStances: (publicStances || []).map((s: any) => ({
        topic: s.topic,
        public_position: s.public_position,
        spending_reality: s.spending_reality,
        gap: s.gap,
      })),
      verificationDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    return new Response(JSON.stringify({
      success: true,
      payload: {
        fullName: profile.full_name || '',
        email: profile.email || '',
        resumeLink: profile.resume_url || '',
        linkedinUrl: profile.linkedin_url || '',
        matchingStatement: matchingStatement.trim(),
        targetedIntro: targetedIntro.trim(),
        hrTechAlignment: '', // deprecated field kept for backwards compat
        valuesCheck: valuesCheck.trim(),
        detectedVendor,
        biasAuditStatus,
        alignmentScore,
        matchedSignals,
        missingSignals,
        companyName: company.name,
        civicScore: company.civic_footprint_score,
        careerSiteUrl: company.careers_url || null,
        advocacyData,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('generate-application-payload error:', error);

    if (error instanceof Response) {
      const status = error.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function checkSignalPresent(signalKey: string, signals: any): boolean {
  switch (signalKey) {
    case 'worker_benefits':
      return (signals.worker_benefits || []).length > 0;
    case 'ai_transparency':
      return (signals.ai_hiring || []).some((s: string) =>
        s.toLowerCase().includes('transparency') || s.toLowerCase().includes('disclosure'));
    case 'bias_audit_completed':
      return (signals.ai_hiring || []).some((s: string) =>
        s.toLowerCase().includes('bias audit') || s.toLowerCase().includes('audit'));
    case 'pay_transparency':
      return (signals.pay_equity || []).length > 0;
    case 'salary_range_posted':
      return (signals.pay_equity || []).some((s: string) =>
        s.toLowerCase().includes('salary') || s.toLowerCase().includes('range'));
    case 'worker_sentiment':
      return signals.sentiment?.rating != null && signals.sentiment.rating >= 3.0;
    default:
      return false;
  }
}
