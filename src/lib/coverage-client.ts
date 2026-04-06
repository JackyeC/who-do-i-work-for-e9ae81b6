/**
 * Secondary Supabase client for the WDIWF coverage database.
 * The main site uses the Lovable-managed Supabase for articles.
 * This connects to our own WDIWF project for multi-source coverage data.
 */
import { createClient } from "@supabase/supabase-js";

const COVERAGE_URL = "https://aeulesuqxcnaonlxcjcm.supabase.co";
const COVERAGE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFldWxlc3VxeGNuYW9ubHhjamNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzMzMzgsImV4cCI6MjA5MDgwOTMzOH0.o6fkD9J-xbT42b24CThZ9wLY5Y-vGwRVzoEn4Jm9i9E";

export const coverageDb = createClient(COVERAGE_URL, COVERAGE_KEY);

export interface StoryCoverage {
  topic_key: string;
  total_sources: number;
  left_count: number;
  center_count: number;
  right_count: number;
  source_names: string[];
}

/** Fetch coverage stats for a set of topic keys */
export async function getCoverageForTopics(topicKeys: string[]): Promise<Map<string, StoryCoverage>> {
  if (!topicKeys.length) return new Map();
  const { data, error } = await coverageDb
    .from("story_coverage")
    .select("*")
    .in("topic_key", topicKeys);
  if (error || !data) return new Map();
  const map = new Map<string, StoryCoverage>();
  for (const row of data) map.set(row.topic_key, row as StoryCoverage);
  return map;
}

/** Register a new source for a topic */
export async function registerSource(topicKey: string, headline: string, sourceName: string, sourceUrl: string, sourceBias: string, publishedAt: string) {
  return coverageDb.from("story_sources").upsert({
    topic_key: topicKey,
    headline,
    source_name: sourceName,
    source_url: sourceUrl,
    source_bias: sourceBias,
    published_at: publishedAt,
  }, { onConflict: "topic_key,source_name", ignoreDuplicates: true });
}
