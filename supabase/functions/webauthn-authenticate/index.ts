import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, email, credentialId } = body;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "challenge") {
      if (!email) return json({ error: "Email requis" }, 400);
      // Find user by email
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (!profile) return json({ error: "Utilisateur introuvable" }, 404);

      const { data: passkeys } = await admin
        .from("user_passkeys")
        .select("credential_id")
        .eq("user_id", profile.id);
      if (!passkeys || passkeys.length === 0) {
        return json({ error: "Aucune empreinte enregistrée" }, 404);
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge));

      return json({
        challenge: challengeB64,
        allowCredentials: passkeys.map(p => ({ id: p.credential_id, type: "public-key" })),
        userId: profile.id,
      });
    }

    if (action === "verify") {
      if (!credentialId) return json({ error: "Missing credential", code: "MISSING_CREDENTIAL" }, 400);

      const { data: passkey } = await admin
        .from("user_passkeys")
        .select("user_id")
        .eq("credential_id", credentialId)
        .maybeSingle();
      if (!passkey) return json({ error: "Empreinte non reconnue sur ce compte", code: "UNKNOWN_DEVICE" }, 404);

      // Get user email
      const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(passkey.user_id);
      if (userErr || !user?.email) return json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);

      // Generate magic link to sign in user without password
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
      });
      if (linkErr || !link.properties) return json({ error: "Cannot create session" }, 500);

      // Update last_used_at
      await admin.from("user_passkeys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("credential_id", credentialId);

      // Extract token from action_link to verify on client side
      const url = new URL(link.properties.action_link);
      return json({
        email: user.email,
        token_hash: url.searchParams.get("token") || link.properties.hashed_token,
        type: "magiclink",
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
