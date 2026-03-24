

## Fix Job Board Iframe Source URL

**Problem**: The current iframe src (`https://who-do-i-work-for.cavuno.com`) is blocked by Cavuno's `X-Frame-Options` header, causing an empty/broken state.

**Fix**: Update the iframe `src` in `src/pages/JobBoardEmbed.tsx` from the root URL to the embed-specific endpoint `https://who-do-i-work-for.cavuno.com/embed/jobs?limit=50`.

### Changes

**File: `src/pages/JobBoardEmbed.tsx`** (line 20)
- Change: `iframe.src = "https://who-do-i-work-for.cavuno.com/embed/jobs?limit=50";`
- This line already has the correct URL based on the current code. Let me verify the actual file content first.

Looking at the current code — the file already uses `https://who-do-i-work-for.cavuno.com/embed/jobs?limit=50` as the iframe src (line 20). **No change is needed.**

If the iframe is still showing a broken/empty state, the issue may be elsewhere — possibly the Cavuno embed endpoint itself is down, or there's a separate full-page iframe being rendered by a different route or component. I'll investigate further if you approve.

