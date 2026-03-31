

# Ask Jackye — Career Advocate Rebuild

## What exists today

Three separate Jackye implementations with inconsistent tone and fragmented experiences:

1. **`/ask-jackye` page** — Terminal-aesthetic full page with scan animations, intelligence report format, FAQ section. Uses `ask-jackye` edge function with heavy "digital twin" system prompt (~5K chars). Requires auth.
2. **Global floating widget** (`src/components/AskJackyeWidget.tsx`) — Headshot-based chat bubble, uses same `ask-jackye` edge function. Requires auth.
3. **Jobs floating widget** (`src/components/jobs/AskJackyeWidget.tsx`) — Lighter chat widget on job pages, uses `ask-jackye-chat` edge function with simpler prompt. No auth required.

**Problems:**
- The system prompt is over-engineered — "digital twin", "Redline Auditor", emoji-heavy report templates, AI safety career paragraphs that feel off-brand
- The terminal scan animation is performative theater, not advocacy
- Quick prompts are generic ("How do I negotiate salary?") instead of the 6 core questions from the prompt
- Three widgets doing similar things with different edge functions
- The Jackye voice sounds like a corporate AI consultant, not a warm, blunt career advocate

## What we're building

Rebuild the `/ask-jackye` page and the global widget with a unified Jackye voice focused on the 6 core career advocacy questions. Rewrite the system prompt to sound like a trusted advocate, not a corporate intelligence system.

## Changes

### 1. Rewrite `supabase/functions/ask-jackye/index.ts` — System prompt overhaul

Replace the ~200-line system prompt with a focused ~80-line prompt that:
- Drops the "digital twin" framing, "Redline Auditor" title, emoji report templates, AI safety career section
- Leads with Jackye as a **career advocate** — warm, direct, strategic, no-BS
- Focuses on the 6 core questions: Should I apply? Take this offer? Stay or go? What to ask? How to explain my move? What to negotiate?
- Uses plain language, not corporate jargon
- Keeps the data-enrichment logic (company queries) intact — just changes the personality layer
- Signature phrases: "Let's look at the receipts", "Here's what the record says", "Clarity builds trust"
- Response style: 2-4 paragraphs, markdown, always ends with a concrete next step
- No emoji report headers, no tables unless specifically asked
- Acknowledge uncertainty honestly: "I don't have data on that yet" instead of generating fake confidence

Keep all the existing data-fetching logic (company, signals, execs, board, EEO-1, court cases, benchmarks). Only the `SYSTEM_PROMPT` constant changes.

### 2. Rebuild `src/pages/AskJackye.tsx` — Page redesign

Replace the terminal-aesthetic page with a clean, dark, editorial experience:
- **Remove**: Scan animation system, ScanLogLine component, SCAN_PHASES, FAQ section, terminal header with "ENCRYPTED" badge
- **Keep**: Streaming chat logic, auth gate, Jackye headshot
- **New header**: Jackye headshot + "Ask Jackye" + "Your career advocate" subtitle. Clean, not terminal-themed.
- **New quick prompts**: Replace the 5 intelligence categories with 6 advocacy-focused prompts:
  1. "Should I apply to this company?"
  2. "Should I take this offer?"
  3. "Should I stay or leave my current job?"
  4. "What should I ask in my interview?"
  5. "How do I explain my next career move?"
  6. "What should I negotiate?"
- **Chat styling**: Keep the left-border message styling but soften — use primary accent for Jackye, muted for user. Remove mono/terminal typography for messages.
- **Opening message**: "Hey — I'm Jackye. I've spent 15+ years inside hiring. Tell me what you're weighing, and I'll give you the real talk — receipts included."
- Dark background, gold accent moments, DM Sans body text
- Mobile-first, no sidebar clutter

### 3. Update `src/components/AskJackyeWidget.tsx` — Global widget refresh

- Update the opening message to match the new Jackye voice
- Update quick prompts to the 6 core questions (shorter versions for chips)
- Keep existing streaming logic and auth gate
- Keep headshot in header

### 4. Update `supabase/functions/ask-jackye-chat/index.ts` — Align lighter prompt

- Update the system prompt to match the new Jackye voice (shorter version for the jobs widget)
- Keep the existing data-fetching logic (job count, industries)
- Drop "WDIWF Intelligence Advisor" framing, use "career advocate" language

## Files

| File | Action |
|---|---|
| `supabase/functions/ask-jackye/index.ts` | Edit — rewrite SYSTEM_PROMPT (~200→~80 lines) |
| `src/pages/AskJackye.tsx` | Edit — rebuild page layout, remove scan animation, new prompts |
| `src/components/AskJackyeWidget.tsx` | Edit — update voice, prompts |
| `supabase/functions/ask-jackye-chat/index.ts` | Edit — align system prompt |

## No new files, no migration needed

All changes are edits to existing files. The streaming infrastructure, auth gates, and data enrichment stay intact.

