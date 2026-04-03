

## Daily Note Control System — Implementation

### What's wrong

1. **Prompt** (lines 139–159): Inherits `JRC_MASTER_SYSTEM_PROMPT` (identity-specific framing), asks for "Always in your corner — Jackye" signature, uses old 4-part structure that doesn't match the new spec.
2. **User message** (lines 109–119): Contradicts the new prompt — asks for "text message from a mentor" and signature.
3. **No validation**: AI output goes straight to client with no sanitization, word-count check, or banned-phrase scan.
4. **Fallbacks**: Generic, fluffy, no sharp closing question.

### Changes

#### 1. `supabase/functions/_shared/jrc-edit-prompt.ts` (lines 139–159)
Replace `JRC_DAILY_NOTE_PROMPT` with the user's exact standalone prompt (no longer inheriting `JRC_MASTER_SYSTEM_PROMPT`).

#### 2. `supabase/functions/generate-jackye-note/index.ts`
- **Replace user message** (lines 109–119) with context-only content (headline, summary, industry, company, values) — no formatting instructions (the system prompt handles that).
- **Add `sanitizeNote()`**: Strip lines containing `<think>`, `JRC EDIT`, `draft`, `Here is`, system scaffolding.
- **Add `validateNote()`**: Check ≤120 words, scan for banned phrases, verify final line ends with `?`. If fail → return fallback.
- **Rewrite `generateTemplateNote()`**: 3 rotating spec-compliant fallbacks, each ≤120 words, ending with a sharp question.

#### 3. `src/components/dashboard/JackyeMessage.tsx`
- Add artifact-detection filter before render (check for `<think>`, `JRC EDIT`, draft markers). If contaminated → show "Still reviewing today's signal. Check back shortly."
- Render signature ("Always in your corner — Jackye") as a static element — not part of AI output.
- **No layout/styling changes.**

#### 4. `src/services/JackyeNoteService.ts`
- Rewrite `fallbackNote()` with 3 rotating notes matching the 4-beat structure, each ≤120 words, ending with a question. No signature in note text.

### What will NOT change
- Dashboard layout, spacing, typography, component order
- Greeting, date, gold separator, Like/Save buttons
- Any other page, route, or component

### Files

| File | Scope |
|------|-------|
| `supabase/functions/_shared/jrc-edit-prompt.ts` | Replace lines 139–159 with standalone prompt |
| `supabase/functions/generate-jackye-note/index.ts` | New user message, sanitize+validate, new fallbacks |
| `src/components/dashboard/JackyeMessage.tsx` | Sanitization filter, static signature |
| `src/services/JackyeNoteService.ts` | Spec-compliant rotating fallbacks |

