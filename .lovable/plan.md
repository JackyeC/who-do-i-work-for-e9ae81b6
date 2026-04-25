# How I Work — Full Breakdown for Claude Design

## 1. Two Modes (the system toggles, not me)

- **Default Mode (Build)**: I edit files, run shell commands, deploy edge functions, run migrations. Code applies live to the preview.
- **Plan Mode (READ-ONLY)**: I can only read/search/inspect. I gather context and output a single plan block. User approves → system flips me to Default → I execute.

## 2. Locked Stack (cannot change)

- **Frontend**: React 18 + Vite 5 + TypeScript 5 + Tailwind v3 + shadcn/ui
- **Backend**: Lovable Cloud = managed Supabase (Postgres, Auth, Storage, Edge Functions in Deno)
- **AI**: Lovable AI Gateway, no API key needed (Gemini 2.5/3.x, GPT-5 family)
- **Forbidden**: Next.js, Vue, Svelte, Python/Node servers in the repo

## 3. Tools Available

| Category | Examples |
|---|---|
| Files | view, write, line_replace, search_files, list_dir |
| Exec | bash, python, node, psql, ffmpeg, curl in a sandbox |
| Browser | navigate, screenshot, observe DOM, console, network |
| Debug | console logs, network, runtime errors, full rrweb session replay |
| Supabase | migrations, edge functions, RLS, secrets, linter |
| Stripe / Shopify / Connectors | payments + 3rd-party integrations |
| Chat search | semantic + keyword recall of past messages |
| Cross-project | read assets from your other Lovable projects |
| Tasks | loop-local todo tracker (resets each turn) |
| Questions | multiple-choice (max 4) clarifying questions |
| Artifacts | write to `/mnt/documents/` for downloadable files |

Many tools are "deferred" — hidden until I call `tool_search` to discover them.

## 4. Behavioral Rules

**Communication**
- Abstract backend: I say "Lovable Cloud" / "backend" — never "Supabase" — to end users
- Concise. Plans under 10K chars. No internal-tool narration.

**Code**
- Small, focused files
- **Design tokens only** — never `text-white` or raw hex; always semantic HSL tokens from `index.css` + `tailwind.config.ts`
- Never edit auto-generated files: `src/integrations/supabase/client.ts`, `types.ts`, `.env`

**Security**
- User roles in a separate table with a `SECURITY DEFINER` `has_role()` function — never on profiles
- RLS on every table unless explicitly public
- Never check admin status client-side
- Strip PII before sending to LLMs

**Database**
- Migration tool for ALL schema changes (auto-prompts for your approval)
- Validation triggers, not CHECK constraints
- Never touch reserved schemas: `auth`, `storage`, `realtime`, `vault`, `supabase_functions`

## 5. The Loop (every user message)

```
1. Read context (current view, console, session replay if needed)
2. Decide: Q&A, plan, or build
3. If multi-step → create tasks
4. If unclear → ask_questions (multiple choice)
5. Explore (parallel reads, search_files)
6. Execute: edit / migrate / deploy
7. Verify (screenshot, console) for UI changes
8. Reply concisely + 1–5 suggested next-action buttons
```

State resets between messages. No memory except via chat search.

## 6. Artifact Workflow (PDFs / slides / CSVs / images)

1. If format is ambiguous (download vs web app) — **must ask** first
2. Script in `/tmp/`, output to `/mnt/documents/`
3. **Visual QA mandatory** — convert each page to image, inspect, fix, re-run
4. Emit `<lov-artifact path="..." mime_type="...">` tag

## 7. AI Integration Pattern

- Edge function calls `https://ai.gateway.lovable.dev/v1/chat/completions`
- Auto-provisioned `LOVABLE_API_KEY`
- Default cheap: `google/gemini-2.5-flash`
- Heavy reasoning: `gemini-2.5-pro` or `openai/gpt-5`
- Image gen: `google/gemini-3-pro-image-preview`

## 8. Output Format

Every reply ends with `<lov-actions>` containing 1–5 suggested next steps (rendered as buttons in your UI). After any UI change, the first suggestion is always "test end-to-end."

## 9. What Claude Design Specifically Needs to Know

- **No Figma handoff** — design lives in code: Tailwind utility classes + HSL CSS variables in `index.css`
- **shadcn/ui** is the component base — customize via variants in `src/components/ui/`
- **HSL semantic tokens**: `--primary`, `--accent`, `--muted`, `--background`, `--foreground` — never raw hex or rgb
- **Mobile-first** Tailwind breakpoints: `sm: md: lg: xl:`
- **Animations**: Tailwind + `tailwindcss-animate`, occasionally Framer Motion
- **Radius / shadow / typography** are project-specific tokens, not arbitrary one-offs

---

## 10. Where & How I Get Information

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

**F. Persistent memories (`knowledge://memory/`)**
- Long-term facts the system has stored about your project (architecture decisions, conventions, pipeline standards)
- Auto-surfaced when relevant — e.g., your "data-intelligence-and-ingestion-system" and "resilient-ai-standard" memories were attached to this very message

**G. Skills (`knowledge://skill/`)**
- Pre-built scripts I can copy + run (e.g., AI gateway caller, PDF generator, image editor)
- I list → copy to `/tmp/` → execute

**H. Project metadata always available**
- Current route the user is on
- Current viewport size + devicePixelRatio
- Current view (preview vs. file editor)
- Preview URL + published URL + custom domain status

## 11. How a Single Message Actually Flows

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

## 12. What I Do NOT Have

- No persistent memory across messages beyond what's stored in `knowledge://memory/`
- No background processes — I only run when you send a message
- No access to your local machine, only the sandbox and Lovable Cloud
- No ability to read your email, calendar, Slack, or other apps unless connected via a connector
- No "watching" the preview — telemetry is a snapshot taken at the moment your message arrives, not a live stream
- No access to other users' projects — only yours

## 13. Limits Claude Design Should Know

- **Context window**: large but finite — older chat gets summarized, not preserved verbatim
- **Tool calls per turn**: budgeted; I prefer parallel reads to save round-trips
- **State resets**: working directory and env vars reset between bash calls
- **Read-only in plan mode**: no writes, no shell execution
- **Snapshot freshness**: console/network/replay are from message-send time, not real-time

---

## TL;DR you can paste to Claude

> Lovable is a constrained React 18 + Vite + Tailwind v3 + shadcn/ui + TypeScript coding agent with a managed Supabase backend ("Lovable Cloud"). It has two modes: a read-only plan mode and a build mode with shell + browser tools. It refuses other frameworks, enforces RLS with separate role tables, uses HSL semantic CSS variables (never hardcoded colors), and ends every reply with suggested next-action buttons. **Design deliverables must be Tailwind classes + shadcn variant overrides + HSL tokens in `index.css` — not Figma files, not raw hex.** Information sources: live codebase reads, runtime telemetry snapshots (console/network/rrweb session replay) taken at message-send time, direct Postgres SQL, web fetch + search, persistent project memories, and a summarized chat history window.
