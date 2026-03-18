

# Zero-Cost Negotiation Simulator Upgrade

## Current State
The simulator already exists with streaming AI chat, round feedback, and session summaries. It uses `google/gemini-3-flash-preview` via Lovable AI gateway (no external API cost). The existing edge function and prompt structure are solid.

## What Needs to Change

### 1. Add Web Speech API Voice Input
Add a mic button to `SimulatorChat.tsx` that uses the browser's `SpeechRecognition` API to transcribe speech into the text input field. No external services needed.

- Toggle mic on/off with visual feedback (pulsing animation when listening)
- Transcribed text populates the input field; user can edit before sending
- Graceful fallback if browser doesn't support Web Speech API (hide mic button)

### 2. Enforce Round Limits (Max 5 Rounds)
Add a round counter and hard cap in `SimulatorChat.tsx`:
- Show "Round X of 5" indicator
- After 5 user messages, auto-end the session and show summary
- Display progress bar or round dots

### 3. Optimize AI for Short Responses
Update the edge function system prompt to enforce brevity:
- Cap recruiter response to 2-3 sentences max
- Request tighter feedback (one line per field)
- Add `max_tokens: 400` to the API call to hard-limit output

### 4. Add "Try Again" Flow
In `SessionSummary.tsx`, add a "Try Again (Same Scenario)" button that restarts with the same config instead of going back to setup.

## Files Modified

- **`src/components/negotiation/SimulatorChat.tsx`** — Add mic button with Web Speech API, round counter with 5-round limit, auto-end on limit
- **`supabase/functions/negotiation-simulator/index.ts`** — Tighten system prompt for shorter responses, add `max_tokens: 400`
- **`src/pages/NegotiationSimulator.tsx`** — Pass config to summary phase for "try again same scenario" flow
- **`src/components/negotiation/SessionSummary.tsx`** — Add "Try Again" button

## No New Files Needed
Everything layers onto the existing simulator components.

## Technical Notes
- `SpeechRecognition` / `webkitSpeechRecognition` — works in Chrome, Edge, Safari. Firefox partial support. Feature-detect and hide mic if unavailable.
- Lovable AI gateway uses included credits — already zero external cost. The `max_tokens` cap reduces token usage per round.

