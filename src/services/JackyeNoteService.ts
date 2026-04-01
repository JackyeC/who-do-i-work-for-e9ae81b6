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

/** Template fallback if edge function unavailable */
function fallbackNote(): DailyNoteResponse {
  const intros = [
    "I saw something this morning you should know about.",
    "Heads up — I just caught a signal that might change your strategy.",
    "Before you send that next application, look at this.",
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  return {
    note: `${intro} The market is shifting — and the companies that were hiring aggressively last quarter are starting to restructure. If you're in the middle of a process, pay attention to how they communicate changes. That tells you more than the job description ever will.\n\nAlways in your corner — Jackye`,
    noteData: {
      newsHeadline: "Market signals shifting",
      industry: "general",
      topMatchCompany: null,
      alignmentScore: 0,
    },
  };
}
