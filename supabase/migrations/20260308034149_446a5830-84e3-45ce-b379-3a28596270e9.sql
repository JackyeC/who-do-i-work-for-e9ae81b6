
CREATE OR REPLACE FUNCTION public.get_company_roi_pipeline(_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  money_in jsonb;
  network jsonb;
  benefits_out jsonb;
  linkages jsonb;
  total_spending bigint;
  total_benefits bigint;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', el.source_entity_name,
    'amount', el.amount,
    'type', el.link_type::text,
    'matched_entity_name', el.matched_entity_name,
    'matched_entity_type', el.matched_entity_type
  )), '[]'::jsonb)
  INTO money_in
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('donation_to_member', 'trade_association_lobbying', 'dark_money_channel');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', el.target_entity_name,
    'role', el.description,
    'type', el.link_type::text
  )), '[]'::jsonb)
  INTO network
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('member_on_committee', 'revolving_door', 'advisory_committee_appointment', 'interlocking_directorate');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', el.target_entity_name,
    'amount', el.amount,
    'type', el.link_type::text,
    'matched_entity_name', el.matched_entity_name,
    'matched_entity_type', el.matched_entity_type
  )), '[]'::jsonb)
  INTO benefits_out
  FROM entity_linkages el
  WHERE el.company_id = _company_id
    AND el.link_type IN ('committee_oversight_of_contract', 'foundation_grant_to_district', 'state_lobbying_contract');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'source', el.source_entity_name,
    'target', el.target_entity_name,
    'description', el.description,
    'confidence', el.confidence_score
  ) ORDER BY el.created_at), '[]'::jsonb)
  INTO linkages
  FROM entity_linkages el
  WHERE el.company_id = _company_id;

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
$function$;
