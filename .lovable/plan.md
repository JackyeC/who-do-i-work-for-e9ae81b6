

# Fix Contact Form: Turnstile + Email Delivery

## Two Issues Found

### Issue 1: Turnstile — "v.execute is not a function"
The form shows this error immediately on submit. The Turnstile script loads with a warning "Turnstile already has been loaded" which can corrupt the API object. Additionally, `window.turnstile.render()` in invisible mode may return a non-string value (or the `execute` method may not exist on the API in certain states).

### Issue 2: Email Delivery — 404 from email.lovable.dev
Edge function logs show `submit-contact-form` passes Turnstile verification but then fails when calling `https://email.lovable.dev/v1/send` — it returns a Customer.io 404 page. This means even after fixing Turnstile, emails won't send.

---

## Plan

### Step 1: Harden the Turnstile hook (`src/hooks/useTurnstile.ts`)

- Guard `execute` call: check `typeof window.turnstile.execute === 'function'` before calling. If it's not a function, fall back to returning an empty token (which triggers the graceful skip).
- Guard `render` return value: check that `widgetIdRef.current` is a string after render. If render returns undefined/null, treat the widget as unavailable.
- Add a timeout to the `getToken` promise so it doesn't hang forever (5 second timeout, resolves with empty string).

### Step 2: Make the contact form gracefully degrade when Turnstile fails

In `src/pages/Contact.tsx`:
- When `getToken()` returns an empty string, **still submit the form** but with `token: ""`.
- This allows the edge function to decide whether to reject (strict mode) or accept (graceful mode).

### Step 3: Update `submit-contact-form` edge function for both issues

**Turnstile graceful fallback:**
- If token is empty, skip Turnstile verification entirely (accept the form) rather than blocking. This is acceptable for a contact form — bot spam can be filtered later.

**Fix email delivery:**
- The `email.lovable.dev/v1/send` endpoint is returning 404. Replace it with a direct approach: save the contact submission to a `contact_submissions` database table instead of (or in addition to) trying the email endpoint. This way submissions are never lost.
- Alternatively, keep the email attempt but add a database fallback: if email fails, store the submission in a table so you can retrieve it.

### Step 4: Create `contact_submissions` table (database migration)

```sql
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  reason text DEFAULT 'General',
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  email_sent boolean DEFAULT false
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

This ensures no message is ever lost, regardless of email delivery status.

### Files Changed

| File | Change |
|---|---|
| `src/hooks/useTurnstile.ts` | Guard `execute`, guard `render` return, add timeout |
| `src/pages/Contact.tsx` | Allow form submission when token is empty |
| `supabase/functions/submit-contact-form/index.ts` | Skip Turnstile when no token; save to DB as fallback when email fails |
| New migration | Create `contact_submissions` table |

### Outcome
- Contact form works immediately even if Turnstile is broken or domain isn't authorized
- Submissions are always saved to the database
- Email delivery is attempted but failures don't block the user

