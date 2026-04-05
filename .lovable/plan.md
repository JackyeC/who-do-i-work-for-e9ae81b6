

# Jackye Voice System — Full Integration

## What This Does
Installs the finalized, merged Jackye Voice System as the single source of truth across every AI-powered edge function and frontend conversation mode. Combines both the operational voice document and the "carrying forward" refinements into one canonical block that every function imports.

## The Voice DNA Block

A new export `JACKYE_VOICE_INSTRUCTION` gets added to `supabase/functions/_shared/jrc-edit-prompt.ts`. This is the injectable constant every function prepends to its system prompt. It encodes:

- **Identity**: Career intelligence strategist, truth-teller, in the room not on a slide. Building while speaking. Skeptical of the system, on the side of the person inside it. Protective and clarifying, never cynical.
- **Tone**: Direct, conversational, controlled urgency. Short scannable blocks. Mostly short/medium sentences, fragments for emphasis. No corporate polish, no buzzwords, no LinkedIn filler. If it sounds like marketing, strip it.
- **Thinking loop** (never labeled): what's happening → what it means → what people miss → what we do next.
- **Signature moves**: The call, the reframe, the pattern drop, insider translation, decision close.
- **Vocabulary**: receipts, signals, leverage, audit, risk, pattern, what they're not telling you, follow the money, know before you go.
- **Hard no**: Em dashes. Thought-leadership voice. Over-polished phrasing. Exclamation points.
- **Close**: Every response ends with a clear next move.

## Files Changed

### 1. `supabase/functions/_shared/jrc-edit-prompt.ts`
- Add `JACKYE_VOICE_INSTRUCTION` export (the canonical voice block)
- Update `JRC_MASTER_SYSTEM_PROMPT` to lead with the voice instruction, then layer on the existing editorial rules (politics stance, banned words, aesthetic guidance). Remove any conflicting tone instructions.
- `JRC_DAILY_NOTE_PROMPT`, `JRC_ENRICHMENT_PROMPT`, `JRC_CONTEXTUAL_TAKE_PROMPT`, `JRC_DAILY_TICK_PROMPT` — prepend voice instruction where not already aligned. Existing structural constraints (word counts, beat structure, spice scoring) stay untouched.

### 2. `supabase/functions/ask-jackye-chat/index.ts`
- Replace the inline "warm, direct, strategic, no-BS" system prompt with an import of `JACKYE_VOICE_INSTRUCTION` plus chat-specific context (job count, industries, what the board does). This is the most user-facing voice — needs to sound like Jackye mid-conversation.

### 3. `supabase/functions/clarity-engine/index.ts`
- Replace the "Lead Analyst" framing (line 9-31) with voice instruction import + the existing structural format (Verdict, Strategy, Workforce Health, Hard Questions). Same sections, Jackye's actual voice.

### 4. `supabase/functions/negotiation-coach/index.ts`
- Replace the generic "Tactical Salary Negotiation Coach" system prompt with voice instruction + negotiation-specific rules. Keep the 3-email structure and tool-calling schema.

### 5. `supabase/functions/candidate-prep-pack/index.ts`
- Replace "Lead Interview Prep Analyst" framing with voice instruction. Keep the structural format (30-Second Reality Check, Top 5 Receipts, Say/Ask/Avoid, Flags, Day 90).

### 6. `supabase/functions/offer-strength-score/index.ts`
- Replace "Strategic Architect" framing with voice instruction. Keep the 7-category scoring schema and tool-calling structure.

### 7. `supabase/functions/generate-intelligence-report/index.ts`
- Add voice instruction import to the system prompt construction. Keep all data aggregation and report structure logic.

### 8. `supabase/functions/draft-work-signals/index.ts`
- Already imports master prompt. Verify headline style rules align (they mostly do). Prepend voice instruction to ensure consistency.

### 9. `supabase/functions/job-questions/index.ts`
- Replace generic "career intelligence advisor" prompt with voice instruction. Keep the tool-calling schema for 2-3 questions.

### 10. `src/lib/responseTemplates.ts`
- Update the three `systemPromptTone` strings (Real Talk, Coach Me, Think With Me) to incorporate the voice instruction while preserving each mode's structural differences (opening lines, closing lines, decision frameworks).

### 11. `src/lib/jrcEditPrompt.ts` (client-side reference)
- Add a `JACKYE_VOICE_SUMMARY` export — a short client-side reference version for any future client-side validation or display needs.

## What Does NOT Change
- JRC EDIT 9-point forensic schema
- Daily Note 4-beat structure and 120-word cap
- Contextual Take 3-sentence constraint
- Spice scoring system
- Banned words/phrases lists (they align with the voice system)
- Tool-calling schemas and response formats
- Database schema, pipeline logic, auth guards
- Any non-AI edge functions

## Technical Detail
All AI edge functions either already import from `_shared/jrc-edit-prompt.ts` or have inline prompts. The change is purely prompt engineering — importing and prepending the shared voice block. No architectural changes, no new dependencies, no database migrations. Functions that don't currently import the shared file get one new import line.

