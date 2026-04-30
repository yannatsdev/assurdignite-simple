import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action } = body;

    if (action === "challenge") {
      // Return challenge + user info for navigator.credentials.create()
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge));
      return json({
        challenge: challengeB64,
        rp: { name: "AssurDignité", id: new URL(req.url).hostname.replace(/^[^.]+\./, "") || "localhost" },
        user: {
          id: user.id,
          name: user.email || user.id,
          displayName: user.user_metadata?.full_name || user.email || "Assuré",
        },
      });
    }

    if (action === "verify") {
      const { credentialId, publicKey, deviceName } = body;
      if (!credentialId || !publicKey) return json({ error: "Missing credential" }, 400);

      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { error } = await admin.from("user_passkeys").insert({
        user_id: user.id,
        credential_id: credentialId,
        public_key: publicKey,
        device_name: deviceName || "Appareil",
      });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
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
