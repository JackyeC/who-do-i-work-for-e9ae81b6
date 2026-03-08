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
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get auth user from JWT
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Also accept user_id from body (for edge function calls)
    const body = await req.json().catch(() => ({}));
    userId = userId || body.user_id;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user settings
    const { data: settings } = await supabase
      .from('auto_apply_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings || settings.is_paused || !settings.is_enabled) {
      return new Response(JSON.stringify({ processed: 0, reason: 'Auto-apply is paused or disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Count today's completed
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayCompleted } = await supabase
      .from('apply_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('processed_at', todayStart.toISOString());

    const remaining = settings.max_daily_applications - (todayCompleted || 0);
    if (remaining <= 0) {
      return new Response(JSON.stringify({ processed: 0, reason: 'Daily limit reached' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get queued items up to remaining limit
    const { data: queueItems } = await supabase
      .from('apply_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .order('alignment_score', { ascending: false })
      .limit(remaining);

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ processed: 0, reason: 'No queued items' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const item of queueItems) {
      // Mark as processing
      await supabase
        .from('apply_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      try {
        // Call the existing generate-application-payload internally
        const payloadUrl = `${supabaseUrl}/functions/v1/generate-application-payload`;
        const res = await fetch(payloadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ company_id: item.company_id, user_id: userId }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Payload generation failed: ${res.status} ${errText}`);
        }

        const result = await res.json();

        if (result?.payload) {
          // Update queue item with generated payload
          await supabase
            .from('apply_queue')
            .update({
              status: 'completed',
              generated_payload: result.payload,
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id);

          // Also track in applications_tracker
          await supabase.from('applications_tracker').insert({
            user_id: userId,
            company_id: item.company_id,
            job_id: item.job_id || null,
            job_title: item.job_title,
            company_name: item.company_name,
            alignment_score: item.alignment_score,
            matched_signals: item.matched_signals,
            application_link: item.application_url,
            status: 'Submitted',
            applied_at: new Date().toISOString(),
          });

          processed++;
        } else {
          throw new Error('No payload returned');
        }
      } catch (err: any) {
        console.error(`Queue item ${item.id} failed:`, err);
        await supabase
          .from('apply_queue')
          .update({
            status: 'failed',
            error_message: err.message || 'Unknown error',
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }

    return new Response(JSON.stringify({ processed, total: queueItems.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('process-apply-queue error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
