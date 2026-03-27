

## Fix: Persistent `npm:` imports blocking publish

The build error is the same root cause every time — `supabase/functions/parse-career-document/index.ts` still has three `npm:` imports on lines 27, 40, and 62. Previous fix attempts did not persist in the file.

### Changes

**File: `supabase/functions/parse-career-document/index.ts`**

Three line replacements:

| Line | Current | Replacement |
|------|---------|-------------|
| 27 | `await import("npm:mammoth@1.6.0")` | `await import("https://esm.sh/mammoth@1.6.0")` |
| 40 | `await import("npm:jszip@3.10.1")` | `await import("https://esm.sh/jszip@3.10.1")` |
| 62 | `await import("npm:pdf-parse/lib/pdf-parse.js")` | `await import("https://esm.sh/pdf-parse@1.1.1/lib/pdf-parse.js")` |

No other code changes — behavior stays identical, only the import resolver changes.

**File: `src/App.tsx`** — confirm `/play` route alias is present (add if missing).

**Post-edit**: Search entire `supabase/functions/` for any remaining `npm:` to ensure nothing else slipped through.

