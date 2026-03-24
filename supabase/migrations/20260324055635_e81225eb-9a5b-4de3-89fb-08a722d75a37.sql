CREATE OR REPLACE FUNCTION public.score_news_for_user(p_news_id UUID, p_user_id UUID)
RETURNS REAL
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE w.user_id = p_user_id;
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
$function$;

CREATE OR REPLACE FUNCTION public.get_personalized_news(p_user_id UUID, p_limit INT DEFAULT 20, p_category TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, title TEXT, summary TEXT, source TEXT, source_url TEXT, category TEXT, tags TEXT[], value_tags TEXT[], company_slugs TEXT[], importance_score REAL, published_at TIMESTAMPTZ, relevance_score REAL)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.summary, n.source, n.source_url, n.category, n.tags, n.value_tags, n.company_slugs, n.importance_score, n.published_at,
    score_news_for_user(n.id, p_user_id) AS relevance_score
  FROM personalized_news n
  WHERE n.is_active = TRUE AND n.published_at >= NOW() - INTERVAL '30 days'
    AND (p_category IS NULL OR n.category = p_category)
  ORDER BY score_news_for_user(n.id, p_user_id) DESC, n.published_at DESC
  LIMIT p_limit;
END;
$function$;