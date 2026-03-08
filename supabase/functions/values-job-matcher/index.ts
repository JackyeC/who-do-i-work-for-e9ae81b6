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

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { limit = 50 } = await req.json().catch(() => ({}));

    // 1. Get user preferences (signal filters)
    const { data: preferences } = await supabase
      .from('job_match_preferences')
      .select('*')
      .eq('user_id', user.id);

    // 2. Get career profile for matching
    const { data: careerProfile } = await supabase
      .from('user_career_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 3. Get user profile for salary filter
    const { data: profile } = await supabase
      .from('profiles')
      .select('min_salary, target_job_titles, skills')
      .eq('id', user.id)
      .single();

    // Merge profile sources: career profile takes priority, fallback to profiles table
    const userSkills = (careerProfile?.skills || (profile as any)?.skills || []).map((s: string) => s.toLowerCase());
    const userTitles = (careerProfile?.preferred_titles || careerProfile?.job_titles || (profile as any)?.target_job_titles || []).map((t: string) => t.toLowerCase());
    const userLocations = (careerProfile?.preferred_locations || []).map((l: string) => l.toLowerCase());
    const userSeniority = careerProfile?.seniority_level || null;
    const userWorkMode = careerProfile?.preferred_work_mode || null;
    const userMinSalary = careerProfile?.salary_range_min || (profile as any)?.min_salary || 0;

    // 4. Fetch active jobs with company data
    const { data: jobs } = await supabase
      .from('company_jobs')
      .select(`
        id, title, department, location, employment_type, description, url, salary_range, scraped_at,
        company_id, work_mode, seniority_level, extracted_skills, source_platform,
        companies!inner (id, name, slug, civic_footprint_score, industry, state)
      `)
      .eq('is_active', true)
      .limit(500);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ matches: [], total: 0, preferences_applied: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Get signal data for companies
    const companyIds = [...new Set(jobs.map((j: any) => j.company_id))];

    const [benefitsRes, aiHiringRes, payEquityRes, sentimentRes] = await Promise.all([
      supabase.from('ai_hr_signals').select('company_id, signal_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('ai_hiring_signals').select('company_id, category, transparency_score, bias_audit_status').in('company_id', companyIds),
      supabase.from('pay_equity_signals').select('company_id, signal_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('company_worker_sentiment').select('company_id, overall_rating, sentiment').in('company_id', companyIds),
    ]);

    // Build signal map
    const companySignals: Record<string, Record<string, any>> = {};
    for (const cid of companyIds) {
      const signals: Record<string, any> = {};

      const benefits = (benefitsRes.data || []).filter((s: any) => s.company_id === cid);
      if (benefits.length > 0) {
        signals['worker_benefits'] = { detected: true, count: benefits.length, label: 'Worker Benefits Detected' };
        for (const cat of [...new Set(benefits.map((b: any) => b.signal_category))]) {
          signals[`benefit_${(cat as string).toLowerCase().replace(/\s+/g, '_')}`] = { detected: true, label: cat };
        }
      }

      const aiHiring = (aiHiringRes.data || []).filter((s: any) => s.company_id === cid);
      if (aiHiring.length > 0) {
        const avgScore = aiHiring.reduce((sum: number, s: any) => sum + (s.transparency_score || 0), 0) / aiHiring.length;
        signals['ai_transparency'] = { detected: true, score: Math.round(avgScore), label: 'AI Hiring Transparency' };
        if (aiHiring.some((s: any) => s.bias_audit_status === 'completed')) {
          signals['bias_audit_completed'] = { detected: true, label: 'Bias Audit Completed' };
        }
      }

      const payEquity = (payEquityRes.data || []).filter((s: any) => s.company_id === cid);
      if (payEquity.length > 0) {
        signals['pay_transparency'] = { detected: true, count: payEquity.length, label: 'Pay Transparency Signals' };
        if (payEquity.some((s: any) => s.signal_category === 'salary_transparency')) {
          signals['salary_range_posted'] = { detected: true, label: 'Salary Ranges in Postings' };
        }
      }

      const sentiment = (sentimentRes.data || []).filter((s: any) => s.company_id === cid);
      if (sentiment.length > 0) {
        const best = sentiment.sort((a: any, b: any) => (b.overall_rating || 0) - (a.overall_rating || 0))[0];
        signals['worker_sentiment'] = { detected: true, score: best.overall_rating, sentiment: best.sentiment, label: 'Worker Sentiment' };
      }

      companySignals[cid] = signals;
    }

    // 6. Score jobs with career profile matching
    const prefKeys = (preferences || []).filter((p: any) => p.is_required).map((p: any) => p.signal_key);
    const hasProfile = userSkills.length > 0 || userTitles.length > 0;

    const scoredJobs = jobs.map((job: any) => {
      const signals = companySignals[job.company_id] || {};
      const matchedSignals: string[] = [];
      let score = 0;
      const company = job.companies;

      // Base: civic footprint (0-30 pts)
      score += Math.min(Math.round((company.civic_footprint_score || 0) * 0.3), 30);

      // Signal matches (up to 20 pts)
      let signalPts = 0;
      for (const key of Object.keys(signals)) {
        if (signals[key].detected) {
          signalPts += 3;
          matchedSignals.push(signals[key].label || key);
        }
      }
      score += Math.min(signalPts, 20);

      // ─── Career profile matching (up to 50 pts) ───
      if (hasProfile) {
        // Title match (0-15 pts)
        const jobTitleLower = (job.title || '').toLowerCase();
        let titleScore = 0;
        for (const ut of userTitles) {
          if (jobTitleLower.includes(ut) || ut.includes(jobTitleLower.split(' ')[0])) {
            titleScore = 15;
            matchedSignals.push('Title Match');
            break;
          }
          // Partial match
          const words = ut.split(/\s+/);
          const matchedWords = words.filter(w => jobTitleLower.includes(w));
          if (matchedWords.length > 0) {
            titleScore = Math.max(titleScore, Math.round(15 * matchedWords.length / words.length));
          }
        }
        score += titleScore;

        // Skill overlap (0-15 pts)
        const jobSkills = ((job.extracted_skills || []) as string[]).map((s: string) => s.toLowerCase());
        const jobDesc = (job.description || '').toLowerCase();
        let skillMatches = 0;
        for (const skill of userSkills) {
          if (jobSkills.some(js => js.includes(skill) || skill.includes(js)) || jobDesc.includes(skill)) {
            skillMatches++;
          }
        }
        if (userSkills.length > 0 && skillMatches > 0) {
          const skillRatio = Math.min(skillMatches / Math.max(userSkills.length, 1), 1);
          const skillPts = Math.round(15 * skillRatio);
          score += skillPts;
          if (skillMatches >= 2) matchedSignals.push(`${skillMatches} Skills Match`);
        }

        // Location match (0-10 pts)
        const jobLoc = (job.location || '').toLowerCase();
        if (userLocations.length > 0 && jobLoc) {
          for (const loc of userLocations) {
            if (jobLoc.includes(loc) || loc.includes(jobLoc.split(',')[0])) {
              score += 10;
              matchedSignals.push('Location Match');
              break;
            }
          }
        }

        // Work mode match (0-5 pts)
        if (userWorkMode && job.work_mode && userWorkMode === job.work_mode) {
          score += 5;
          matchedSignals.push('Work Mode Match');
        }

        // Seniority match (0-5 pts)
        if (userSeniority && job.seniority_level && userSeniority === job.seniority_level) {
          score += 5;
          matchedSignals.push('Seniority Match');
        }
      }

      // Check required signal preferences
      let meetsRequirements = true;
      if (prefKeys.length > 0) {
        for (const key of prefKeys) {
          if (!signals[key]?.detected) { meetsRequirements = false; break; }
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
        work_mode: job.work_mode,
        source_platform: job.source_platform,
        company_id: company.id,
        company_name: company.name,
        company_slug: company.slug,
        civic_footprint_score: company.civic_footprint_score,
        industry: company.industry,
        state: company.state,
        alignment_score: Math.min(score, 100),
        matched_signals: [...new Set(matchedSignals)],
        meets_requirements: meetsRequirements,
      };
    });

    // Filter and sort
    const filtered = prefKeys.length > 0
      ? scoredJobs.filter((j: any) => j.meets_requirements)
      : scoredJobs;
    filtered.sort((a: any, b: any) => b.alignment_score - a.alignment_score);

    return new Response(JSON.stringify({
      matches: filtered.slice(0, limit),
      total: filtered.length,
      preferences_applied: prefKeys.length,
      profile_used: hasProfile,
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
