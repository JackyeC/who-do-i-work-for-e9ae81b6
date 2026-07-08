## Goal
Verify the new dossier request workflow is durable and observable, even if the full employer file is not instantly finished.

## What to check now

### 1. Submit a clean test request
Use a company that is not already complete, and submit it once from the public search/request flow.

Check that the user sees one clear outcome immediately:
- Request received
- Employer file is being reviewed or built
- No blank screen
- No misleading “complete” message unless the dossier is actually complete

### 2. Confirm the request was saved
In the backend, confirm a durable request row exists for the company and requester.

Acceptance signal:
- The request exists after page refresh
- Email/phone/contact value is stored if provided
- The request is not only held in browser state

### 3. Confirm duplicate requests attach to the same company job
Submit the same company again with the same requester, then with a different requester.

Acceptance signal:
- Same company does not create multiple competing build jobs
- Each requester is attached to the company job
- A repeat request does not consume a new-job allowance if an active job already exists

### 4. Confirm job status is separate from notification status
Check that the system can represent these states independently:
- Build queued, notification not yet sent
- Build running, notification pending
- Build complete, notification pending
- Build complete, notification sent
- Build failed or partial, notification still handled honestly

Acceptance signal:
- “Built” and “notified” are not sharing one overloaded status field
- A notification failure does not make the dossier look unfinished
- A dossier failure does not make notification look delivered

### 5. Confirm partial completion behavior
Trigger or inspect a company where only some data can be collected.

Acceptance signal:
- Partial results are saved
- Missing sections explain what is unavailable
- The requester is not told the file is complete if the build is partial
- The UI shows under-review or partial state honestly

### 6. Confirm notification fan-out
For one company job with multiple requesters, verify every requester is eligible for notification.

Acceptance signal:
- Notifications are per request/requester, not only per company
- One failed notification does not block the others
- Retry count and last error can be tracked
- A requester is not notified twice for the same terminal outcome

### 7. Confirm anonymous job status is safe
If there is a public status endpoint or status page, test it with:
- Valid request token
- Missing token
- Random token
- Another user’s request token

Acceptance signal:
- Valid token returns only that request’s safe status
- Invalid/missing tokens do not expose company-wide requester data
- No private emails, phone numbers, internal errors, or raw logs are exposed

### 8. Confirm the slow part is the build, not the request
Measure two times separately:
- Time from click to “request saved”
- Time from saved request to dossier completion

Acceptance target:
- Request saved should feel fast, ideally under 1 to 2 seconds
- Dossier build may take longer, but the user must see a durable status instead of waiting blindly

## What “still is not fast and done” likely means
The request flow should be fast. The full dossier build does not have to be instant if it relies on external research, enrichment, AI, source collection, or retries.

The product promise should be:
- Fast acknowledgement
- Durable queueing
- Honest progress
- No lost requests
- Notification when ready

Not:
- Guaranteed instant full dossier for every employer

## Things not to change during this check
Do not change:
- Readiness logic
- Readiness tiers
- Evidence scoring
- Source requirements
- Employer identity resolution
- Dossier content
- Pricing, Stripe, paywalls, subscriptions
- Offer Check
- Scan limits
- Database schemas unless a specific PR1 correction is approved

## If it fails, the next fix should target one of these
1. Request is not being saved durably
2. Request is saved but not attached to a company job
3. Multiple jobs are being created for the same company
4. Job runner is not picking up queued jobs
5. Build outcome and notification delivery are still mixed together
6. Notifications are not retried or reconciled
7. UI waits for completion instead of showing saved/queued status

## Recommended next move
Run one production-shaped test from the public request flow, then inspect the backend rows for:
- Request row
- Company job row
- Request-to-job attachment
- Job state
- Notification state
- Retry/error fields

Only after that should we decide whether the issue is frontend speed, queue processing, job orchestration, or notification delivery.