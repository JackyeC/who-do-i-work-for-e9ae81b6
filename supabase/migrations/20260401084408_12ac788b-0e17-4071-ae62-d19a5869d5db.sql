
-- Recreate fuzzy_person_search to use extensions schema for levenshtein
CREATE OR REPLACE FUNCTION public.fuzzy_person_search(
  _search_term text,
  _limit int DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  company_id uuid,
  name text,
  title text,
  total_donations bigint,
  match_type text,
  match_score int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  search_parts text[];
  first_name text;
  last_name text;
  name_variants text[];
BEGIN
  search_parts := string_to_array(trim(_search_term), ' ');
  
  IF array_length(search_parts, 1) >= 2 THEN
    first_name := lower(search_parts[1]);
    last_name := lower(search_parts[array_length(search_parts, 1)]);
  ELSE
    first_name := lower(search_parts[1]);
    last_name := NULL;
  END IF;

  SELECT resolve_name_variants(first_name) INTO name_variants;

  RETURN QUERY
  SELECT e.id, e.company_id, e.name, e.title, e.total_donations,
    'nickname_match'::text AS match_type,
    0 AS match_score
  FROM company_executives e
  WHERE (
    lower(split_part(e.name, ' ', 1)) = ANY(name_variants)
    OR lower(split_part(e.name, ', ', 1)) = ANY(name_variants)
  )
  AND (last_name IS NULL OR lower(e.name) LIKE '%' || last_name || '%')

  UNION ALL

  SELECT e.id, e.company_id, e.name, e.title, e.total_donations,
    'fuzzy_match'::text AS match_type,
    extensions.levenshtein(lower(split_part(e.name, ' ', 1)), first_name) AS match_score
  FROM company_executives e
  WHERE extensions.levenshtein(lower(split_part(e.name, ' ', 1)), first_name) BETWEEN 1 AND 2
  AND (last_name IS NULL OR extensions.levenshtein(lower(split_part(e.name, ' ', -1)), last_name) <= 2)
  AND e.id NOT IN (
    SELECT e2.id FROM company_executives e2
    WHERE lower(split_part(e2.name, ' ', 1)) = ANY(name_variants)
  )

  ORDER BY match_score ASC, total_donations DESC
  LIMIT _limit;
END;
$$;
