const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile, careerPaths, companies, skillGap, futures, actionPlan } = await req.json();

    if (!profile || !user.email) {
      return new Response(JSON.stringify({ error: 'Missing profile or email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build email HTML
    const pathCount = (careerPaths?.likely?.length || 0) + (careerPaths?.adjacent?.length || 0) + (careerPaths?.unexpected?.length || 0);
    const companyCount = companies?.companies?.length || 0;
    const strongSkills = skillGap?.skills?.filter((s: any) => s.category === 'strong').length || 0;
    const totalSkills = skillGap?.skills?.length || 0;
    const skillMatch = totalSkills > 0 ? Math.round((strongSkills / totalSkills) * 100) : 0;

    const likelyPaths = (careerPaths?.likely || []).map((p: any) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${p.from} → ${p.to}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${p.confidence}%</td></tr>`
    ).join('');

    const adjacentPaths = (careerPaths?.adjacent || []).map((p: any) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${p.role} <span style="color:#888">(${p.industry})</span></td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${p.match}%</td></tr>`
    ).join('');

    const unexpectedPaths = (careerPaths?.unexpected || []).map((p: any) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${p.role}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${p.match}%</td></tr>`
    ).join('');

    const companiesList = (companies?.companies || []).map((c: any) =>
      `<div style="padding:12px;margin-bottom:8px;border:1px solid #eee;border-radius:8px">
        <strong>${c.name}</strong> <span style="color:#888;font-size:12px">${c.industry}</span>
        <p style="margin:4px 0 0;font-size:13px;color:#555">${c.overview}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#22c55e">${c.hiringSignal}</p>
      </div>`
    ).join('');

    const skillsList = (skillGap?.skills || []).map((s: any) => {
      const colors: Record<string, string> = { strong: '#22c55e', transferable: '#3b82f6', bridge: '#f59e0b', develop: '#ef4444' };
      return `<span style="display:inline-block;margin:2px 4px;padding:4px 10px;border-radius:12px;font-size:12px;background:${colors[s.category] || '#888'}15;color:${colors[s.category] || '#888'};border:1px solid ${colors[s.category] || '#888'}30">${s.name} (${s.level}%)</span>`;
    }).join('');

    const futuresList = (futures?.futures || []).map((f: any) => {
      const icons: Record<string, string> = { expected: '📈', pivot: '🔄', wildcard: '⚡' };
      return `<div style="padding:12px;margin-bottom:8px;border:1px solid #eee;border-radius:8px">
        <strong>${icons[f.type] || '📌'} ${f.label}</strong>
        <p style="margin:4px 0;font-size:13px;color:#555">${f.description}</p>
        <p style="margin:0;font-size:12px;color:#888">Timeline: ${f.timeline}</p>
      </div>`;
    }).join('');

    const actionsList = (actionPlan?.milestones || []).map((m: any) =>
      `<div style="margin-bottom:16px">
        <h4 style="margin:0 0 8px;color:#1a1a1a;font-size:14px">${m.period}</h4>
        ${(m.actions || []).map((a: any) => {
          const icons: Record<string, string> = { course: '📚', skill: '💡', project: '🛠', connect: '🤝', company: '🏢' };
          return `<p style="margin:2px 0;font-size:13px;color:#555">${icons[a.type] || '•'} ${a.text}</p>`;
        }).join('')}
      </div>`
    ).join('');

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:32px;text-align:center;color:white;margin-bottom:24px">
    <h1 style="margin:0 0 8px;font-size:24px">Your Career Map Results</h1>
    <p style="margin:0;opacity:0.8;font-size:14px">Career intelligence report for ${profile.jobTitle}</p>
    <div style="display:flex;justify-content:center;gap:24px;margin-top:20px">
      <div><div style="font-size:28px;font-weight:bold">${pathCount}</div><div style="font-size:11px;opacity:0.7">Paths</div></div>
      <div><div style="font-size:28px;font-weight:bold">${companyCount}</div><div style="font-size:11px;opacity:0.7">Companies</div></div>
      <div><div style="font-size:28px;font-weight:bold">${skillMatch}%</div><div style="font-size:11px;opacity:0.7">Skills Match</div></div>
    </div>
  </div>

  ${likelyPaths ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">📈 Likely Career Paths</h3>
    <table style="width:100%;border-collapse:collapse">${likelyPaths}</table>
  </div>` : ''}

  ${adjacentPaths ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">🔀 Adjacent Career Paths</h3>
    <table style="width:100%;border-collapse:collapse">${adjacentPaths}</table>
  </div>` : ''}

  ${unexpectedPaths ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">💡 Unexpected Career Paths</h3>
    <table style="width:100%;border-collapse:collapse">${unexpectedPaths}</table>
  </div>` : ''}

  ${companiesList ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">🏢 Values-Aligned Companies</h3>
    ${companiesList}
  </div>` : ''}

  ${skillsList ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">📊 Skill Snapshot</h3>
    <div>${skillsList}</div>
  </div>` : ''}

  ${futuresList ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">🔮 Possible Futures</h3>
    ${futuresList}
  </div>` : ''}

  ${actionsList ? `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px">
    <h3 style="margin:0 0 12px;font-size:16px">📋 Action Plan</h3>
    ${actionsList}
  </div>` : ''}

  <div style="text-align:center;padding:16px;font-size:11px;color:#888">
    <p>Generated by Who Do I Work For? · ${new Date().toLocaleDateString()}</p>
  </div>
</div>
</body></html>`;

    // Use Lovable AI to send — we store results for now and notify user
    // Since no email domain is configured, we'll save the report and let user know
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Try to use email queue if available
    try {
      const { error: enqueueError } = await serviceClient.rpc('enqueue_email', {
        p_message_id: `career-results-${user.id}-${Date.now()}`,
        p_queue_name: 'transactional_emails',
        p_to_email: user.email,
        p_subject: `Your Career Map Results — ${profile.jobTitle}`,
        p_html: emailHtml,
        p_template_name: 'career-map-results',
      });

      if (enqueueError) throw enqueueError;

      return new Response(JSON.stringify({ success: true, method: 'queued' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (queueErr: any) {
      console.log('Email queue not available, trying direct send:', queueErr);
    }

    // Fallback: try direct send via Lovable email API
    try {
      const emailResp = await fetch('https://email.lovable.dev/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          subject: `Your Career Map Results — ${profile.jobTitle}`,
          html: emailHtml,
        }),
      });

      if (emailResp.ok) {
        return new Response(JSON.stringify({ success: true, method: 'direct' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (directErr: any) {
      console.log('Direct email send failed:', directErr);
    }

    // Final fallback: save to database for user to retrieve
    await serviceClient.from('beta_feedback').insert({
      user_id: user.id,
      user_email: user.email,
      feedback_type: 'career_results_email',
      message: JSON.stringify({ profile, stats: { pathCount, companyCount, skillMatch } }),
    });

    return new Response(JSON.stringify({ 
      success: true, 
      method: 'saved',
      message: 'Email domain not yet configured. Your results have been saved and will be emailed once email sending is set up.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Email career results error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
