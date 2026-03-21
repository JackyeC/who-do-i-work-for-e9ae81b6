
-- Profile extensions for personalized news
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_keywords TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industries TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_values TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS persona_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS news_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_briefing_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_timezone TEXT DEFAULT 'America/Chicago';

CREATE INDEX IF NOT EXISTS idx_profiles_news_onboarding ON profiles (news_onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_last_briefing ON profiles (last_briefing_date);

-- Personalized news table
CREATE TABLE IF NOT EXISTS personalized_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  value_tags TEXT[] DEFAULT '{}',
  industry_tags TEXT[] DEFAULT '{}',
  location_tags TEXT[] DEFAULT '{}',
  company_slugs TEXT[] DEFAULT '{}',
  importance_score REAL DEFAULT 0.5,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Daily briefings table
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  news_ids UUID[] DEFAULT '{}',
  company_rec_ids UUID[] DEFAULT '{}',
  top_values_matched TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, briefing_date)
);

-- Company news mentions
CREATE TABLE IF NOT EXISTS company_news_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES personalized_news(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  mention_type TEXT DEFAULT 'mentioned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_published ON personalized_news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON personalized_news (category);
CREATE INDEX IF NOT EXISTS idx_news_active ON personalized_news (is_active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_value_tags ON personalized_news USING GIN (value_tags);
CREATE INDEX IF NOT EXISTS idx_news_industry_tags ON personalized_news USING GIN (industry_tags);
CREATE INDEX IF NOT EXISTS idx_news_location_tags ON personalized_news USING GIN (location_tags);
CREATE INDEX IF NOT EXISTS idx_news_company_slugs ON personalized_news USING GIN (company_slugs);
CREATE INDEX IF NOT EXISTS idx_briefings_user_date ON daily_briefings (user_id, briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_company_mentions_news ON company_news_mentions (news_id);

-- RLS
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_news_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own briefings" ON daily_briefings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages briefings" ON daily_briefings FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Authenticated users read news" ON personalized_news FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "Service role manages news" ON personalized_news FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Authenticated users read mentions" ON company_news_mentions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Service role manages mentions" ON company_news_mentions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Scoring function
CREATE OR REPLACE FUNCTION score_news_for_user(p_news_id UUID, p_user_id UUID)
RETURNS REAL AS $$
DECLARE
  v_score REAL := 0;
  v_news personalized_news%ROWTYPE;
  v_user_values TEXT[];
  v_user_industries TEXT[];
  v_user_interests TEXT[];
  v_user_location_state TEXT;
  v_watched_slugs TEXT[];
  v_value_overlap INT;
  v_industry_overlap INT;
  v_location_match BOOLEAN;
  v_company_match BOOLEAN;
BEGIN
  SELECT * INTO v_news FROM personalized_news WHERE id = p_news_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT COALESCE(user_values, '{}'), COALESCE(industries, '{}'), COALESCE(interests, '{}'), location_state
  INTO v_user_values, v_user_industries, v_user_interests, v_user_location_state
  FROM profiles WHERE id = p_user_id LIMIT 1;

  SELECT ARRAY_AGG(c.slug) INTO v_watched_slugs
  FROM user_company_watchlist w JOIN companies c ON c.id = w.company_id
  WHERE w.user_id = p_user_id::text;
  v_watched_slugs := COALESCE(v_watched_slugs, '{}');

  SELECT COUNT(*) INTO v_value_overlap FROM unnest(v_user_values) uv WHERE uv = ANY(v_news.value_tags);
  IF array_length(v_user_values, 1) > 0 THEN
    v_score := v_score + (v_value_overlap::REAL / array_length(v_user_values, 1)) * 35;
  END IF;

  SELECT COUNT(*) INTO v_industry_overlap FROM unnest(v_user_industries) ui WHERE ui = ANY(v_news.industry_tags);
  IF array_length(v_user_industries, 1) > 0 THEN
    v_score := v_score + (v_industry_overlap::REAL / array_length(v_user_industries, 1)) * 20;
  END IF;

  v_location_match := (v_user_location_state IS NOT NULL AND v_user_location_state = ANY(v_news.location_tags));
  IF v_location_match THEN v_score := v_score + 10; END IF;

  v_company_match := (v_watched_slugs IS NOT NULL AND v_news.company_slugs IS NOT NULL AND v_watched_slugs && v_news.company_slugs);
  IF v_company_match THEN v_score := v_score + 20; END IF;

  v_score := v_score + (v_news.importance_score * 15);
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Get personalized news function
CREATE OR REPLACE FUNCTION get_personalized_news(p_user_id UUID, p_limit INT DEFAULT 20, p_category TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, title TEXT, summary TEXT, source TEXT, source_url TEXT, category TEXT, tags TEXT[], value_tags TEXT[], company_slugs TEXT[], importance_score REAL, published_at TIMESTAMPTZ, relevance_score REAL)
AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.summary, n.source, n.source_url, n.category, n.tags, n.value_tags, n.company_slugs, n.importance_score, n.published_at,
    score_news_for_user(n.id, p_user_id) AS relevance_score
  FROM personalized_news n
  WHERE n.is_active = TRUE AND n.published_at >= NOW() - INTERVAL '48 hours'
    AND (p_category IS NULL OR n.category = p_category)
  ORDER BY score_news_for_user(n.id, p_user_id) DESC, n.published_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Get company recommendations function
CREATE OR REPLACE FUNCTION get_company_recommendations(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (id UUID, name TEXT, slug TEXT, industry TEXT, civic_footprint_score REAL, career_intelligence_score REAL, lobbying_spend BIGINT, category_tags TEXT[], match_reason TEXT, values_matched TEXT[])
AS $$
DECLARE
  v_user_values TEXT[];
  v_user_industries TEXT[];
  v_user_location_state TEXT;
  v_watched_ids UUID[];
BEGIN
  SELECT COALESCE(user_values, '{}'), COALESCE(industries, '{}'), location_state
  INTO v_user_values, v_user_industries, v_user_location_state
  FROM profiles WHERE id = p_user_id LIMIT 1;

  SELECT ARRAY_AGG(company_id) INTO v_watched_ids FROM user_company_watchlist WHERE user_id = p_user_id::text;
  v_watched_ids := COALESCE(v_watched_ids, '{}');

  RETURN QUERY
  WITH scored AS (
    SELECT c.id, c.name, c.slug, c.industry, c.civic_footprint_score, c.career_intelligence_score, c.lobbying_spend, c.category_tags,
      (SELECT COUNT(DISTINCT vs.signal_type)::REAL FROM company_signal_scans vs WHERE vs.company_id = c.id AND vs.signal_category = 'values_check' AND vs.direction = 'positive' AND vs.signal_type = ANY(v_user_values)) AS value_match_count,
      (SELECT ARRAY_AGG(DISTINCT vs.signal_type) FROM company_signal_scans vs WHERE vs.company_id = c.id AND vs.signal_category = 'values_check' AND vs.direction = 'positive' AND vs.signal_type = ANY(v_user_values)) AS matched_values,
      CASE WHEN c.industry = ANY(v_user_industries) THEN 1.0 ELSE 0.0 END AS industry_bonus,
      CASE WHEN c.state = v_user_location_state THEN 0.5 ELSE 0.0 END AS location_bonus,
      COALESCE(c.civic_footprint_score, 0) / 100.0 AS cfs_score
    FROM companies c
    WHERE c.record_status IN ('published', 'approved') AND NOT (c.id = ANY(v_watched_ids))
  )
  SELECT s.id, s.name, s.slug, s.industry, s.civic_footprint_score, s.career_intelligence_score, s.lobbying_spend, s.category_tags,
    CASE
      WHEN s.value_match_count > 2 THEN 'Strong values alignment across ' || s.value_match_count || ' areas'
      WHEN s.value_match_count > 0 THEN 'Aligns with your interest in ' || (s.matched_values)[1]
      WHEN s.industry_bonus > 0 THEN 'Active in your industry: ' || s.industry
      WHEN s.cfs_score > 0.7 THEN 'High civic footprint score (' || ROUND(s.civic_footprint_score::NUMERIC) || ')'
      ELSE 'Recommended based on transparency record'
    END AS match_reason,
    COALESCE(s.matched_values, '{}') AS values_matched
  FROM scored s
  ORDER BY (s.value_match_count * 3 + s.industry_bonus * 2 + s.location_bonus + s.cfs_score) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
