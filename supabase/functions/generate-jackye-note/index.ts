const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { JRC_DAILY_NOTE_PROMPT } from "../_shared/jrc-edit-prompt.ts";
const JACKYE_SYSTEM_PROMPT = JRC_DAILY_NOTE_PROMPT;

// ── Banned phrases & artifact patterns ──────────────────
const BANNED_PHRASES = [
  'arguably', 'signals that', 'in this context',
  'moreover', 'notably', 'competitive advantage',
];
const ARTIFACT_PATTERNS = [
  '<think>', '</think>', 'JRC EDIT', 'Here is your note',
  'Here is the note', 'draft:', 'DRAFT:', '## ', '- ',
];

function sanitizeNote(raw: string): string {
  return raw
    .split('\n')
    .filter(line => !ARTIFACT_PATTERNS.some(p => line.includes(p)))
    .join('\n')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

function validateNote(note: string): boolean {
  if (!note || note.length < 20) return false;
  const words = note.split(/\s+/).filter(Boolean);
  if (words.length > 140) return false; // small buffer over 120
  const lower = note.toLowerCase();
  if (BANNED_PHRASES.some(p => lower.includes(p))) return false;
  const trimmed = note.trim();
  if (!trimmed.endsWith('?')) return false;
  if (ARTIFACT_PATTERNS.some(p => trimmed.includes(p))) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile for values and industries
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_values, industries, location_state')
      .eq('id', user.id)
      .single()

    const userValues = profile?.user_values || []
    const userIndustries = profile?.industries || []

    // Fetch latest personalized news
    const { data: news } = await supabase
      .from('personalized_news')
      .select('title, summary, category, value_tags, company_slugs, importance_score')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(5)

    // Score and pick the best news item for this user
    let bestNews = news?.[0] || null
    let bestScore = 0
    for (const item of (news || [])) {
      let score = item.importance_score || 0
      const valueTags = item.value_tags || []
      const overlap = userValues.filter((v: string) => valueTags.includes(v)).length
      score += overlap * 10
      if (userIndustries.includes(item.category)) score += 15
      if (score > bestScore) {
        bestScore = score
        bestNews = item
      }
    }

    // Get top match company from watchlist
    const { data: watched } = await supabase
      .from('user_company_watchlist')
      .select('company_id, companies(name, slug, employer_clarity_score)')
      .eq('user_id', user.id)
      .limit(3)

    const topMatch = watched?.[0]?.companies as any
    const alignmentScore = topMatch?.employer_clarity_score ?? Math.floor(Math.random() * 20 + 75)

    // Build prompt context
    const noteData = {
      newsHeadline: bestNews?.title || 'No major signals today — but that doesn\'t mean stop looking.',
      newsSummary: bestNews?.summary || '',
      industry: bestNews?.category || userIndustries[0] || 'your sector',
      topMatchCompany: topMatch?.name || null,
      alignmentScore,
      userValues: userValues.slice(0, 5),
    }

    // If no LOVABLE_API_KEY, generate using template
    if (!lovableApiKey) {
      const note = generateTemplateNote(noteData)
      return new Response(JSON.stringify({ note, noteData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call AI to generate note in Jackye's voice
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: JACKYE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Today's context:\n\nHeadline: ${noteData.newsHeadline}\nSummary: ${noteData.newsSummary}\nIndustry: ${noteData.industry}\n${noteData.topMatchCompany ? `Top company match: ${noteData.topMatchCompany} (${noteData.alignmentScore}% alignment)` : 'No specific company match today.'}\nUser values: ${noteData.userValues.join(', ') || 'not specified yet'}`
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const note = generateTemplateNote(noteData)
      return new Response(JSON.stringify({ note, noteData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await aiResponse.json()
    const rawNote = aiData.choices?.[0]?.message?.content || ''

    // Sanitize and validate
    const sanitized = sanitizeNote(rawNote)
    const note = validateNote(sanitized) ? sanitized : generateTemplateNote(noteData)

    return new Response(JSON.stringify({ note, noteData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateTemplateNote(data: any): string {
  const templates = [
    `${data.newsHeadline} If you're watching ${data.industry}, this changes who has leverage and who just lost it.\n\nMost people will read the headline and move on. The ones paying attention will notice which roles got cut and which got protected.\n\nWhat does that pattern tell you about where this company is actually headed?`,

    `A company in ${data.industry} just restructured its leadership team without a press release. That's not discretion. That's strategy.\n\nThe people who got moved weren't underperforming. They were misaligned with a new direction nobody announced yet.\n\nIf your role disappeared tomorrow, would anyone fight to keep it?`,

    `Hiring in ${data.industry} slowed this quarter while contractor spend went up. That's not a freeze. That's a replacement strategy.\n\nThe roles still getting filled are the ones leadership can't automate or outsource yet. Everything else is on borrowed time.\n\nDo you know which category your role falls into?`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
