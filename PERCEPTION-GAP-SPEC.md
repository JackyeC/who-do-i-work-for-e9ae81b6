# Perception Gap™ Product Spec
## WDIWF — Trust as a Service

**Author:** Jackye Clayton
**Date:** March 30, 2026
**Status:** V1 — Ready to Build

---

## Core Concept

**"What they said vs what's actually showing up."**

Perception Gap™ is the psychological layer that explains *why* people get fooled by employer branding. It compares what a company *claims* to be against what verifiable signals actually show — and tells users when they're being marketed to instead of informed.

### The Insight

People don't choose jobs based on salary, brand, or job title. They react to perceived authenticity, emotional signal, and whether something "feels real." Perception Gap™ exposes when that feeling is manufactured.

### Positioning

> "Here's why you were about to make a mistake."

---

## Feature 1: Perception Gap™ Module

**Location:** Company Profile page (`/company/:id`), replacing/enhancing existing `RealityGapBlock`

### What Users See

**Header:** Perception Gap™
**Subheader:** "What they said vs what's actually showing up."

### Data Structure

| Column | Description |
|--------|-------------|
| Claim | What the company says (from careers page, job descriptions, recruiter messaging) |
| Reality | What signals actually show (EEOC/OSHA/Wage data, attrition patterns, promotion gaps) |
| Gap Signal | Low / Medium / High risk indicator |

### Gap Score

- **Low** (0–30): Signals generally align with claims
- **Medium** (31–60): Some contradictions worth exploring
- **High** (61–100): Strong disconnect between brand and reality

### Trigger Logic

Show "Why This Feels Right (But Might Not Be)" section when:
- High brand strength + weak underlying signals
- Strong recruiter experience + weak company patterns
- Beautiful careers page + messy compliance history

### Jackye's Take (Signature Block)

Every Perception Gap™ module ends with a short, sharp observation:

> "This looks clean on the surface. The signals underneath tell a different story."

### CTA

> **Still deciding? Run it by me.**
> If something feels off but you can't explain why — that's exactly where I come in.
> **[ Ask Jackye ]**

---

## Feature 2: Conversation Modes

**Location:** AskJackye widget — shown before first interaction and saveable per user

### Mode Selector

**Prompt:** "How do you want me to walk through this with you?"

| Mode | Icon | Label | Description |
|------|------|-------|-------------|
| Real Talk | 💜 | Real Talk | "I'll tell you what you need to hear, not what you want to hear." |
| Coach Me | 🧠 | Coach Me | "I'll break this down step by step so you know what to do next." |
| Think With Me | 🤝 | Think With Me | "We'll figure this out together." |

**Default:** Real Talk

**Anchor line (shown after selection):**
> "Got it. I'll meet you there — but I'm still going to be honest."

### Response Templates Per Mode

#### Real Talk (Default)
- **Opening:** "Alright — let's get into this."
- **Tone:** Direct, sharp, protective, a little side-eye
- **Signature lines:** "This sounds good. That's the problem." / "If it feels perfect too fast, you're being marketed to."
- **Close:** "Send me what they say — I'll help you read between the lines."

#### Coach Me
- **Opening:** "Let's walk through this step by step."
- **Tone:** Structured, clear, calm authority
- **Format:** Step 1/2/3, Yes if/Caution if/No if framework
- **Close:** "Bring me their answers and we'll refine from there."

#### Think With Me
- **Opening:** "Okay — let's slow this down for a second."
- **Tone:** Collaborative, calm, present
- **Format:** Questions back to user, gentle reframes
- **Close:** "Want to walk through what to ask them next?"

### Universal Rules (All Modes)
1. Reflect back what they shared
2. Show what signals say
3. Call out the tension
4. Give a clear recommendation
5. Keep the conversation open

---

## Feature 3: Send It to Jackye

**Location:** AskJackye widget + standalone page + Perception Gap™ CTA

### What Users Can Upload
- Interview notes
- Recruiter messages / emails
- Offer letters
- "This feels weird but I can't explain it" (free text)

### Response Flow
1. Acknowledge what they shared
2. Analyze against available company signals
3. Flag contradictions or missing information
4. Give a clear next-step recommendation
5. Prompt for follow-up

### Upload Types
| Type | Label | Analysis Focus |
|------|-------|---------------|
| Interview Notes | "Walk me through your interview" | Clarity, consistency, red flags |
| Recruiter Email | "Let me read between the lines" | Pressure tactics, vagueness, promises |
| Offer Letter | "Let's break this down" | Compensation gaps, legal flags, missing terms |
| Gut Feeling | "Tell me what's bugging you" | Pattern matching against signals |

---

## Feature 4: Jackye's Take (Enhanced)

**Location:** Every company page, every offer review, every analysis

### Format
Short. Punchy. Never more than 2-3 sentences.

### Examples
- "This looks buttoned up on the surface. The signals underneath say otherwise."
- "This sounds good. That's the problem."
- "If it feels perfect too fast, you're being marketed to."
- "This one's worth a second look."

### Recurring Blocks
- **"Read This Before You Get Excited"** — for high perception gaps
- **"Here's What's Not Adding Up"** — for contradictory signals
- **"This Is Where People Get Tripped Up"** — for common mistake patterns
- **"If I Were You…"** — for decision moments

---

## Technical Implementation

### New Components
1. `PerceptionGapModule.tsx` — main module (enhances RealityGapBlock)
2. `ConversationModeSelector.tsx` — 3-mode picker for AskJackye
3. `SendItToJackye.tsx` — upload + analysis interface
4. `JackyesTake.tsx` — enhanced signature insight block
5. `PerceptionGapScore.tsx` — visual score indicator
6. `responseTemplates.ts` — mode-specific response templates

### Data Model
Uses existing `company_public_stances` table + new perception scoring logic

### Integration Points
- Company Profile page (after Integrity Indicators)
- AskJackye widget (mode selector + send feature)
- Offer Review pages (perception layer on offers)

---

## Content Strategy: "Perception Gap of the Week"

Weekly content piece:
1. Pick a company
2. Show what they say vs what's happening
3. Break down where people get fooled
4. End with: "Stop applying. Start aligning."

---

## Success Metrics

People say:
- "I checked WDIWF before signing"
- "I ran it by Jackye"
- "Something felt off and she called it"

---

*"You're not building a database. You're building a lie detector for employer identity."*
