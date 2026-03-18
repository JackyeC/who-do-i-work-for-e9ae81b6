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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    // 1. Get user career profile
    const { data: profile } = await supabase
      .from('user_career_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'No career profile found. Upload a resume first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userSkills = profile.skills || [];
    const userTitles = [...(profile.job_titles || []), ...(profile.preferred_titles || [])];
    const userIndustries = profile.industries || [];
    const targetLocations = profile.preferred_locations || [];
    const seniorityLevel = profile.seniority_level || 'mid';

    // 2. Get target companies (from tracked companies or top-scoring ones)
    const { data: tracked } = await supabase
      .from('tracked_companies')
      .select('company_id, companies(name, slug, industry, career_intelligence_score)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(5);

    let targetCompanies: any[] = [];
    if (tracked && tracked.length > 0) {
      targetCompanies = tracked.map((t: any) => t.companies).filter(Boolean);
    } else {
      // Fallback: top-scoring companies in user's industries
      const { data: topCos } = await supabase
        .from('companies')
        .select('name, slug, industry, career_intelligence_score')
        .in('industry', userIndustries.length > 0 ? userIndustries : ['Technology'])
        .order('career_intelligence_score', { ascending: false })
        .limit(3);
      targetCompanies = topCos || [];
    }

    // 3. Get job requirements from target companies
    const companyNames = targetCompanies.map((c: any) => c.name);
    const { data: targetJobs } = await supabase
      .from('company_jobs')
      .select('title, extracted_skills, seniority_level, company_id, companies(name)')
      .eq('is_active', true)
      .limit(20);

    const relevantJobs = (targetJobs || []).filter((j: any) => {
      const jobTitle = (j.title || '').toLowerCase();
      return userTitles.some(t => jobTitle.includes(t.toLowerCase().split(' ')[0]));
    }).slice(0, 10);

    // 4. Build AI prompt
    const requiredSkills = new Set<string>();
    relevantJobs.forEach((j: any) => {
      ((j.extracted_skills || []) as string[]).forEach(s => requiredSkills.add(s));
    });

    const prompt = `You are a career strategist specializing in skills-based career development.

CONTEXT:
- User's current skills: ${userSkills.join(', ') || 'Not specified'}
- User's current/target titles: ${userTitles.join(', ') || 'Not specified'}
- User's seniority: ${seniorityLevel}
- User's industries: ${userIndustries.join(', ') || 'Not specified'}
- Target companies: ${companyNames.join(', ') || 'General market'}
- Skills found in target job listings: ${[...requiredSkills].join(', ') || 'Not available'}

TASK:
Identify exactly 3 skill gaps between the user's current profile and their target roles. For each gap, generate a practical "Stretch Project" they can propose internally.

Return structured data using the tool provided.

RULES:
- Each skill gap must be specific and actionable (not generic like "leadership")
- Projects must be things someone can propose to their current manager
- Proposal scripts must be professional and compelling in exactly 3 sentences
- Readiness points should sum to 100 across all 3 projects
- why_it_matters should reference a specific target company when possible`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a career development strategist. Always use the provided tool to return structured data.' },
          { role: 'user', content: prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_stretch_projects',
              description: 'Generate 3 stretch project suggestions based on identified skill gaps.',
              parameters: {
                type: 'object',
                properties: {
                  projects: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        skill_gap: { type: 'string', description: 'The specific skill or experience gap identified' },
                        project_title: { type: 'string', description: 'A compelling title for the stretch project' },
                        why_it_matters: { type: 'string', description: 'Why this project builds the signal needed for target roles. Reference a target company if possible.' },
                        proposal_script: { type: 'string', description: 'A 3-sentence professional pitch the user can send to their manager.' },
                        target_company: { type: 'string', description: 'The target company this skill gap relates to' },
                        target_role: { type: 'string', description: 'The specific role this prepares the user for' },
                        readiness_points: { type: 'integer', description: 'Points toward Career Readiness Score (should sum to 100 across all projects)' },
                      },
                      required: ['skill_gap', 'project_title', 'why_it_matters', 'proposal_script', 'readiness_points'],
                      additionalProperties: false,
                    },
                  },
                  coaching_note: { type: 'string', description: 'A motivational coaching insight about stretch projects and career growth.' },
                  career_readiness_current: { type: 'integer', description: 'Estimated current career readiness percentage (0-100) based on skill overlap.' },
                },
                required: ['projects', 'coaching_note', 'career_readiness_current'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_stretch_projects' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error('AI generation failed');
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error('No structured response from AI');
    }

    const generated = JSON.parse(toolCall.function.arguments);

    // 5. Save projects to database
    const projectsToInsert = (generated.projects || []).map((p: any) => ({
      user_id: user.id,
      skill_gap: p.skill_gap,
      project_title: p.project_title,
      why_it_matters: p.why_it_matters,
      proposal_script: p.proposal_script,
      target_company: p.target_company || null,
      target_role: p.target_role || null,
      readiness_points: p.readiness_points || 33,
      status: 'pending',
      ai_generated: true,
    }));

    if (projectsToInsert.length > 0) {
      // Clear old AI-generated pending projects before inserting new ones
      await supabase
        .from('stretch_projects')
        .delete()
        .eq('user_id', user.id)
        .eq('ai_generated', true)
        .eq('status', 'pending');

      await supabase.from('stretch_projects').insert(projectsToInsert);
    }

    return new Response(JSON.stringify({
      success: true,
      projects: generated.projects,
      coaching_note: generated.coaching_note,
      career_readiness_current: generated.career_readiness_current || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Skill gap gigs error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
