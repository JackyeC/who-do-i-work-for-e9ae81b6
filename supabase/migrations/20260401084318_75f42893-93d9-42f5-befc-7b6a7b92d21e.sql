
-- Enable the fuzzystrmatch extension for Levenshtein, Soundex, Metaphone
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch SCHEMA public;

-- Nickname canonical mapping table
CREATE TABLE public.nickname_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  canonical_name text NOT NULL,
  UNIQUE (nickname, canonical_name)
);

-- Seed common nickname mappings
INSERT INTO public.nickname_mappings (nickname, canonical_name) VALUES
  ('mike', 'michael'), ('mikey', 'michael'), ('mick', 'michael'),
  ('andy', 'andrew'), ('drew', 'andrew'),
  ('bob', 'robert'), ('rob', 'robert'), ('bobby', 'robert'), ('robbie', 'robert'),
  ('bill', 'william'), ('will', 'william'), ('billy', 'william'), ('willy', 'william'), ('liam', 'william'),
  ('jim', 'james'), ('jimmy', 'james'), ('jamie', 'james'),
  ('joe', 'joseph'), ('joey', 'joseph'),
  ('tom', 'thomas'), ('tommy', 'thomas'),
  ('dick', 'richard'), ('rick', 'richard'), ('rich', 'richard'), ('ricky', 'richard'),
  ('dave', 'david'), ('davy', 'david'),
  ('dan', 'daniel'), ('danny', 'daniel'),
  ('steve', 'steven'), ('stevie', 'steven'),
  ('chris', 'christopher'), ('topher', 'christopher'),
  ('matt', 'matthew'),
  ('pat', 'patrick'), ('paddy', 'patrick'),
  ('tony', 'anthony'),
  ('ted', 'theodore'), ('teddy', 'theodore'),
  ('ed', 'edward'), ('eddie', 'edward'), ('ted', 'edward'), ('ned', 'edward'),
  ('al', 'albert'), ('bert', 'albert'),
  ('al', 'alexander'), ('alex', 'alexander'), ('sandy', 'alexander'),
  ('charlie', 'charles'), ('chuck', 'charles'),
  ('frank', 'franklin'), ('frankie', 'franklin'),
  ('frank', 'francis'), ('fran', 'francis'),
  ('greg', 'gregory'),
  ('jeff', 'jeffrey'),
  ('jerry', 'gerald'), ('gerry', 'gerald'),
  ('larry', 'lawrence'),
  ('liz', 'elizabeth'), ('beth', 'elizabeth'), ('betty', 'elizabeth'), ('liza', 'elizabeth'), ('eliza', 'elizabeth'),
  ('kate', 'katherine'), ('kathy', 'katherine'), ('katie', 'katherine'), ('cathy', 'katherine'),
  ('jenny', 'jennifer'), ('jen', 'jennifer'),
  ('meg', 'margaret'), ('maggie', 'margaret'), ('peggy', 'margaret'), ('marge', 'margaret'),
  ('sue', 'susan'), ('susie', 'susan'),
  ('debbie', 'deborah'), ('deb', 'deborah'),
  ('barb', 'barbara'),
  ('pam', 'pamela'),
  ('sam', 'samuel'), ('sammy', 'samuel'),
  ('ben', 'benjamin'), ('benny', 'benjamin'),
  ('nick', 'nicholas'), ('nicky', 'nicholas'),
  ('ken', 'kenneth'), ('kenny', 'kenneth'),
  ('ron', 'ronald'), ('ronnie', 'ronald'),
  ('don', 'donald'), ('donny', 'donald'),
  ('ray', 'raymond'),
  ('harry', 'harold'),
  ('walt', 'walter'), ('wally', 'walter'),
  ('fred', 'frederick'), ('freddy', 'frederick'),
  ('doug', 'douglas'),
  ('phil', 'philip'),
  ('tim', 'timothy'), ('timmy', 'timothy'),
  ('pete', 'peter'),
  ('marty', 'martin'),
  ('jack', 'john'), ('johnny', 'john'), ('jon', 'john')
ON CONFLICT (nickname, canonical_name) DO NOTHING;

-- Function: resolve a first name to all its variants (canonical + nicknames)
CREATE OR REPLACE FUNCTION public.resolve_name_variants(_name text)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH lowered AS (SELECT lower(trim(_name)) AS n),
  -- find canonical for input (if it's a nickname)
  canonical AS (
    SELECT canonical_name FROM nickname_mappings, lowered WHERE nickname = lowered.n
    UNION
    SELECT n FROM lowered
  ),
  -- find all nicknames for the canonical(s)
  all_variants AS (
    SELECT nickname AS variant FROM nickname_mappings WHERE canonical_name IN (SELECT canonical_name FROM canonical)
    UNION
    SELECT canonical_name FROM canonical
    UNION
    SELECT n FROM lowered
  )
  SELECT array_agg(DISTINCT variant) FROM all_variants;
$$;

-- Function: fuzzy person search across executives table
-- Returns executives matching by nickname resolution + Levenshtein distance
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
SET search_path TO 'public'
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

  -- Resolve nickname variants for the first name
  SELECT resolve_name_variants(first_name) INTO name_variants;

  RETURN QUERY
  -- Exact matches via nickname resolution
  SELECT e.id, e.company_id, e.name, e.title, e.total_donations,
    'nickname_match'::text AS match_type,
    0 AS match_score
  FROM company_executives e
  WHERE (
    -- first name matches any variant
    lower(split_part(e.name, ' ', 1)) = ANY(name_variants)
    OR lower(split_part(e.name, ', ', 1)) = ANY(name_variants)
  )
  AND (last_name IS NULL OR lower(e.name) LIKE '%' || last_name || '%')

  UNION ALL

  -- Levenshtein fuzzy match (distance <= 2)
  SELECT e.id, e.company_id, e.name, e.title, e.total_donations,
    'fuzzy_match'::text AS match_type,
    levenshtein(lower(split_part(e.name, ' ', 1)), first_name) AS match_score
  FROM company_executives e
  WHERE levenshtein(lower(split_part(e.name, ' ', 1)), first_name) BETWEEN 1 AND 2
  AND (last_name IS NULL OR levenshtein(lower(split_part(e.name, ' ', -1)), last_name) <= 2)
  AND e.id NOT IN (
    SELECT e2.id FROM company_executives e2
    WHERE lower(split_part(e2.name, ' ', 1)) = ANY(name_variants)
  )

  ORDER BY match_score ASC, total_donations DESC
  LIMIT _limit;
END;
$$;
