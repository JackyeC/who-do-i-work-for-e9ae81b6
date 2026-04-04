

## Fix: LinkedIn Callback — Write Encrypted Token

**Problem**: The `linkedin-callback` edge function writes `access_token` (line 107), but that column has been removed. It should use `encrypt_linkedin_token()` RPC instead, which writes to `access_token_encrypted` using `pgp_sym_encrypt`.

**Change**: `supabase/functions/linkedin-callback/index.ts`

1. Remove `access_token` from the upsert payload (line 107)
2. After the upsert succeeds, call the `encrypt_linkedin_token` RPC to store the token securely:
   ```typescript
   await supabase.rpc("encrypt_linkedin_token", {
     p_user_id: userId,
     p_token: tokenData.access_token,
   });
   ```

This is a single-file, ~5-line change. The `encrypt_linkedin_token` DB function already exists and handles encryption via `pgp_sym_encrypt`.

