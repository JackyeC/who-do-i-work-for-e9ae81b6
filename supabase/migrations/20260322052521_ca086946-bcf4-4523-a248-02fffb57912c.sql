-- Update party breakdown for JPMorgan Chase
DELETE FROM company_party_breakdown
WHERE company_id = (SELECT id FROM companies WHERE slug = 'jpmorgan-chase' LIMIT 1);

INSERT INTO company_party_breakdown (company_id, party, amount, color)
SELECT id, 'Democrat', 310000, 'hsl(211, 69%, 50%)' FROM companies WHERE slug = 'jpmorgan-chase'
UNION ALL
SELECT id, 'Republican', 290000, 'hsl(0, 72%, 51%)' FROM companies WHERE slug = 'jpmorgan-chase'
UNION ALL
SELECT id, 'Other', 120000, 'hsl(215, 15%, 47%)' FROM companies WHERE slug = 'jpmorgan-chase';

-- Update party breakdown for Amazon
DELETE FROM company_party_breakdown
WHERE company_id = (SELECT id FROM companies WHERE slug = 'amazon' LIMIT 1);

INSERT INTO company_party_breakdown (company_id, party, amount, color)
SELECT id, 'Democrat', 380000, 'hsl(211, 69%, 50%)' FROM companies WHERE slug = 'amazon'
UNION ALL
SELECT id, 'Republican', 280000, 'hsl(0, 72%, 51%)' FROM companies WHERE slug = 'amazon'
UNION ALL
SELECT id, 'Other', 141000, 'hsl(215, 15%, 47%)' FROM companies WHERE slug = 'amazon';

-- Update party breakdown for Alphabet / Google
DELETE FROM company_party_breakdown
WHERE company_id = (SELECT id FROM companies WHERE slug = 'alphabet' LIMIT 1);

INSERT INTO company_party_breakdown (company_id, party, amount, color)
SELECT id, 'Democrat', 510000, 'hsl(211, 69%, 50%)' FROM companies WHERE slug = 'alphabet'
UNION ALL
SELECT id, 'Republican', 180000, 'hsl(0, 72%, 51%)' FROM companies WHERE slug = 'alphabet'
UNION ALL
SELECT id, 'Other', 90000, 'hsl(215, 15%, 47%)' FROM companies WHERE slug = 'alphabet';

