const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Dream Job Detector
 * Runs after batch-job-scrape to match newly ingested jobs against all user career profiles.
 * Creates job_alerts for strong matches (score >= 70).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const DREAM_THRESHOLD = 70;

    // 1. Get recent jobs (last 48 hours)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: recentJobs, error: jobsErr } = await supabase
      .from('company_jobs')
      .select(`
        id, title, location, work_mode, seniority_level, extracted_skills, salary_range,
        company_id,
        companies!inner (id, name, slug, civic_footprint_score)
      `)
      .eq('is_active', true)
      .gte('scraped_at', twoDaysAgo)
      .limit(200);

    if (jobsErr || !recentJobs || recentJobs.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: 'No recent jobs to match', alertsCreated: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Get all career profiles with meaningful data
    const { data: profiles } = await supabase
      .from('user_career_profile')
      .select('*')
      .not('skills', 'is', null);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: 'No career profiles to match against', alertsCreated: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Get existing alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('job_alerts')
      .select('user_id, job_id')
      .gte('created_at', twoDaysAgo);

    const alertSet = new Set((existingAlerts || []).map(a => `${a.user_id}:${a.job_id}`));

    let alertsCreated = 0;
    const alertsToInsert: any[] = [];

    // 4. Match each profile against recent jobs
    for (const profile of profiles) {
      const userSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
      const userTitles = ([...(profile.preferred_titles || []), ...(profile.job_titles || [])]).map((t: string) => t.toLowerCase());
      const userLocations = (profile.preferred_locations || []).map((l: string) => l.toLowerCase());
      const userSeniority = profile.seniority_level;
      const userWorkMode = profile.preferred_work_mode;

      if (userSkills.length === 0 && userTitles.length === 0) continue;

      for (const job of recentJobs) {
        const key = `${profile.user_id}:${job.id}`;
        if (alertSet.has(key)) continue;

        let score = 0;
        const matchDetails: string[] = [];
        const company = job.companies as any;

        // Civic footprint (0-25)
        score += Math.min(Math.round((company.civic_footprint_score || 0) * 0.25), 25);

        // Title match (0-30)
        const jobTitleLower = (job.title || '').toLowerCase();
        for (const ut of userTitles) {
          if (jobTitleLower.includes(ut) || ut.includes(jobTitleLower.split(' ')[0])) {
            score += 30;
            matchDetails.push('Strong title match');
            break;
          }
          const words = ut.split(/\s+/);
          const matched = words.filter(w => jobTitleLower.includes(w));
          if (matched.length >= 2) {
            score += 15;
            matchDetails.push('Partial title match');
            break;
          }
        }

        // Skill overlap (0-25)
        const jobSkills = ((job.extracted_skills || []) as string[]).map((s: string) => s.toLowerCase());
        let skillMatches = 0;
        for (const skill of userSkills) {
          if (jobSkills.some((js: string) => js.includes(skill) || skill.includes(js))) {
            skillMatches++;
          }
        }
        if (userSkills.length > 0 && skillMatches > 0) {
          const ratio = Math.min(skillMatches / userSkills.length, 1);
          score += Math.round(25 * ratio);
          if (skillMatches >= 2) matchDetails.push(`${skillMatches} skills match`);
        }

        // Location (0-10)
        const jobLoc = (job.location || '').toLowerCase();
        if (userLocations.length > 0 && jobLoc) {
          for (const loc of userLocations) {
            if (jobLoc.includes(loc) || loc.includes(jobLoc.split(',')[0])) {
              score += 10;
              matchDetails.push('Location match');
              break;
            }
          }
        }

        // Work mode (0-5)
        if (userWorkMode && job.work_mode && userWorkMode === job.work_mode) {
          score += 5;
          matchDetails.push('Work mode match');
        }

        // Seniority (0-5)
        if (userSeniority && job.seniority_level && userSeniority === job.seniority_level) {
          score += 5;
          matchDetails.push('Seniority match');
        }

        score = Math.min(score, 100);

        if (score >= DREAM_THRESHOLD) {
          alertsToInsert.push({
            user_id: profile.user_id,
            job_id: job.id,
            company_id: job.company_id,
            alert_type: 'dream_job_match',
            match_score: score,
            match_details: {
              job_title: job.title,
              company_name: company.name,
              company_slug: company.slug,
              reasons: matchDetails,
              location: job.location,
              work_mode: job.work_mode,
            },
          });
          alertSet.add(key);
        }
      }
    }

    // 5. Bulk insert alerts
    if (alertsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('job_alerts')
        .insert(alertsToInsert);

      if (insertErr) {
        console.error('Failed to insert alerts:', insertErr);
      } else {
        alertsCreated = alertsToInsert.length;
      }
    }

    console.log(`Dream job detector: ${recentJobs.length} jobs × ${profiles.length} profiles → ${alertsCreated} alerts`);

    return new Response(JSON.stringify({
      success: true,
      jobsScanned: recentJobs.length,
      profilesMatched: profiles.length,
      alertsCreated,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Dream job detect error:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
