const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ────────────────────────────────────────────────────
// Scoring helpers — continuous, granular, no flat defaults
// ────────────────────────────────────────────────────

interface MatchReason {
  dimension: 'skill' | 'role' | 'values' | 'signals' | 'location' | 'work_mode' | 'industry' | 'seniority';
  label: string;
  detail: string;
  impact: number; // 0-100 contribution weight
}

/** Jaccard-ish overlap for string arrays with fuzzy substring matching */
function fuzzyOverlap(userItems: string[], jobItems: string[]): { count: number; ratio: number; matched: string[] } {
  if (!userItems.length || !jobItems.length) return { count: 0, ratio: 0, matched: [] };
  const matched: string[] = [];
  for (const u of userItems) {
    for (const j of jobItems) {
      if (j.includes(u) || u.includes(j)) {
        matched.push(u);
        break;
      }
    }
  }
  const ratio = matched.length / Math.max(userItems.length, 1);
  return { count: matched.length, ratio: Math.min(ratio, 1), matched };
}

/** Title similarity: exact > partial word overlap > first-word match */
function titleSimilarity(userTitles: string[], jobTitle: string): { score: number; bestMatch: string | null } {
  if (!userTitles.length || !jobTitle) return { score: 0, bestMatch: null };
  const jt = jobTitle.toLowerCase();
  let best = 0;
  let bestMatch: string | null = null;

  for (const ut of userTitles) {
    // Exact match
    if (jt === ut || jt.includes(ut) || ut.includes(jt)) {
      return { score: 1.0, bestMatch: ut };
    }
    // Word overlap
    const uWords = ut.split(/\s+/).filter(w => w.length > 2);
    const jWords = jt.split(/\s+/).filter(w => w.length > 2);
    const overlap = uWords.filter(w => jWords.some(jw => jw.includes(w) || w.includes(jw))).length;
    const wordScore = uWords.length > 0 ? overlap / uWords.length : 0;
    if (wordScore > best) {
      best = wordScore;
      bestMatch = ut;
    }
  }
  return { score: Math.min(best, 1), bestMatch };
}

