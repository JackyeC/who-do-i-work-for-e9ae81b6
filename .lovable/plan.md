

# Stage 2 — Execute Now

This is the final approval gate. Clicking approve switches to implementation mode and I will immediately:

## 1. Run database migration
The exact SQL from your approved plan — 3 tables, RLS, CHECK constraint, indexes, trigger. No changes from what you approved.

## 2. Create 3 files
- `src/lib/feature-flags.ts` — `export const ENABLE_PERSON_ENTITIES = false;`
- `src/types/person-entity.ts` — Person, PersonSource, EntityMention interfaces + CONFIDENCE_LABEL_DISPLAY map
- `supabase/seed/person-entity-test-data.sql` — 2-3 test inserts

## 3. Return proof
Exact format you requested: file contents, database confirmation, change summary.

## Not touched
No existing files. No UI. No hooks. No Stage 3.

