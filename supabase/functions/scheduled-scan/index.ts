const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// All scan modules to run per company
const SCAN_MODULES = [
  { key: 'social', fn: 'social-scan', needsExecs: true },
  { key: 'agency', fn: 'agency-scan' },
  { key: 'ideology', fn: 'ideology-scan' },
  { key: 'worker-sentiment', fn: 'worker-sentiment-scan' },
  { key: 'sec-edgar', fn: 'sync-sec-edgar' },
  { key: 'congress', fn: 'sync-congress-votes' },
];

async function runModule(
  supabaseUrl: string,
  supabaseKey: string,
  moduleFn: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const resp = await fetch(`${supabaseUrl}/functions/v1/${moduleFn}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  return { success: data.success ?? resp.ok, ...(data.error ? { error: data.error } : {}) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: companies, error: compErr } = await supabase
      .from('companies')
      .select('id, name, slug');

    if (compErr || !companies) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch companies' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: any[] = [];

    for (const company of companies) {
      // Check if scan is due
      const { data: schedule } = await supabase
        .from('scan_schedules')
        .select('*')
        .eq('company_id', company.id)
        .eq('scan_type', 'agency')
        .single();

      const now = new Date();
      if (schedule && schedule.next_scan_at && new Date(schedule.next_scan_at) > now) {
        results.push({ company: company.name, status: 'skipped', reason: 'not due' });
        continue;
      }

      // Get exec names (needed for social scan)
      const { data: execs } = await supabase
        .from('company_executives')
        .select('name')
        .eq('company_id', company.id);

      const execNames = (execs || []).map((e: any) => e.name);

      // Run all modules for this company
      for (const mod of SCAN_MODULES) {
        try {
          const body: Record<string, unknown> = {
            companyId: company.id,
            companyName: company.name,
          };
          if (mod.needsExecs) {
            body.executiveNames = execNames;
          }

          const result = await runModule(supabaseUrl, supabaseKey, mod.fn, body);
          results.push({ company: company.name, scan: mod.key, ...result });
        } catch (e) {
          results.push({ company: company.name, scan: mod.key, success: false, error: String(e) });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Scheduled scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
