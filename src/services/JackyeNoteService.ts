import { supabase } from "@/integrations/supabase/client";

export interface DailyNoteData {
  newsHeadline: string;
  industry: string;
  topMatchCompany: string | null;
  alignmentScore: number;
}

export interface DailyNoteResponse {
  note: string;
  noteData: DailyNoteData;
}

const CACHE_KEY = "wdiwf-jackye-note-cache";
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface CachedNote {
  note: string;
  noteData: DailyNoteData;
  timestamp: number;
}

/** Fetch the dynamic daily note, with local cache to avoid spamming */
export async function fetchDailyNote(): Promise<DailyNoteResponse> {
  // Check local cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedNote = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return { note: parsed.note, noteData: parsed.noteData };
      }
    }
  } catch {}

  // Fetch from edge function
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return fallbackNote();
  }

  try {
    const { data, error } = await supabase.functions.invoke("generate-jackye-note", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error || !data?.note) {
      return fallbackNote();
    }

    // Cache result
    const result: DailyNoteResponse = { note: data.note, noteData: data.noteData };
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...result, timestamp: Date.now() })
      );
    } catch {}

    return result;
  } catch {
    return fallbackNote();
  }
}

/** Save/like a note to the database */
export async function saveNote(note: string, noteData: DailyNoteData, isLiked = true) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;

  await supabase.from("saved_notes" as any).insert({
    user_id: userId,
    note_content: note,
    note_date: new Date().toISOString().split("T")[0],
    news_headline: noteData.newsHeadline,
    industry: noteData.industry,
    top_match_company: noteData.topMatchCompany,
    alignment_score: noteData.alignmentScore,
    is_liked: isLiked,
  });
}

/** Spec-compliant fallback notes — 4-beat structure, ≤120 words, sharp closing question */
function fallbackNote(): DailyNoteResponse {
  const notes = [
    `The market is shifting and the companies hiring aggressively last quarter are starting to restructure. That's not caution. That's a signal about where leadership lost confidence.\n\nMost people wait for the announcement. The smarter move is watching which teams are still growing and which ones went quiet.\n\nIf your target company went silent on hiring, what does that tell you about the role you're chasing?`,

    `A wave of return-to-office mandates hit this week, framed as culture initiatives. That framing is strategic. It shifts the conversation away from control and toward belonging.\n\nThe risk isn't the policy itself. It's how selectively it gets enforced.\n\nWho in your company gets flexibility without asking for it?`,

    `Several companies posted record profits while announcing layoffs in the same quarter. That's not contradiction. That's prioritization made visible.\n\nWhen a company cuts people during growth, it tells you exactly what leadership values. Headcount is a cost line, not a commitment.\n\nDoes your company treat your role as an investment or an expense?`,
  ];

  const idx = Math.floor(Math.random() * notes.length);

  return {
    note: notes[idx],
    noteData: {
      newsHeadline: "Market signals shifting",
      industry: "general",
      topMatchCompany: null,
      alignmentScore: 0,
    },
  };
}
