/**
 * Shared search utility with Firecrawl → Gemini AI fallback.
 * When Firecrawl credits are exhausted (402), falls back to using
 * the Lovable AI Gateway (Gemini) to research the topic directly.
 * This is FREE and doesn't require any external API credits.
 */

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  markdown: string;
  query: string;
}

export interface SearchResponse {
  results: SearchResult[];
  creditExhausted: boolean;
  source: 'firecrawl' | 'gemini_fallback';
}

/**
 * Try Firecrawl search first; on 402 (credit exhausted), fall back to Gemini research.
 */
export async function resilientSearch(
  queries: string[],
  firecrawlKey: string | undefined,
  lovableKey: string,
  opts?: { batchSize?: number; maxResultsPerQuery?: number }
): Promise<SearchResponse> {
  const batchSize = opts?.batchSize ?? 3;
  const maxPerQuery = opts?.maxResultsPerQuery ?? 5;

  // Try Firecrawl first if key exists
  if (firecrawlKey) {
    const firecrawlResult = await firecrawlBatchSearch(queries, firecrawlKey, batchSize, maxPerQuery);
    if (!firecrawlResult.creditExhausted && firecrawlResult.results.length > 0) {
      return { ...firecrawlResult, source: 'firecrawl' };
    }
    // If we got some results before credits ran out, use them
    if (firecrawlResult.results.length > 0) {
      return { ...firecrawlResult, source: 'firecrawl' };
    }
    console.log('[resilient-search] Firecrawl unavailable, falling back to Gemini research');
  }

  // Fallback: Use Gemini to research directly
  const geminiResults = await geminiResearch(queries, lovableKey);
  return { results: geminiResults, creditExhausted: false, source: 'gemini_fallback' };
}

async function firecrawlBatchSearch(
  queries: string[],
  firecrawlKey: string,
  batchSize: number,
  maxPerQuery: number
): Promise<{ results: SearchResult[]; creditExhausted: boolean }> {
  const allResults: SearchResult[] = [];
  let creditExhausted = false;

  for (let i = 0; i < queries.length; i += batchSize) {
    if (creditExhausted) break;
    const batch = queries.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async (query) => {
        const resp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, limit: maxPerQuery, lang: 'en', country: 'us' }),
        });

        if (resp.status === 402) throw new Error('CREDIT_EXHAUSTED');
        const data = await resp.json();
        if (resp.ok && data.success && data.data) {
          return data.data.map((r: any) => ({
            title: r.title || '',
            url: r.url || '',
            description: r.description || '',
            markdown: (r.markdown || '').slice(0, 2000),
            query,
          }));
        }
        return [];
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        allResults.push(...r.value);
      } else if (r.reason?.message === 'CREDIT_EXHAUSTED') {
        creditExhausted = true;
        break;
      }
    }
  }

  return { results: allResults, creditExhausted };
}

/**
 * Use Gemini to research queries directly — free via Lovable AI Gateway.
 * Groups all queries into a single prompt for efficiency.
 */
async function geminiResearch(queries: string[], lovableKey: string): Promise<SearchResult[]> {
  const queryList = queries.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a corporate intelligence researcher. For each research query, provide factual findings based on your knowledge. Return a JSON array of findings. Each finding should have: title (string), description (2-3 sentence summary of what you found), query (the original query text). Only include findings where you have substantive knowledge. Be factual and conservative — do not fabricate. Return valid JSON only.`,
        },
        {
          role: 'user',
          content: `Research the following topics and return findings as a JSON array:\n\n${queryList}\n\nReturn format: [{"title": "...", "description": "...", "query": "original query"}]\nReturn [] if no substantive information found.`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    console.error(`[resilient-search] Gemini fallback failed: ${resp.status}`);
    return [];
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '[]';

  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const parsed = JSON.parse(jsonMatch[1].trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
      markdown: r.description || '',
      query: r.query || '',
    }));
  } catch {
    console.error('[resilient-search] Failed to parse Gemini research response');
    return [];
  }
}
