

## Fix: Resume Parsing Fails on Career Map for PDFs

### Problem
The edge function `parse-career-document` fails when text extraction returns insufficient content (under 100 chars). It falls back to sending the raw file as base64, but uses an unsupported `type: "file"` format that the AI gateway rejects with `400: File data is missing`.

From the logs:
- DOCX files work (text extraction via JSZip succeeds)
- PDF files fail when `pdf-parse` doesn't work in Deno (package export error), leaving 0 chars, then the fallback raw-file path uses wrong API format

### Root Cause
Lines 237-246 in `parse-career-document/index.ts` send the file as `{ type: "file", file: { ... } }` which is not a valid OpenAI-compatible content part. The Lovable AI gateway expects `{ type: "image_url", image_url: { url: "data:mime;base64,..." } }` for inline binary data.

### Fix (1 file change)

**`supabase/functions/parse-career-document/index.ts`**

1. Change the `useDirectFile` content block to use the correct data-URI format via `image_url` type, which Gemini models support for PDFs and docs:
```typescript
userContent.push({
  type: "image_url",
  image_url: {
    url: `data:${getMimeType(filename)};base64,${fileBase64}`,
  },
});
```

2. Fix the message construction on line 265 -- when `useDirectFile` is true, the user content should be an array (multimodal), not just the first element:
```typescript
messages: [
  { role: "system", content: systemPrompt },
  { role: "user", content: useDirectFile ? userContent : documentText-based-string },
],
```
This part already works correctly for the array case, but the `image_url` format fix is what's needed.

This is a single-line fix in the edge function that will auto-deploy.

