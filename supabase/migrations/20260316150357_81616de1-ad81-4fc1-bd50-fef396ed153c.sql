
DO $$
DECLARE
  pairs TEXT[][] := ARRAY[
    ARRAY['e464570d-9568-4155-aa46-94106b69d708', '35e4059d-9617-43aa-81a7-39740b5caf1b'],
    ARRAY['8f27dab7-f623-492a-b23a-6b25a789fee1', '43d154d9-019b-47a8-b976-935b7f22a7f2'],
    ARRAY['e00762fb-6366-4b3f-a91c-ebf5e2d5e33d', '6e25dc98-b2a4-47c2-900d-9ca35ea9adaf'],
    ARRAY['0b1dd360-90be-4f93-a834-db14c6d6faf7', '28812475-a422-4b1e-be16-9dbb2da95d13'],
    ARRAY['606ba27f-f56a-4a54-9845-12da45b209da', '7c24398e-0185-4650-927e-391860a73159'],
    ARRAY['16560fbc-1871-46b5-82d8-d2a716be2b14', 'dce1584e-1513-45ae-9328-566ace7332fc'],
    ARRAY['09e30c70-856d-4005-8125-fa221503de1a', 'a1414710-a40e-4f15-bbc2-64d1e91cdda3'],
    ARRAY['ef595e48-7d5b-4540-a577-7e95fc566ebf', '1103b286-cc56-464a-b561-41ce6605aaa8'],
    ARRAY['ca13c88e-ed12-4754-852b-f987db0b7098', '2d13f00e-a58e-4a85-bbba-1fab2d262e02'],
    ARRAY['526bd31c-35c1-480e-af51-53a8e0df605d', '80c66449-a0f1-407c-9d5f-86bf25cec4b6'],
    ARRAY['d5bf9960-8d71-4d41-829b-e2fb4ffb546f', '2b35e7ed-38a2-47d2-a426-3985da77258a'],
    ARRAY['ce490cdb-cb2a-474c-9771-b21a0a481c26', '4b3d6752-457e-4d13-b1a2-951b1d0bb5f7'],
    ARRAY['6f591b77-314a-4ff5-a5ff-d2977c42c3b5', '73f5abfd-ba6c-4083-91d8-c9fabbb41e86'],
    ARRAY['816a5cc8-4226-4a26-ad50-c06dbeccf1e6', '21b2b034-e482-4f29-b3e0-46f8428751ec'],
    ARRAY['54d61746-1f0c-4a85-be3f-ae3052a11bd0', 'fead9316-bff5-486b-97a3-6256a723ed53'],
    ARRAY['775a3327-1f6e-416f-9f5f-cb06ab78bfa3', '737cbd19-e20f-4bd0-90a1-6b5a1884cbeb'],
    ARRAY['0d827aa1-d5c5-4299-9dac-b69e25d43c89', '4bf3bcbb-ae6e-442b-8d1d-bd462cc91df2']
  ];
  stub_id UUID;
  keeper_id UUID;
  pair TEXT[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY pairs LOOP
    stub_id := pair[1]::UUID;
    keeper_id := pair[2]::UUID;

    -- For tables with unique constraints, delete stub data that would conflict
    DELETE FROM browse_ai_monitors WHERE company_id = stub_id;
    DELETE FROM browse_ai_change_events WHERE company_id = stub_id;
    DELETE FROM company_benchmarks WHERE company_id = stub_id;

    -- Reassign related tables
    UPDATE company_executives SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_candidates SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_party_breakdown SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_public_stances SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_dark_money SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_board_affiliations SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_revolving_door SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_spending_history SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_corporate_claims SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_corporate_structure SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_court_cases SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_eeo1_data SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_agency_contracts SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_advisory_committees SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_diversity_disclosures SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_flagged_orgs SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE company_alignment_categories SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE ai_hiring_signals SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE ai_hr_signals SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE board_interlocks SET company_a_id = keeper_id WHERE company_a_id = stub_id;
    UPDATE board_interlocks SET company_b_id = keeper_id WHERE company_b_id = stub_id;
    UPDATE board_members SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE civil_rights_signals SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE climate_signals SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE career_paths SET company_id = keeper_id WHERE company_id = stub_id;
    UPDATE career_contacts SET company_id = keeper_id WHERE company_id = stub_id;

    -- Delete the stub
    DELETE FROM companies WHERE id = stub_id;
  END LOOP;
END $$;

-- Add unique index on company name to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_unique ON companies (lower(name));
