import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getViteSupabasePublishableKey, getViteSupabaseUrl } from '@/lib/supabase-vite-env';

const SUPABASE_URL = getViteSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = getViteSupabasePublishableKey();

if (typeof window !== 'undefined') {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error(
      '[WDIWF] Missing VITE_SUPABASE_URL or anon/publishable key. Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.'
    );
  } else {
    const logHost =
      import.meta.env.PROD ||
      import.meta.env.VITE_LOG_SUPABASE_ORIGIN === '1' ||
      import.meta.env.VITE_LOG_SUPABASE_ORIGIN === 'true';
    if (logHost) {
      try {
        console.info('[WDIWF] Supabase API host:', new URL(SUPABASE_URL).host);
      } catch {
        console.warn('[WDIWF] VITE_SUPABASE_URL is not a valid absolute URL');
      }
    }
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});