/**
 * Dossier URLs — sitemap & dedupe policy (operational)
 *
 * Entity resolution lives in Postgres:
 * - `companies.canonical_name` + `identity_status` (see migration 20260403234121)
 * - `potential_duplicates` for admin review of merge candidates (same table)
 *
 * Merge workflow (human / admin): resolve rows in `potential_duplicates`, consolidate
 * to a single canonical `companies` row, redirect old slugs in-app via `CompanySlugRedirect`
 * or remove duplicate rows once traffic is migrated.
 *
 * Sitemap: only index dossiers that are not bare stubs (`identity_status` not `missing`).
 * Set env `SITEMAP_INCLUDE_ALL_COMPANIES=1` to list every row (debug / backfill).
 */

export const COMPANY_SITEMAP_IDENTITY_STATUSES = ["complete", "partial"] as const;
