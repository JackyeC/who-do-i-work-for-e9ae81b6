
-- Function: trace_influence_chain
-- Traces paths through entity_linkages for a given company,
-- following the chain: spending → person/committee → contract/benefit
-- Returns ordered chain steps with cumulative confidence

CREATE OR REPLACE FUNCTION public.trace_influence_chain(
  _company_id uuid,
  _max_depth integer DEFAULT 4
)
RETURNS TABLE (
  chain_id integer,
  step integer,
  source_name text,
  source_type text,
  link_type text,
  target_name text,
  target_type text,
  amount bigint,
  confidence numeric,
  description text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE chain AS (
    -- Base case: all linkages starting from this company
    SELECT
      el.id as linkage_id,
      el.target_entity_name as next_entity,
      el.target_entity_type as next_type,
      el.source_entity_name,
      el.source_entity_type,
      el.link_type as ltype,
      el.target_entity_name as tgt_name,
      el.target_entity_type as tgt_type,
      el.amount as link_amount,
      el.confidence_score,
      el.description as link_desc,
      1 as depth,
      ARRAY[el.id] as visited
    FROM entity_linkages el
    WHERE el.company_id = _company_id

    UNION ALL

    -- Recursive: follow target → next source
    SELECT
      el2.id,
      el2.target_entity_name,
      el2.target_entity_type,
      el2.source_entity_name,
      el2.source_entity_type,
      el2.link_type as ltype,
      el2.target_entity_name,
      el2.target_entity_type,
      el2.amount,
      el2.confidence_score,
      el2.description,
      c.depth + 1,
      c.visited || el2.id
    FROM entity_linkages el2
    INNER JOIN chain c ON el2.source_entity_name = c.next_entity
      AND el2.source_entity_type = c.next_type
      AND el2.company_id = _company_id
    WHERE c.depth < _max_depth
      AND NOT (el2.id = ANY(c.visited))
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY ch.depth)::integer as chain_id,
    ch.depth as step,
    ch.source_entity_name,
    ch.source_entity_type,
    ch.ltype::text,
    ch.tgt_name,
    ch.tgt_type,
    ch.link_amount,
    ch.confidence_score,
    ch.link_desc
  FROM chain ch
  ORDER BY ch.depth, ch.source_entity_name;
END;
$$;

-- Function: get_company_roi_pipeline
-- Aggregates linkage data into Money In / Network / Benefits Out buckets
-- for the ROI Pipeline visualization

CREATE OR REPLACE FUNCTION public.get_company_roi_pipeline(_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  money_in jsonb;
  network jsonb;
  benefits_out jsonb;
  linkages jsonb;
  total_spending bigint;
  total_benefits bigint;
BEGIN
  -- Money In: donations, lobbying, PAC spending
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', el.source_entity_name,
    'amount', el.amount,
    'type', el.link_type::text
  )), '[]'::jsonb)
  INTO money_in
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('donation_to_member', 'trade_association_lobbying', 'dark_money_channel');

  -- Network: people on committees, revolving door, advisory
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', el.target_entity_name,
    'role', el.description,
    'type', el.link_type::text
  )), '[]'::jsonb)
  INTO network
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('member_on_committee', 'revolving_door', 'advisory_committee_appointment', 'interlocking_directorate');

  -- Benefits Out: contracts, grants, subsidies
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', el.target_entity_name,
    'amount', el.amount,
    'type', el.link_type::text
  )), '[]'::jsonb)
  INTO benefits_out
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('committee_oversight_of_contract', 'foundation_grant_to_district', 'state_lobbying_contract');

  -- All linkages for the connection chain
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'source', el.source_entity_name,
    'target', el.target_entity_name,
    'description', el.description,
    'confidence', el.confidence_score
  ) ORDER BY el.created_at), '[]'::jsonb)
  INTO linkages
  FROM entity_linkages el
  WHERE el.company_id = _company_id;

  -- Totals
  SELECT COALESCE(SUM(el.amount), 0)
  INTO total_spending
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('donation_to_member', 'trade_association_lobbying', 'dark_money_channel', 'lobbying_on_bill');

  SELECT COALESCE(SUM(el.amount), 0)
  INTO total_benefits
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('committee_oversight_of_contract', 'foundation_grant_to_district', 'state_lobbying_contract');

  result := jsonb_build_object(
    'moneyIn', money_in,
    'network', network,
    'benefitsOut', benefits_out,
    'linkages', linkages,
    'totalSpending', total_spending,
    'totalBenefits', total_benefits
  );

  RETURN result;
END;
$$;
