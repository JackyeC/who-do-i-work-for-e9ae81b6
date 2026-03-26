

## Cloudflare Turnstile Bot Protection — All Public Forms

**Site key**: `0x4AAAAAACwUKaSXORtxl_tu`

---

### 1. Infrastructure

**Add Turnstile script to `index.html`**
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
```

**Create `src/hooks/useTurnstile.ts`** — reusable hook for invisible mode:
- Renders a hidden Turnstile widget into a container ref
- Exposes `getToken()` (calls `turnstile.execute()`) and `reset()`
- Site key: `0x4AAAAAACwUKaSXORtxl_tu`

**Create `supabase/functions/verify-turnstile/index.ts`** — edge function:
- Accepts `{ token }` in POST body
- Calls `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `TURNSTILE_SECRET_KEY` + token
- Returns `{ success: true/false }`

**Store `TURNSTILE_SECRET_KEY`** as a backend secret (I'll prompt you to paste it).

---

### 2. Form Integration (6 forms)

Each form gets the same pattern:
1. Render a hidden `<div ref={turnstileRef} />` inside the form
2. On submit, call `getToken()` first
3. Pass the token to the backend (either inline verification call or alongside existing edge function call)
4. If verification fails → show error, block submission

| Form | File | Backend |
|------|------|---------|
| Email subscribe | `EmailCapture.tsx` | Verify token before `supabase.from("email_signups").insert()` |
| Hero search | `HeroSearch.tsx` | Verify token before navigating to `/search` |
| Contact | `Contact.tsx` | Verify token before opening mailto |
| Waitlist /join | `EarlyAccess.tsx` | Verify token before `early_access_signups` insert |
| Check search | `Check.tsx` | Verify token before `company-discover` invoke |
| Browse discover | `Browse.tsx` | Verify token before `company-discover` invoke |

### 3. Secret needed

I'll need you to paste your **Turnstile Secret Key** from the Cloudflare dashboard (different from the site key — found on the same widget settings page).

