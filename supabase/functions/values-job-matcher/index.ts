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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user from token
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { limit = 50 } = await req.json().catch(() => ({}));

    // 1. Get user preferences
    const { data: preferences } = await supabase
      .from('job_match_preferences')
      .select('*')
      .eq('user_id', user.id);

    // 2. Get user profile for salary filter
    const { data: profile } = await supabase
      .from('profiles')
      .select('min_salary, target_job_titles')
      .eq('id', user.id)
      .single();

    // 3. Fetch active jobs with company data
    const { data: jobs } = await supabase
      .from('company_jobs')
      .select(`
        id, title, department, location, employment_type, description, url, salary_range, scraped_at,
        company_id,
        companies!inner (id, name, slug, civic_footprint_score, industry, state)
      `)
      .eq('is_active', true)
      .limit(limit);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ matches: [], total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Get unique company IDs and fetch signal data
    const companyIds = [...new Set(jobs.map((j: any) => j.company_id))];

    const [benefitsRes, aiHiringRes, payEquityRes, sentimentRes] = await Promise.all([
      supabase.from('ai_hr_signals').select('company_id, signal_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('ai_hiring_signals').select('company_id, category, transparency_score, bias_audit_status').in('company_id', companyIds),
      supabase.from('pay_equity_signals').select('company_id, signal_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('company_worker_sentiment').select('company_id, overall_rating, sentiment').in('company_id', companyIds),
    ]);

    // Build signal map per company
    const companySignals: Record<string, Record<string, any>> = {};
    for (const cid of companyIds) {
      const signals: Record<string, any> = {};
      
      const benefits = (benefitsRes.data || []).filter((s: any) => s.company_id === cid);
      if (benefits.length > 0) {
        signals['worker_benefits'] = { detected: true, count: benefits.length, label: 'Worker Benefits Detected' };
        const categories = [...new Set(benefits.map((b: any) => b.signal_category))];
        for (const cat of categories) {
          signals[`benefit_${cat.toLowerCase().replace(/\s+/g, '_')}`] = { detected: true, label: cat };
        }
      }

      const aiHiring = (aiHiringRes.data || []).filter((s: any) => s.company_id === cid);
      if (aiHiring.length > 0) {
        const avgScore = aiHiring.reduce((sum: number, s: any) => sum + (s.transparency_score || 0), 0) / aiHiring.length;
        signals['ai_transparency'] = { detected: true, score: Math.round(avgScore), label: 'AI Hiring Transparency' };
        const hasAudit = aiHiring.some((s: any) => s.bias_audit_status === 'completed');
        if (hasAudit) signals['bias_audit_completed'] = { detected: true, label: 'Bias Audit Completed' };
      }

      const payEquity = (payEquityRes.data || []).filter((s: any) => s.company_id === cid);
      if (payEquity.length > 0) {
        signals['pay_transparency'] = { detected: true, count: payEquity.length, label: 'Pay Transparency Signals' };
        const hasSalaryRange = payEquity.some((s: any) => s.signal_category === 'salary_transparency');
        if (hasSalaryRange) signals['salary_range_posted'] = { detected: true, label: 'Salary Ranges in Postings' };
      }

      const sentiment = (sentimentRes.data || []).filter((s: any) => s.company_id === cid);
      if (sentiment.length > 0) {
        const best = sentiment.sort((a: any, b: any) => (b.overall_rating || 0) - (a.overall_rating || 0))[0];
        signals['worker_sentiment'] = { detected: true, score: best.overall_rating, sentiment: best.sentiment, label: 'Worker Sentiment' };
      }

      companySignals[cid] = signals;
    }

    // 5. Score and filter jobs
    const prefKeys = (preferences || []).filter((p: any) => p.is_required).map((p: any) => p.signal_key);
    
    const scoredJobs = jobs.map((job: any) => {
      const signals = companySignals[job.company_id] || {};
      const matchedSignals: string[] = [];
      let score = 0;

      // Base score from civic footprint
      const company = job.companies;
      score += Math.min(company.civic_footprint_score || 0, 100);

      // Signal matches
      for (const key of Object.keys(signals)) {
        if (signals[key].detected) {
          score += 10;
          matchedSignals.push(signals[key].label || key);
        }
      }

      // Check required preferences
      let meetsRequirements = true;
      if (prefKeys.length > 0) {
        for (const key of prefKeys) {
          if (!signals[key]?.detected) {
            meetsRequirements = false;
            break;
          }
        }
      }

      return {
        job_id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        employment_type: job.employment_type,
        description: job.description,
        url: job.url,
        salary_range: job.salary_range,
        scraped_at: job.scraped_at,
        company_id: company.id,
        company_name: company.name,
        company_slug: company.slug,
        civic_footprint_score: company.civic_footprint_score,
        industry: company.industry,
        state: company.state,
        alignment_score: Math.min(score, 100),
        matched_signals: matchedSignals,
        meets_requirements: meetsRequirements,
      };
    });

    // Filter: if user has preferences, only show matching jobs (or all if no prefs)
    const filtered = prefKeys.length > 0
      ? scoredJobs.filter((j: any) => j.meets_requirements)
      : scoredJobs;

    // Sort by alignment score desc
    filtered.sort((a: any, b: any) => b.alignment_score - a.alignment_score);

    return new Response(JSON.stringify({
      matches: filtered.slice(0, limit),
      total: filtered.length,
      preferences_applied: prefKeys.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Values job matcher error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
