const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Dream Job Detector — v2
 * Smarter matching: uses keyword extraction from titles, fuzzy skill matching,
 * and a lower first-run threshold to ensure users get actionable results.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      targetUserId = body?.user_id || null;
    } catch { /* no body */ }

    // Lower threshold for first-run to ensure users see results
    const FIRST_RUN_THRESHOLD = 35;
    const NORMAL_THRESHOLD = 50;

    // Check if first run for target user
    let isFirstRun = false;
    if (targetUserId) {
      const { count } = await supabase
        .from('job_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', targetUserId);
      isFirstRun = (count || 0) === 0;
    }

    const threshold = isFirstRun ? FIRST_RUN_THRESHOLD : NORMAL_THRESHOLD;

    // 1. Get jobs
    let jobsQuery = supabase
      .from('company_jobs')
      .select(`
        id, title, location, work_mode, seniority_level, extracted_skills, salary_range,
        company_id,
        companies!inner (id, name, slug, civic_footprint_score)
      `)
      .eq('is_active', true)
      .limit(500);

    if (!isFirstRun) {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      jobsQuery = jobsQuery.gte('scraped_at', twoDaysAgo);
    }

    const { data: recentJobs, error: jobsErr } = await jobsQuery;

    if (jobsErr || !recentJobs || recentJobs.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: 'No jobs to match', alertsCreated: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Get career profiles
    let profilesQuery = supabase.from('user_career_profile').select('*');
    if (targetUserId) {
      profilesQuery = profilesQuery.eq('user_id', targetUserId);
    } else {
      profilesQuery = profilesQuery.not('skills', 'is', null);
    }

    const { data: profiles } = await profilesQuery;

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: 'No career profiles to match against', alertsCreated: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Existing alerts
    let existingQuery = supabase.from('job_alerts').select('user_id, job_id');
    if (targetUserId) {
      existingQuery = existingQuery.eq('user_id', targetUserId);
    } else {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      existingQuery = existingQuery.gte('created_at', twoDaysAgo);
    }
    const { data: existingAlerts } = await existingQuery;
    const alertSet = new Set((existingAlerts || []).map(a => `${a.user_id}:${a.job_id}`));

    let alertsCreated = 0;
    const alertsToInsert: any[] = [];

    // Helper: extract meaningful keywords from a title
    const STOP_WORDS = new Set(['the','a','an','and','or','of','for','in','at','to','on','with','is','as','by','&','-','/',',']);
    const extractKeywords = (title: string): string[] => {
      return title.toLowerCase()
        .split(/[\s,\/&\-–—]+/)
        .map(w => w.trim())
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    };

    // Helper: fuzzy word match (handles partial matches like "recruit" matching "recruiting")
    const wordOverlap = (a: string, b: string): boolean => {
      if (a === b) return true;
      if (a.length >= 4 && b.length >= 4) {
        const shorter = a.length < b.length ? a : b;
        const longer = a.length < b.length ? b : a;
        return longer.includes(shorter) || shorter.includes(longer.substring(0, shorter.length));
      }
      return false;
    };

    // 4. Match
    for (const profile of profiles) {
      const userSkills = ((profile.skills || []) as string[]).map((s: string) => s.toLowerCase());
      const userTitles = ([
        ...((profile.preferred_titles || []) as string[]),
        ...((profile.job_titles || []) as string[]),
      ]).map((t: string) => t.toLowerCase());
      const userLocations = ((profile.preferred_locations || []) as string[]).map((l: string) => l.toLowerCase());
      const userSeniority = profile.seniority_level;
      const userWorkMode = profile.preferred_work_mode;
      const userIndustries = ((profile.industries || []) as string[]).map((i: string) => i.toLowerCase());

      // Extract keywords from all user titles for broader matching
      const userTitleKeywords = new Set<string>();
      for (const t of userTitles) {
        extractKeywords(t).forEach(kw => userTitleKeywords.add(kw));
      }

      // Also treat skills as matchable keywords
      const userSkillKeywords = new Set<string>();
      for (const s of userSkills) {
        s.split(/[\s,\/]+/).filter(w => w.length > 2).forEach(w => userSkillKeywords.add(w));
      }

      if (userTitleKeywords.size === 0 && userSkillKeywords.size === 0) continue;

      for (const job of recentJobs) {
        const key = `${profile.user_id}:${job.id}`;
        if (alertSet.has(key)) continue;

        let score = 0;
        const matchDetails: string[] = [];
        const company = job.companies as any;

        // --- Civic footprint (0-15) ---
        const civicScore = Math.min(Math.round((company.civic_footprint_score || 0) * 0.15), 15);
        score += civicScore;

        // --- Title keyword matching (0-35) ---
        const jobTitleKeywords = extractKeywords(job.title || '');
        let titleKeywordMatches = 0;
        const matchedTitleWords: string[] = [];

        for (const jkw of jobTitleKeywords) {
          for (const ukw of userTitleKeywords) {
            if (wordOverlap(jkw, ukw)) {
              titleKeywordMatches++;
              matchedTitleWords.push(jkw);
              break;
            }
          }
        }

        if (jobTitleKeywords.length > 0 && titleKeywordMatches > 0) {
          const ratio = titleKeywordMatches / Math.max(jobTitleKeywords.length, 1);
          if (ratio >= 0.6) {
            score += 35;
            matchDetails.push('Strong title match');
          } else if (ratio >= 0.3 || titleKeywordMatches >= 2) {
            score += 20;
            matchDetails.push('Partial title match');
          } else if (titleKeywordMatches >= 1) {
            score += 10;
            matchDetails.push('Related role');
          }
        }

        // --- Skill matching (0-30) ---
        // Match user skills against both job extracted_skills AND job title keywords
        const jobSkills = ((job.extracted_skills || []) as string[]).map((s: string) => s.toLowerCase());
        const allJobSignals = [...new Set([...jobSkills, ...jobTitleKeywords])];

        let skillMatches = 0;
        for (const skill of userSkillKeywords) {
          if (allJobSignals.some(js => wordOverlap(js, skill))) {
            skillMatches++;
          }
        }
        // Also check full skill strings
        for (const skill of userSkills) {
          const jobTitle = (job.title || '').toLowerCase();
          if (jobTitle.includes(skill) || skill.includes(jobTitle.split(' ')[0])) {
            skillMatches += 2;
          }
        }

        if (skillMatches > 0) {
          const skillScore = Math.min(Math.round(30 * Math.min(skillMatches / 5, 1)), 30);
          score += skillScore;
          if (skillMatches >= 3) matchDetails.push(`${skillMatches} skills align`);
          else if (skillMatches >= 1) matchDetails.push('Skills overlap');
        }

        // --- Location (0-10) ---
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
        // Bonus for remote if user has no location preference (implies flexibility)
        if (userLocations.length === 0 && job.work_mode === 'remote') {
          score += 3;
        }

        // --- Work mode (0-5) ---
        if (userWorkMode && job.work_mode && userWorkMode === job.work_mode) {
          score += 5;
          matchDetails.push('Work mode match');
        }

        // --- Seniority (0-5) ---
        if (userSeniority && job.seniority_level && userSeniority === job.seniority_level) {
          score += 5;
          matchDetails.push('Seniority match');
        }

        score = Math.min(score, 100);

        if (score >= threshold) {
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

    // Cap at top 20 matches by score for first run
    if (isFirstRun && alertsToInsert.length > 20) {
      alertsToInsert.sort((a, b) => b.match_score - a.match_score);
      alertsToInsert.length = 20;
    }

    // 5. Bulk insert
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

    console.log(`Dream job detector v2: ${recentJobs.length} jobs × ${profiles.length} profiles → ${alertsCreated} alerts (threshold: ${threshold})`);

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
