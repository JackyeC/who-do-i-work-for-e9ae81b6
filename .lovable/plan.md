

The user wants me to expand the "How I Work" brief with the *mechanics* of how I actually retrieve information — where data comes from, how the pipeline flows, what's cached vs. live, etc. They're editing `.lovable/plan.md` and want this written into that file.

Since I'm in plan mode (read-only), I'll present the expanded content as a plan. Once approved, I'll write it to `.lovable/plan.md`.

---

# Plan: Expand `.lovable/plan.md` with "How I Get Information" section

Append a new section to the existing brief covering the mechanics of information retrieval, context windows, and data sources.

## What gets added to `.lovable/plan.md`

### Section 10 — Where & How I Get Information

**A. The codebase itself (primary source)**
- File reads: I open files on demand — never loaded all at once
- Search: regex/keyword across the repo, scoped to directories
- Directory listing: tree structure of any folder
- LSP intelligence: type definitions, references, symbol lookup
- All reads are live from the current working tree — no stale cache

**B. Runtime telemetry from your live preview**
- **Console logs**: snapshot at the moment you sent your message
- **Network requests**: same snapshot — URLs, status codes, payloads
- **Runtime errors**: stack traces with source mapping
- **Session replay (rrweb)**: full visual recording of your last interactions — clicks, scrolls, form input, DOM state
- **Screenshots**: on-demand via headless browser in the sandbox

**C. The database (Lovable Cloud / Postgres)**
- Direct SQL via `psql` with pre-set env vars (read + insert)
- Schema introspection via Supabase tools
- Edge function logs (last N invocations)
- Security linter results (RLS gaps, exposed tables)

**D. External web**
- Fetch any URL → markdown / HTML / screenshot
- Web search (general) + code-specific search
- Lovable docs search (semantic)
- Stripe / Shopify API search when those connectors are enabled

**E. Conversation memory**
- **Per-message**: full system prompt + your latest message + recent excerpt of chat
- **Summarized history**: older messages compressed into a short summary I see at the top
- **Chat search tools**: keyword + semantic recall of any past message in this project
- **Trajectory events**: tool-call history with parameters and results
- **Cross-project**: I can read files/messages/assets from your *other* Lovable projects on request

**F. Persistent memories (knowledge://memory/)**
- Long-term facts the system has stored about your project (architecture decisions, conventions, pipeline standards)
- Auto-surfaced when relevant — e.g., your "data-intelligence-and-ingestion-system" and "resilient-ai-standard" memories were attached to this very message

**G. Skills (knowledge://skill/)**
- Pre-built scripts I can copy + run (e.g., AI gateway caller, PDF generator, image editor)
- I list → copy to `/tmp/` → execute

**H. Project metadata always available**
- Current route the user is on (`/`)
- Current viewport size (1050×765 @ 2x)
- Current view (you're editing `.lovable/plan.md`)
- Preview URL + published URL + custom domain status

### Section 11 — How a single message actually flows

```
You send a message
  │
  ▼
System assembles my context window:
  • System prompt (rules, stack, security)
  • Project URLs + current route + viewport
  • Recent chat excerpt (older = summarized)
  • Relevant memories (auto-attached)
  • Relevant skills (auto-suggested)
  • Tool knowledge hints (suggested tools for this query)
  • Your message
  │
  ▼
I decide: Q&A, plan, or build
  │
  ▼
I pull more context as needed:
  • file reads (parallel)
  • search_files
  • console / network / replay snapshots
  • SQL queries
  • web fetches
  │
  ▼
I act (build mode) OR present plan (plan mode)
  │
  ▼
I emit suggested next-action buttons
```

### Section 12 — What I do NOT have

- No persistent memory across messages beyond what's stored in `knowledge://memory/`
- No background processes — I only run when you send a message
- No access to your local machine, only the sandbox and Lovable Cloud
- No ability to read your email, calendar, Slack, or other apps unless connected via a connector
- No "watching" the preview — telemetry is a snapshot taken at the moment your message arrives, not a live stream
- No access to other users' projects — only yours

### Section 13 — Limits Claude Design should know

- **Context window**: large but finite — older chat gets summarized, not preserved verbatim
- **Tool calls per turn**: budgeted; I prefer parallel reads to save round-trips
- **State resets**: working directory and env vars reset between bash calls
- **Read-only in plan mode**: no writes, no shell execution
- **Snapshot freshness**: console/network/replay are from message-send time, not real-time

---

## Files changed

- `.lovable/plan.md` — append sections 10-13 to existing content (preserve sections 1-9)

