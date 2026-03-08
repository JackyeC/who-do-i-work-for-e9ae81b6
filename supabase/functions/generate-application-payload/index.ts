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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { company_id, user_id } = await req.json();

    if (!company_id || !user_id) {
      return new Response(JSON.stringify({ error: 'company_id and user_id are required' }), {
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

    // Fetch company signals in parallel
    const [
      { data: aiSignals },
      { data: benefitSignals },
      { data: paySignals },
      { data: sentimentData },
      { data: warnNotices },
    ] = await Promise.all([
      supabase.from('ai_hr_signals').select('signal_type, signal_category, confidence').eq('company_id', company_id).limit(10),
      supabase.from('company_signal_scans').select('signal_type, signal_category, signal_value').eq('company_id', company_id).eq('signal_category', 'worker_benefits').limit(10),
      supabase.from('pay_equity_signals').select('signal_type, signal_category, confidence').eq('company_id', company_id).limit(10),
      supabase.from('company_worker_sentiment').select('overall_rating, sentiment, ai_summary, top_praises, top_complaints').eq('company_id', company_id).order('created_at', { ascending: false }).limit(1),
      supabase.from('company_warn_notices').select('employees_affected, notice_date, layoff_type').eq('company_id', company_id).limit(5),
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

    // Generate matching statement via AI
    const prompt = `You are a Career Strategist writing a "Personal Value Proposition" for a senior professional.

CANDIDATE PROFILE:
- Name: ${profile.full_name || 'Not provided'}
- Bio: ${profile.bio || 'Not provided'}
- Skills: ${(profile.skills || []).join(', ') || 'Not provided'}
- Target role: ${(profile.target_job_titles || []).join(', ') || 'Not provided'}

COMPANY: ${company.name}
- Industry: ${company.industry}
- Civic Footprint Score: ${company.civic_footprint_score}/100

DETECTED COMPANY SIGNALS:
- AI/HR Tools: ${aiToolNames.join(', ') || 'None detected'}
- Worker Benefits: ${benefitNames.join(', ') || 'None detected'}
- Pay Equity Signals: ${payNames.join(', ') || 'None detected'}
- Bias Audit Status: ${biasAuditStatus}
- Worker Sentiment: ${signalSummary.sentiment ? `${signalSummary.sentiment.rating}/5 (${signalSummary.sentiment.sentiment})` : 'No data'}
- WARN Notices: ${signalSummary.warn_notices} on record

ALIGNMENT:
- Score: ${alignmentScore}%
- Matched values: ${matchedSignals.join(', ') || 'None detected'}
- Missing preferences: ${missingSignals.join(', ') || 'None'}

Write a 150-250 word "Personal Value Proposition" with this structure:
1. THE LEAD: Acknowledge a specific tool or practice the company uses (e.g., their AI stack, a specific benefit).
2. THE WHY: Connect that practice to the candidate's values and experience.
3. THE EVIDENCE: Mention one specific detected signal (benefit, audit, pay transparency) and how it aligns with the candidate's commitment.
4. THE CTA: State concretely how the candidate will help optimize or strengthen this value stack.

CONSTRAINTS:
- Never use "synergy," "passionate," "leverage," or "dynamic."
- Write in the tone of a peer-to-peer executive consultation.
- Be specific about detected signals — do not generalize.
- If few signals are detected, be honest about limited data and focus on what IS verified.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a Career Strategist for high-impact professionals. You write Personal Value Propositions that link a candidate\'s profile to a company\'s verified ethical and technical signals. Write like a peer-to-peer executive consultant — no corporate jargon, no flattery.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    let matchingStatement = '';

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      matchingStatement = aiData.choices?.[0]?.message?.content || '';
    } else if (aiResponse.status === 429) {
      matchingStatement = `I'm drawn to ${company.name}'s commitment to transparency, reflected in their ${company.civic_footprint_score}/100 civic footprint score. ${matchedSignals.length > 0 ? `Their verified ${matchedSignals.slice(0, 2).join(' and ').toLowerCase()} align with my professional values.` : ''}`;
    } else if (aiResponse.status === 402) {
      matchingStatement = `${company.name}'s civic transparency practices align with my values as a professional who prioritizes ethical employers.`;
    } else {
      console.error('AI gateway error:', aiResponse.status);
      matchingStatement = `I value ${company.name}'s commitment to corporate transparency and accountability.`;
    }

    return new Response(JSON.stringify({
      success: true,
      payload: {
        fullName: profile.full_name || '',
        email: profile.email || '',
        resumeLink: profile.resume_url || '',
        linkedinUrl: profile.linkedin_url || '',
        matchingStatement: matchingStatement.trim(),
        alignmentScore,
        matchedSignals,
        missingSignals,
        companyName: company.name,
        civicScore: company.civic_footprint_score,
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