Deno.serve(async (req: Request) => {
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

    // ── Fetch all user data in parallel ──
    const [
      { data: valuesProfile },
      { data: preferences },
      { data: careerProfile },
      { data: profile },
    ] = await Promise.all([
      supabase.from('user_values_profile').select('*').eq('user_id', user.id).single(),
      supabase.from('job_match_preferences').select('*').eq('user_id', user.id),
      supabase.from('user_career_profile').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('min_salary, target_job_titles, skills, dream_job_profile').eq('id', user.id).single(),
    ]);

    // Extract Dream Job Profile
    const djp = (profile as any)?.dream_job_profile as {
      targetTitles?: string[];
      adjacentRoles?: { title: string }[];
      facets?: {
        skills?: string[];
        industries?: string[];
        valuesTags?: string[];
        minSalary?: number | null;
        locations?: string[];
        remotePreference?: string;
      };
    } | null;

    // Merge user data (DJP > career profile > profiles table)
    const userSkills = [...new Set([
      ...(djp?.facets?.skills || []),
      ...(careerProfile?.skills || (profile as any)?.skills || []),
    ].map((s: string) => s.toLowerCase().trim()).filter(Boolean))];

    const userTitles = [...new Set([
      ...(djp?.targetTitles || []),
      ...(djp?.adjacentRoles?.map(r => r.title) || []),
      ...(careerProfile?.preferred_titles || careerProfile?.job_titles || (profile as any)?.target_job_titles || []),
    ].map((t: string) => t.toLowerCase().trim()).filter(Boolean))];

    const userLocations = [...new Set([
      ...(djp?.facets?.locations || []),
      ...(careerProfile?.preferred_locations || []),
    ].map((l: string) => l.toLowerCase().trim()).filter(Boolean))];

    const userIndustries = [...new Set(
      (djp?.facets?.industries || []).map((i: string) => i.toLowerCase().trim()).filter(Boolean)
    )];

    const userValuesTags = [...new Set(
      (djp?.facets?.valuesTags || []).map((v: string) => v.toLowerCase().trim()).filter(Boolean)
    )];

    const userSeniority = careerProfile?.seniority_level || null;
    const userWorkMode = djp?.facets?.remotePreference || careerProfile?.preferred_work_mode || null;
    const userMinSalary = djp?.facets?.minSalary || careerProfile?.salary_range_min || (profile as any)?.min_salary || 0;

    const hasProfile = userSkills.length > 0 || userTitles.length > 0;

    // ── Fetch jobs ──
    const { data: jobs } = await supabase
      .from('company_jobs')
      .select(`
        id, title, department, location, employment_type, description, url, salary_range, scraped_at,
        company_id, work_mode, seniority_level, extracted_skills, source_platform,
        companies!inner (id, name, slug, civic_footprint_score, employer_clarity_score, industry, state)
      `)
      .eq('is_active', true)
      .limit(500);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ matches: [], total: 0, preferences_applied: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Fetch signal data ──
    const companyIds = [...new Set(jobs.map((j: any) => j.company_id))];

    const [benefitsRes, aiHiringRes, payEquityRes, sentimentRes, valuesSignalsRes, claimsRes] = await Promise.all([
      supabase.from('ai_hr_signals').select('company_id, signal_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('ai_hiring_signals').select('company_id, category, transparency_score, bias_audit_status').in('company_id', companyIds),
      supabase.from('pay_equity_signals').select('company_id, signal_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('company_worker_sentiment').select('company_id, overall_rating, sentiment').in('company_id', companyIds),
      supabase.from('company_values_signals').select('company_id, value_category, signal_type, confidence').in('company_id', companyIds),
      supabase.from('company_claims').select('company_id, claim_type, confidence_score').eq('is_active', true).in('company_id', companyIds),
    ]);

    // Build per-company signal index
    const companySignalIndex: Record<string, {
      signalCount: number;
      signalLabels: string[];
      civicScore: number;
      clarityScore: number;
      sentimentScore: number;
      claimCount: number;
      valuesCategories: string[];
    }> = {};

    for (const cid of companyIds) {
      const company = jobs.find((j: any) => j.company_id === cid)?.companies;
      const benefits = (benefitsRes.data || []).filter((s: any) => s.company_id === cid);
      const aiHiring = (aiHiringRes.data || []).filter((s: any) => s.company_id === cid);
      const payEquity = (payEquityRes.data || []).filter((s: any) => s.company_id === cid);
      const sentiment = (sentimentRes.data || []).filter((s: any) => s.company_id === cid);
      const valuesSignals = (valuesSignalsRes.data || []).filter((s: any) => s.company_id === cid);
      const claims = (claimsRes.data || []).filter((s: any) => s.company_id === cid);

      const labels: string[] = [];
      if (benefits.length > 0) labels.push('Worker Benefits');
      if (aiHiring.length > 0) labels.push('AI Hiring Transparency');
      if (payEquity.length > 0) labels.push('Pay Transparency');
      if (aiHiring.some((s: any) => s.bias_audit_status === 'completed')) labels.push('Bias Audit Completed');
      if (payEquity.some((s: any) => s.signal_category === 'salary_transparency')) labels.push('Salary Ranges Posted');

      const bestSentiment = sentiment.length > 0
        ? Math.max(...sentiment.map((s: any) => s.overall_rating || 0))
        : 0;

      companySignalIndex[cid] = {
        signalCount: benefits.length + aiHiring.length + payEquity.length + valuesSignals.length,
        signalLabels: labels,
        civicScore: company?.civic_footprint_score || 0,
        clarityScore: company?.employer_clarity_score || 0,
        sentimentScore: bestSentiment,
        claimCount: claims.length,
        valuesCategories: valuesSignals.map((s: any) => (s.value_category || '').toLowerCase()),
      };
    }

    // ── Values weight map from user_values_profile ──
    const valuesWeightMap: Record<string, string[]> = {
      pay_equity_weight: ['pay_transparency', 'salary_transparency'],
      worker_protections_weight: ['worker_benefits', 'worker_protections'],
      ai_transparency_weight: ['ai_transparency'],
      benefits_quality_weight: ['worker_benefits', 'benefits'],
      dei_commitment_weight: ['anti_discrimination', 'lgbtq_inclusive', 'dei'],
      environmental_commitment_weight: ['environmental', 'climate'],
      veteran_support_weight: ['veteran_support'],
    };

    // ── Required signal keys ──
    const prefKeys = (preferences || []).filter((p: any) => p.is_required).map((p: any) => p.signal_key);

    // ════════════════════════════════════════════════════
    // SCORING ENGINE — 5 dimensions, continuous, granular
    // ════════════════════════════════════════════════════

    const scoredJobs = jobs.map((job: any, jobIndex: number) => {
      const company = job.companies;
      const cid = job.company_id;
      const si = companySignalIndex[cid] || { signalCount: 0, signalLabels: [], civicScore: 0, clarityScore: 0, sentimentScore: 0, claimCount: 0, valuesCategories: [] };
      const reasons: MatchReason[] = [];

      // ──────────────────────────────────
      // 1. SKILL MATCH (0-100) — weight 25%
      // ──────────────────────────────────
      let skillScore = 0;
      if (hasProfile && userSkills.length > 0) {
        const jobSkills = ((job.extracted_skills || []) as string[]).map((s: string) => s.toLowerCase());
        const jobDesc = (job.description || '').toLowerCase();
        const allJobTerms = [...jobSkills];
        // Add description keywords for deeper matching
        const descWords = jobDesc.split(/\s+/).filter(w => w.length > 3);

        let directMatches = 0;
        let descMatches = 0;
        const matchedSkillNames: string[] = [];

        for (const skill of userSkills) {
          if (jobSkills.some(js => js.includes(skill) || skill.includes(js))) {
            directMatches++;
            matchedSkillNames.push(skill);
          } else if (jobDesc.includes(skill)) {
            descMatches++;
            matchedSkillNames.push(skill);
          }
        }

        // Direct skill matches worth more than description mentions
        const totalMatches = directMatches + descMatches * 0.6;
        const skillRatio = Math.min(totalMatches / Math.max(userSkills.length, 1), 1);
        skillScore = Math.round(skillRatio * 100);

        if (matchedSkillNames.length > 0) {
          reasons.push({
            dimension: 'skill',
            label: `${matchedSkillNames.length} skill${matchedSkillNames.length > 1 ? 's' : ''} match`,
            detail: matchedSkillNames.slice(0, 4).join(', ') + (matchedSkillNames.length > 4 ? ` +${matchedSkillNames.length - 4} more` : ''),
            impact: skillScore,
          });
        }
      }

      // ──────────────────────────────────
      // 2. ROLE ALIGNMENT (0-100) — weight 20%
      // ──────────────────────────────────
      let roleScore = 0;
      const titleSim = titleSimilarity(userTitles, job.title || '');
      roleScore = Math.round(titleSim.score * 100);

      if (titleSim.score > 0 && titleSim.bestMatch) {
        reasons.push({
          dimension: 'role',
          label: titleSim.score >= 0.8 ? 'Strong role match' : 'Partial role match',
          detail: `Your target "${titleSim.bestMatch}" aligns with "${job.title}"`,
          impact: roleScore,
        });
      }

      // Department/function match (bonus)
      if (job.department && userTitles.some(t => (job.department || '').toLowerCase().includes(t.split(' ')[0]))) {
        roleScore = Math.min(roleScore + 15, 100);
      }

      // ──────────────────────────────────
      // 3. VALUES ALIGNMENT (0-100) — weight 25%
      // ──────────────────────────────────
      let valuesScore = 0;

      // From user_values_profile weighted preferences
      if (valuesProfile) {
        let weightedMatches = 0;
        let totalWeight = 0;

        for (const [weightKey, categories] of Object.entries(valuesWeightMap)) {
          const weight = (valuesProfile as any)[weightKey] || 0;
          if (weight > 20) {
            totalWeight += weight;
            const hasMatch = categories.some(c => si.valuesCategories.includes(c));
            if (hasMatch) weightedMatches += weight;
          }
        }

        if (totalWeight > 0) {
          valuesScore = Math.round((weightedMatches / totalWeight) * 100);
        }
      }

      // From DJP valuesTags overlap with company values categories
      if (userValuesTags.length > 0 && si.valuesCategories.length > 0) {
        const { count, ratio } = fuzzyOverlap(userValuesTags, si.valuesCategories);
        if (count > 0) {
          const tagBoost = Math.round(ratio * 30);
          valuesScore = Math.min(valuesScore + tagBoost, 100);
          reasons.push({
            dimension: 'values',
            label: `${count} value${count > 1 ? 's' : ''} aligned`,
            detail: `Company signals match your stated priorities`,
            impact: valuesScore,
          });
        }
      } else if (valuesScore > 0) {
        reasons.push({
          dimension: 'values',
          label: 'Values alignment detected',
          detail: `Company practices match your values profile weights`,
          impact: valuesScore,
        });
      }

      // Industry alignment (values dimension bonus)
      if (userIndustries.length > 0) {
        const companyIndustry = (company.industry || '').toLowerCase();
        const industryMatch = userIndustries.some(i => companyIndustry.includes(i) || i.includes(companyIndustry));
        if (industryMatch) {
          valuesScore = Math.min(valuesScore + 12, 100);
          reasons.push({
            dimension: 'industry',
            label: 'Industry match',
            detail: `${company.industry} is in your target industries`,
            impact: 12,
          });
        }
      }

      // ──────────────────────────────────
      // 4. COMPANY SIGNAL SCORE (0-100) — weight 20%
      //    Uses civic footprint, claim density, signal count, sentiment
      // ──────────────────────────────────
      let signalScore = 0;

      // Civic footprint: 0-100 directly (40% of signal score)
      const civicPts = Math.min(si.civicScore, 100) * 0.4;

      // Signal density: each signal type adds granular points (30%)
      const densityPts = Math.min(si.signalCount * 2.5, 30);

      // Claim density: companies with verified claims are more researched (15%)
      const claimPts = Math.min(si.claimCount * 1.5, 15);

      // Sentiment: worker sentiment if available (15%)
      const sentimentPts = si.sentimentScore > 0 ? Math.min(si.sentimentScore * 3, 15) : 0;

      signalScore = Math.round(civicPts + densityPts + claimPts + sentimentPts);
      signalScore = Math.min(signalScore, 100);

      if (si.signalLabels.length > 0) {
        reasons.push({
          dimension: 'signals',
          label: `${si.signalLabels.length} employer signal${si.signalLabels.length > 1 ? 's' : ''} detected`,
          detail: si.signalLabels.slice(0, 3).join(', '),
          impact: signalScore,
        });
      }

      // ──────────────────────────────────
      // 5. LOCATION / LOGISTICS (0-100) — weight 10%
      // ──────────────────────────────────
      let locationScore = 0;
      const jobLoc = (job.location || '').toLowerCase();

      // Location match
      if (userLocations.length > 0 && jobLoc) {
        for (const loc of userLocations) {
          if (jobLoc.includes(loc) || loc.includes(jobLoc.split(',')[0])) {
            locationScore += 50;
            reasons.push({
              dimension: 'location',
              label: 'Location match',
              detail: `${job.location} matches your preference`,
              impact: 50,
            });
            break;
          }
        }
      }

      // Work mode match
      if (userWorkMode && job.work_mode) {
        const modeMap: Record<string, string> = { remote: 'remote', hybrid: 'hybrid', onsite: 'on-site' };
        const normalizedUser = modeMap[userWorkMode] || userWorkMode;
        if (normalizedUser === job.work_mode || (normalizedUser === 'remote' && job.work_mode === 'remote')) {
          locationScore += 30;
          reasons.push({
            dimension: 'work_mode',
            label: 'Work mode match',
            detail: `${job.work_mode} aligns with your ${userWorkMode} preference`,
            impact: 30,
          });
        }
      }

      // Seniority match
      if (userSeniority && job.seniority_level && userSeniority === job.seniority_level) {
        locationScore += 20;
        reasons.push({
          dimension: 'seniority',
          label: 'Seniority level match',
          detail: `${job.seniority_level} matches your experience level`,
          impact: 20,
        });
      }

      locationScore = Math.min(locationScore, 100);

      // ══════════════════════════════════
      // FINAL WEIGHTED SCORE
      // Skill 25% + Role 20% + Values 25% + Signals 20% + Location 10%
      // ══════════════════════════════════
      const rawScore =
        skillScore * 0.25 +
        roleScore * 0.20 +
        valuesScore * 0.25 +
        signalScore * 0.20 +
        locationScore * 0.10;

      // Add micro-entropy from job index + company hash to prevent identical scores
      // This is a tie-breaker, not a distortion (max ±0.4 pts)
      const entropy = ((cid.charCodeAt(0) + cid.charCodeAt(cid.length - 1) + jobIndex) % 100) * 0.004;
      const alignmentScore = Math.min(Math.round((rawScore + entropy) * 10) / 10, 100);

      // Sort reasons by impact, take top 3
      reasons.sort((a, b) => b.impact - a.impact);
      const topReasons = reasons.slice(0, 3);

      // Check required preferences
      let meetsRequirements = true;
      if (prefKeys.length > 0) {
        for (const key of prefKeys) {
          const hasSignal = si.signalLabels.some(l => l.toLowerCase().includes(key.toLowerCase()));
          if (!hasSignal) { meetsRequirements = false; break; }
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
        employer_clarity_score: company.employer_clarity_score || null,
        industry: company.industry,
        state: company.state,
        alignment_score: alignmentScore,
        // Per-dimension breakdown
        score_breakdown: {
          skill: skillScore,
          role: roleScore,
          values: valuesScore,
          signals: signalScore,
          location: locationScore,
        },
        // Structured "why this match" reasons (top 3)
        match_reasons: topReasons,
        // Legacy: flat signal labels for backward compat
        matched_signals: [...new Set(si.signalLabels)],
        meets_requirements: meetsRequirements,
        dream_job_profile_used: !!djp,
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
      dream_job_profile_active: !!djp,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Values job matcher error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
