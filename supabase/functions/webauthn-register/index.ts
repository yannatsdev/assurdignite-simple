import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return ok({ ok: false, fallback: true, code: "UNAUTHORIZED", message: "Connexion requise" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ok({ ok: false, fallback: true, code: "UNAUTHORIZED", message: "Session expirée" });

    const body = await req.json().catch(() => ({}));
    const { action } = body || {};

    if (action === "challenge") {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge));
      return ok({
        ok: true,
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
      if (!credentialId || !publicKey) {
        return ok({ ok: false, fallback: true, code: "MISSING_CREDENTIAL", message: "Empreinte invalide" });
      }

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
      if (error) return ok({ ok: false, fallback: true, code: "DB_ERROR", message: error.message });
      return ok({ ok: true, success: true });
    }

    return ok({ ok: false, fallback: true, code: "UNKNOWN_ACTION", message: "Action inconnue" });
  } catch (e) {
    console.error("webauthn-register error", e);
    return ok({ ok: false, fallback: true, code: "SERVER_ERROR", message: String(e?.message ?? e) });
  }
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
