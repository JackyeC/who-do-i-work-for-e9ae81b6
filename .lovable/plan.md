

# Interview Prep Brief — CareerIntelligence Update

## Overview
Add an "Interview Prep" section to the CareerIntelligence page that produces a structured intel summary + interactive checklist. Uses the existing company context from the dossier search when available, with a fallback text input.

## Important: API Approach
Claude with `web_search` is not available — there's no Anthropic API key configured. Instead, this will use **Lovable AI** (already configured via `LOVABLE_API_KEY`) through a new edge function that:
1. Pulls real company data from the database (same approach as the existing `candidate-prep-pack` function)
2. Sends it to Lovable AI with a structured output tool call to get the exact JSON schema you specified
3. Returns the structured prep brief

This means the brief is grounded in your actual WDIWF database (EEOC cases, WARN notices, lobbying data, executive info, etc.) rather than a live web search — but uses the same receipt-based intelligence the rest of the app relies on.

## Changes

### 1. New Edge Function: `supabase/functions/interview-prep-brief/index.ts`
- Accepts `{ companyName, companyId?, role? }`
- Queries companies, EEOC cases, WARN notices, issue signals, public stances, lobbying, executives from DB
- Calls Lovable AI gateway with tool-calling to extract structured JSON:
  ```json
  {
    "company": "string",
    "role": "string or null",
    "intel_summary": "string (2-3 sentences, WDIWF voice)",
    "checklist": {
      "research": ["string", "string", "string"],
      "questions_to_ask": ["string", "string", "string"],
      "watch_for": ["string", "string"],
      "power_move": "string"
    }
  }
  ```
- System prompt uses WDIWF voice instruction + the specific interview prep persona from your request
- Non-streaming (structured output via tool calling doesn't stream well)

### 2. New Component: `src/components/career/InterviewPrepBrief.tsx`
- **Input block** at top:
  - If `selectedCompany` is passed, pre-populates company name (read-only pill + clear button)
  - Otherwise, plain text input: "Which company are you interviewing at?"
  - Optional text input: "What role are you interviewing for?"
  - CTA button: "Get My Prep Brief" (dark, brand-consistent, uses existing Button component)
- **Loading state**: Pulsing skeleton with "Pulling the receipts on [Company Name]..."
- **BLOCK 1 — INTEL SUMMARY**: Card labeled "COMPANY INTEL BRIEF" with the 2-3 sentence summary
- **BLOCK 2 — PREP CHECKLIST**: Card with checkable items in 4 groups separated by dividers:
  - Group 1: Research (3 items)
  - Group 2: Questions to Ask (3 items)
  - Group 3: Watch For (2 items)
  - Group 4: Power Move (1 item, accent left border highlight)
  - Uses existing `Checkbox` component, local state only
- **Error state**: Inline error card with retry guidance

### 3. Update: `src/pages/CareerIntelligence.tsx`
- Import `InterviewPrepBrief`
- Render it between the dossier results section and the Deep Dive Tabs
- Pass `selectedCompany` for auto-population context
- No new tabs, routes, or navigation items

### No Other Changes
- No Supabase schema changes
- No global style changes
- No other pages or components touched

