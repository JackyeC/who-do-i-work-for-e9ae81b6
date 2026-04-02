

# Rewrite WHY_IT_MATTERS Copy in Newsletter.tsx

## Single file change: `src/pages/Newsletter.tsx` lines 40–84

Replace the `WHY_IT_MATTERS` object and controversy append line with the exact copy provided, using the "Facts Over Feelings" voice.

### Changes

**Lines 40-77** — Replace entire `WHY_IT_MATTERS` object with:
- `regulation`: "Rules change. Job protections shift with them..." / "Enforcement patterns tell you more..."
- `ai_workplace`: "AI is making hiring decisions..." / "If they're automating the process..."
- `layoffs`: "WARN filings are public..." / "Layoff patterns repeat..."
- `pay_equity`: "Pay transparency laws exist..." / "If the range is wide enough to park a truck in..."
- `labor_organizing`: "How a company responds to organizing..." / "Union outcomes set precedents..."
- `general`: "Context is free. Not having it is expensive." / "The landscape shapes the offer..."
- Remove `future_of_work`, `worker_rights`, and `legislation` categories (they'll fall through to `general`)

**Line 82** — Replace controversy append:
- Old: "Controversy signals are worth verifying — check the source links below before forming conclusions."
- New: "Controversy doesn't mean conviction. Check the receipts before you decide."

No other files affected.

