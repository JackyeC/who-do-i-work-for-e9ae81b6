import { supabase } from "@/integrations/supabase/client";

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { data, error } = await supabase.functions.invoke("verify-turnstile", {
      body: { token },
    });
    if (error) return false;
    return data?.success === true;
  } catch {
    return false;
  }
}
