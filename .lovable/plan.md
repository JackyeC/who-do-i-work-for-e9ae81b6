

## Fix: Replace `npm:` imports in parse-career-document (attempt with full file rewrite)

Previous line-level edits to this file have not persisted across multiple attempts. This time, use a **full file write** to guarantee the changes stick.

### Root cause
`supabase/functions/parse-career-document/index.ts` lines 27, 40, 62 still contain `npm:` specifiers. This is the only file in `supabase/functions/` with `npm:` imports. It blocks the entire edge function build.

### Fix (3 line changes, full file rewrite to ensure persistence)

| Line | Current | Replacement |
|------|---------|-------------|
| 27 | `await import("npm:mammoth@1.6.0")` | `await import("https://esm.sh/mammoth@1.6.0")` |
| 40 | `await import("npm:jszip@3.10.1")` | `await import("https://esm.sh/jszip@3.10.1")` |
| 62 | `await import("npm:pdf-parse/lib/pdf-parse.js")` | `await import("https://esm.sh/pdf-parse@1.1.1/lib/pdf-parse.js")` |

### Method
- Use `code--write` (full file overwrite) instead of `code--line_replace` to ensure changes persist.
- Read the entire file first (all 369 lines), then write it back with only the 3 import lines changed.
- No other logic changes.

### Post-fix
- Search `supabase/functions/` for any remaining `npm:` references to confirm clean.
- Confirm `/play` route exists in `src/App.tsx`.

### Why this should work now
Previous attempts used line-replace which may have conflicted or been overwritten. A full file write is deterministic.

