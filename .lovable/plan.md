

## Fix "Book Jackye" Button

Replace the non-functional `mailto:` link with two working actions:

1. **"Book Jackye" button** → opens `https://calendly.com/jackyeclayton` in a new tab via `window.open()`
2. **Add an "Email Jackye" button** → opens `mailto:jackye@jackyeclayton.com` (keeps email as a secondary option, but the primary CTA is Calendly)

### File: `src/pages/WorkWithJackye.tsx`
- Replace the `<a href="mailto:...">` with a `<button>` that calls `window.open('https://calendly.com/jackyeclayton', '_blank')`
- Update the email address from `jackye@whodoimworkfor.com` to `jackye@jackyeclayton.com`
- Add a small secondary "Email Jackye" link below or alongside

Single file edit, straightforward fix.

