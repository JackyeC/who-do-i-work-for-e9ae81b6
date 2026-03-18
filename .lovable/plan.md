

# Negotiation Simulator — Candidate & Recruiter Mode

## Problem
The simulator only supports one perspective: user plays candidate, AI plays recruiter. There's no way to practice as a recruiter negotiating with a candidate.

## Changes

### 1. Add `perspective` field to SimulatorSetup
Add a toggle at the top of the setup form: **"I'm practicing as..."** with two options:
- **Candidate** — "I'm negotiating with a recruiter/hiring manager" (current behavior)
- **Recruiter** — "I'm negotiating with a candidate"

Update the `SimulatorConfig` type to include `perspective: "candidate" | "recruiter"`.

### 2. Update the edge function system prompt
In `supabase/functions/negotiation-simulator/index.ts`, branch the system prompt based on `config.perspective`:
- **Candidate mode** (existing): AI plays the recruiter, user is the candidate
- **Recruiter mode** (new): AI plays the candidate, user is the recruiter. The AI will push back on offers, ask for more comp, negotiate flexibility — and give feedback on the user's recruiter tactics (closing technique, empathy, firmness)

### 3. Update UI labels dynamically
- Chat input placeholder: "Type your response to the recruiter…" → dynamic based on perspective
- Session header: show which perspective is active
- Feedback framing adjusts (recruiter feedback focuses on closing skills, candidate retention, etc.)

### Files Modified
- `src/components/negotiation/SimulatorSetup.tsx` — add perspective toggle + update type
- `supabase/functions/negotiation-simulator/index.ts` — dual system prompts
- `src/components/negotiation/SimulatorChat.tsx` — dynamic placeholder text
- `src/pages/NegotiationSimulator.tsx` — pass perspective context to header display

