const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Expanded module mapping: page_type → scan modules to re-run
const PAGE_TYPE_TO_MODULES: Record<string, string[]> = {
  careers: ['ai-hr-scan', 'worker-benefits-scan', 'pay-equity-scan'],
  jobs: ['ai-hr-scan', 'pay-equity-scan'],
  benefits: ['worker-benefits-scan', 'pay-equity-scan'],
  leadership: ['ideology-scan', 'social-scan'],
  esg: ['ai-accountability-scan', 'worker-benefits-scan', 'ideology-scan'],
  diversity: ['worker-benefits-scan', 'pay-equity-scan', 'worker-sentiment-scan'],
  newsroom: ['social-scan', 'ideology-scan'],
  policy: ['sync-openfec', 'sync-lobbying', 'ideology-scan'],
  privacy: ['ai-hr-scan', 'ai-accountability-scan'],
};

// Friendly labels for page types
const PAGE_TYPE_LABELS: Record<string, string> = {
  careers: 'Careers',
  jobs: 'Job Listings',
  benefits: 'Benefits',
  leadership: 'Leadership',
  esg: 'ESG / Impact',
  diversity: 'Diversity & Workforce',
  newsroom: 'Newsroom / Press',
  policy: 'Political Disclosure',
  privacy: 'Privacy / AI Disclosure',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log('[browse-ai-webhook] Received:', JSON.stringify(payload).slice(0, 500));

    const robotId = payload.robot?.id || payload.robotId;
    const taskData = payload.task || payload;

    if (!robotId) {
      return new Response(JSON.stringify({ error: 'No robotId in webhook payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find our monitor record
    const { data: monitor, error: monitorErr } = await supabase
      .from('browse_ai_monitors')
      .select('id, company_id, page_type, page_url')
      .eq('browse_ai_robot_id', robotId)
      .single();

    if (monitorErr || !monitor) {
      console.error('[browse-ai-webhook] No monitor for robot:', robotId);
      return new Response(JSON.stringify({ error: 'Monitor not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, slug')
      .eq('id', monitor.company_id)
      .single();

    const companyName = company?.name || 'Unknown Company';
    const pageLabel = PAGE_TYPE_LABELS[monitor.page_type] || monitor.page_type;

    console.log(`[browse-ai-webhook] Change: ${companyName} - ${monitor.page_type}`);

    // Determine modules to re-run
    const modulesToTrigger = PAGE_TYPE_TO_MODULES[monitor.page_type] || [];

    // Record change event
    const { data: changeEvent } = await supabase
      .from('browse_ai_change_events')
      .insert({
        monitor_id: monitor.id,
        company_id: monitor.company_id,
        page_type: monitor.page_type,
        change_summary: `Change detected on ${pageLabel} page for ${companyName}`,
        raw_payload: payload,
        signal_modules_triggered: modulesToTrigger,
        processing_status: 'processing',
      })
      .select()
      .single();

    // Update monitor timestamps
    await supabase.from('browse_ai_monitors').update({
      last_checked_at: new Date().toISOString(),
      last_change_detected_at: new Date().toISOString(),
      browse_ai_task_id: taskData.id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', monitor.id);

    // Re-run relevant signal analysis modules
    const moduleResults: any[] = [];
    for (const moduleFn of modulesToTrigger) {
      try {
        console.log(`[browse-ai-webhook] Triggering: ${moduleFn}`);
        const moduleResp = await fetch(`${supabaseUrl}/functions/v1/${moduleFn}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: monitor.company_id,
            companyName,
            triggeredBy: 'browse_ai_webhook',
          }),
        });

        const result = moduleResp.ok ? await moduleResp.json() : { error: `HTTP ${moduleResp.status}` };
        moduleResults.push({ module: moduleFn, status: moduleResp.ok ? 'completed' : 'failed', result });
        console.log(`[browse-ai-webhook] ${moduleFn}: ${moduleResp.ok ? 'OK' : 'FAIL'}`);
      } catch (modErr) {
        const msg = modErr instanceof Error ? modErr.message : 'Unknown error';
        moduleResults.push({ module: moduleFn, status: 'error', error: msg });
        console.error(`[browse-ai-webhook] ${moduleFn} error:`, msg);
      }
    }

    // Record in Signal Timeline
    await supabase.from('company_signal_scans').insert({
      company_id: monitor.company_id,
      signal_category: 'monitoring',
      signal_type: `page_change_${monitor.page_type}`,
      signal_value: `${pageLabel} page updated. ${modulesToTrigger.length} module(s) re-analyzed.`,
      confidence_level: 'direct',
      source_url: monitor.page_url,
    });

    // Update change event status
    const allSucceeded = moduleResults.every(r => r.status === 'completed');
    const anyFailed = moduleResults.some(r => r.status !== 'completed');

    if (changeEvent) {
      await supabase.from('browse_ai_change_events').update({
        processing_status: allSucceeded ? 'completed' : anyFailed ? 'completed_with_errors' : 'completed',
        change_summary: `${pageLabel} page changed. Triggered ${modulesToTrigger.length} module(s): ${moduleResults.map(r => `${r.module}(${r.status})`).join(', ')}`,
      }).eq('id', changeEvent.id);
    }

    // Notify watching users
    const { data: watchers } = await supabase
      .from('company_watches')
      .select('user_id')
      .eq('company_id', monitor.company_id);

    if (watchers && watchers.length > 0) {
      const alertInserts = watchers.map((w: any) => ({
        user_id: w.user_id,
        company_id: monitor.company_id,
        company_name: companyName,
        signal_category: monitor.page_type,
        change_type: 'page_change_detected',
        change_description: `${pageLabel} page updated for ${companyName}. ${modulesToTrigger.length} signal module(s) have been re-analyzed.`,
        date_detected: new Date().toISOString(),
      }));

      const { error: alertErr } = await supabase.from('user_alerts').insert(alertInserts);
      if (alertErr) console.error('[browse-ai-webhook] Alert insert error:', alertErr);
      else console.log(`[browse-ai-webhook] Notified ${watchers.length} watcher(s)`);
    }

    return new Response(JSON.stringify({
      success: true,
      companyId: monitor.company_id,
      pageType: monitor.page_type,
      modulesTriggered: modulesToTrigger.length,
      moduleResults,
      watchersNotified: watchers?.length || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[browse-ai-webhook] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
