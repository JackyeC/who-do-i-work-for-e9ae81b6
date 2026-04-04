import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { exchangeCodeForToken, getLinkedInProfile } from "../_shared/linkedin.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LINKEDIN-CALLBACK] ${step}${detailsStr}`);
};

Deno.serve(async (req: Request) => {
  try {
    logStep("Function started");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://wdiwf.jackyeclayton.com";

    if (error) {
      logStep("LinkedIn returned error", { error, errorDescription });
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl}?linkedin_error=${encodeURIComponent(errorDescription || error)}` },
      });
    }

    if (!code || !stateParam) {
      logStep("Missing code or state");
      return new Response(null, {
        status: 302,
        headers: { Location: `${baseUrl}?linkedin_error=missing_code` },
      });
    }

    // Parse state to get return_to
    let returnTo = "/";
    try {
      const stateData = JSON.parse(atob(stateParam));
      returnTo = stateData.return_to || "/";
    } catch {
      logStep("Failed to parse state, using default return_to");
    }

    const clientId = Deno.env.get("LINKEDIN_CLIENT_ID")!;
    const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const redirectUri = `${supabaseUrl}/functions/v1/linkedin-callback`;

    // Exchange code for token
    logStep("Exchanging code for token");
    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri);
    logStep("Token received", { expires_in: tokenData.expires_in });

    // Get LinkedIn profile
    logStep("Fetching LinkedIn profile");
    const profile = await getLinkedInProfile(tokenData.access_token);
    logStep("Profile fetched", { sub: profile.sub, name: profile.name });

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Look up user by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const matchedUser = existingUsers?.users?.find(u => u.email === profile.email);

    let userId: string;

    if (matchedUser) {
      logStep("Matched existing user", { userId: matchedUser.id });
      userId = matchedUser.id;
    } else {
      // Create a new user with LinkedIn info
      logStep("Creating new user for LinkedIn profile");
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: profile.email,
        email_confirm: true,
        user_metadata: {
          full_name: profile.name,
          avatar_url: profile.picture,
          provider: "linkedin",
          linkedin_id: profile.sub,
        },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      logStep("New user created", { userId });
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Upsert LinkedIn profile
    logStep("Upserting LinkedIn profile record");
    const { error: upsertError } = await supabase
      .from("linkedin_profiles")
      .upsert({
        user_id: userId,
        linkedin_id: profile.sub,
        name: profile.name,
        email: profile.email,
        profile_picture_url: profile.picture,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;
    logStep("LinkedIn profile upserted");

    // Store token encrypted via RPC
    const { error: encryptError } = await supabase.rpc("encrypt_linkedin_token", {
      p_user_id: userId,
      p_token: tokenData.access_token,
    });
    if (encryptError) {
      console.error("Failed to encrypt token:", encryptError.message);
    } else {
      logStep("Token encrypted via RPC");
    }

    // Generate a magic link so the user is logged into Supabase
    logStep("Generating magic link for session");
    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
      options: {
        redirectTo: `${baseUrl}${returnTo}`,
      },
    });

    if (linkError) throw linkError;

    // Redirect through Supabase's auth confirm endpoint to establish the session
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${magicLink.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(baseUrl + returnTo + "?linkedin_connected=true")}`;

    logStep("Redirecting to confirm URL");
    return new Response(null, {
      status: 302,
      headers: { Location: confirmUrl },
    });
  } catch (err) {
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://wdiwf.jackyeclayton.com";
    logStep("Error", { message: err.message });
    console.error("LinkedIn callback error:", err);
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}?linkedin_error=${encodeURIComponent(err.message)}` },
    });
  }
});
