

## Plan: Make `/dossier/:id` a Public Route

**What's happening:** Line 178 in `App.tsx` wraps `/dossier/:id` in `<ProtectedRoute>`, causing the Clerk redirect for logged-out users.

**Change (1 file, 1 line):**

In `src/App.tsx`, line 178, remove the `ProtectedRoute` wrapper:

```
// Before
<Route path="/dossier/:id" element={<ProtectedRoute><CompanyDossier /></ProtectedRoute>} />

// After
<Route path="/dossier/:id" element={<CompanyDossier />} />
```

No other files are modified. The `DossierCoachingGuide` at `/dossier/guide/:slug` (line 179) is already public.

