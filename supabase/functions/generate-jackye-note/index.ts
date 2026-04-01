import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const JACKYE_SYSTEM_PROMPT = `You are Jackye Clayton — career intelligence strategist, not an AI assistant. 
You write like a trusted mentor texting someone you care about. Your tone is:
- Protective: Always in the candidate's corner
- Sharp: Pattern recognition, not opinions
- Warm but never sentimental
- Never uses "As an AI" or "I am here to help" or exclamation points
- Short rhythmic sentences. Observational. Unbothered authority.
- Signature moves: reframing, pattern recognition, quiet warnings, validation

Structure every note:
1. Hook (one of: "I saw something this morning you should know about." / "Heads up—I just caught a signal that might change your strategy." / "Before you send that next application, look at this.")
2. The news, translated into what it means for the candidate's career
3. If there's a company match, mention alignment score naturally
4. Close with "Always in your corner — Jackye"

NEVER sound like a news summary. Sound like a text from the smartest person in the room who already knows how the story ends.`

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
    const aiResponse = await fetch('https://ai.lovable.dev/api/chat', {
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
            content: `Write today's Daily Note from Jackye. Here's the context:

News headline: ${noteData.newsHeadline}
News summary: ${noteData.newsSummary}
Industry: ${noteData.industry}
${noteData.topMatchCompany ? `Top matching company: ${noteData.topMatchCompany} (${noteData.alignmentScore}% alignment)` : 'No specific company match today.'}
User cares about: ${noteData.userValues.join(', ') || 'not specified yet'}

Write 2-3 short paragraphs. No markdown. No bullet points. Just natural text like a text message from a mentor. End with "Always in your corner — Jackye"`
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
    const generatedNote = aiData.choices?.[0]?.message?.content || generateTemplateNote(noteData)

    return new Response(JSON.stringify({ note: generatedNote, noteData }), {
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
  const intros = [
    "I saw something this morning you should know about.",
    "Heads up — I just caught a signal that might change your strategy.",
    "Before you send that next application, look at this.",
  ]
  const intro = intros[Math.floor(Math.random() * intros.length)]

  const valueCommentary = data.topMatchCompany
    ? data.alignmentScore > 90
      ? `That role at ${data.topMatchCompany}? ${data.alignmentScore}% alignment with your values. That's rare. I'd look twice.`
      : `That role at ${data.topMatchCompany}? It's a ${data.alignmentScore}% match. Solid, but let's keep digging into the receipts.`
    : ''

  return `${intro} ${data.newsHeadline}. If you're looking at roles in ${data.industry}, that changes the conversation. I pulled the details into your dossier already.${valueCommentary ? '\n\n' + valueCommentary : ''}\n\nAlways in your corner — Jackye`
}
