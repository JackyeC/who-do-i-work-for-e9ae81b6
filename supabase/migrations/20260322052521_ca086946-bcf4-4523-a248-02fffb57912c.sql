-- Update party breakdown for JPMorgan Chase (only had "Other")
DELETE FROM company_party_breakdown WHERE company_id = 'c9d0e1f2-a3b4-5678-cdef-789012345678';
INSERT INTO company_party_breakdown (company_id, party, amount, color) VALUES
  ('c9d0e1f2-a3b4-5678-cdef-789012345678', 'Democrat', 310000, 'hsl(211, 69%, 50%)'),
  ('c9d0e1f2-a3b4-5678-cdef-789012345678', 'Republican', 290000, 'hsl(0, 72%, 51%)'),
  ('c9d0e1f2-a3b4-5678-cdef-789012345678', 'Other', 120000, 'hsl(215, 15%, 47%)');

-- Update party breakdown for Amazon (only had "Other")
DELETE FROM company_party_breakdown WHERE company_id = 'd4e5f6a7-b8c9-0123-defa-234567890123';
INSERT INTO company_party_breakdown (company_id, party, amount, color) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Democrat', 380000, 'hsl(211, 69%, 50%)'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Republican', 280000, 'hsl(0, 72%, 51%)'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Other', 141000, 'hsl(215, 15%, 47%)');

-- Update party breakdown for Alphabet Inc. (Google)
DELETE FROM company_party_breakdown WHERE company_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
INSERT INTO company_party_breakdown (company_id, party, amount, color) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Democrat', 510000, 'hsl(211, 69%, 50%)'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Republican', 180000, 'hsl(0, 72%, 51%)'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Other', 109000, 'hsl(215, 15%, 47%)');

-- Update party breakdown for Goldman Sachs
DELETE FROM company_party_breakdown WHERE company_id = 'b4c5d6e7-f8a9-0123-bcde-23456789abcd';
INSERT INTO company_party_breakdown (company_id, party, amount, color) VALUES
  ('b4c5d6e7-f8a9-0123-bcde-23456789abcd', 'Democrat', 280000, 'hsl(211, 69%, 50%)'),
  ('b4c5d6e7-f8a9-0123-bcde-23456789abcd', 'Republican', 340000, 'hsl(0, 72%, 51%)'),
  ('b4c5d6e7-f8a9-0123-bcde-23456789abcd', 'Other', 80000, 'hsl(215, 15%, 47%)');

-- Update party breakdown for Starbucks
DELETE FROM company_party_breakdown WHERE company_id = 'c5d6e7f8-a9b0-1567-cdef-789012345678';
INSERT INTO company_party_breakdown (company_id, party, amount, color) VALUES
  ('c5d6e7f8-a9b0-1567-cdef-789012345678', 'Democrat', 190000, 'hsl(211, 69%, 50%)'),
  ('c5d6e7f8-a9b0-1567-cdef-789012345678', 'Republican', 130000, 'hsl(0, 72%, 51%)'),
  ('c5d6e7f8-a9b0-1567-cdef-789012345678', 'Other', 80000, 'hsl(215, 15%, 47%)');

-- Update Jackye's Read blurbs
UPDATE companies SET jackye_insight = 'Jamie Dimon''s empire runs on regulatory settlements — $920M in spoofing fines, a $13B mortgage crisis payout, and a 5-day RTO mandate. The brand says ''global leader.'' The receipts say ''manage the risk.''' WHERE id = 'c9d0e1f2-a3b4-5678-cdef-789012345678';

UPDATE companies SET jackye_insight = 'Amazon warehouses log injury rates 2x the industry average while spending $19M lobbying against accountability. The ''Day 1'' culture is real — it just looks different from the shop floor.' WHERE id = 'd4e5f6a7-b8c9-0123-defa-234567890123';

UPDATE companies SET jackye_insight = 'DOJ antitrust + $391M privacy settlement + AI layoffs hitting non-technical roles hardest. Google''s brand is innovation; its public record is consolidation and regulatory catch-up.' WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
UPDATE companies SET jackye_insight = 'DOJ antitrust + $391M privacy settlement + AI layoffs hitting non-technical roles hardest. Google''s brand is innovation; its public record is consolidation and regulatory catch-up.' WHERE id = '6ef52351-3738-4cba-988a-77af5b7fb65f';

UPDATE companies SET jackye_insight = '1MDB, Marcus shutdowns, and $2.9B in global fines. Goldman is rebuilding its consumer narrative but its institutional track record is what job seekers should read first.' WHERE id = 'b4c5d6e7-f8a9-0123-bcde-23456789abcd';
UPDATE companies SET jackye_insight = '1MDB, Marcus shutdowns, and $2.9B in global fines. Goldman is rebuilding its consumer narrative but its institutional track record is what job seekers should read first.' WHERE id = 'f5bc4584-619a-45f7-ba3e-7ba5ae36f034';

UPDATE companies SET jackye_insight = 'Brian Niccol came in at $96M with a mandate to fix culture — but the NLRB has 60+ pending cases and store closures are accelerating. The turnaround story is real, but so is the turbulence.' WHERE id = 'c5d6e7f8-a9b0-1567-cdef-789012345678';