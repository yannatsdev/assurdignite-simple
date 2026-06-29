import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pattern: NEVER return non-2xx for expected/recoverable failures.
// Always 200 + { ok: false, fallback: true, code, message } so the client
// can show a clear fallback message instead of "Edge function returned non-2xx".
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { action, email, credentialId } = body || {};

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "challenge") {
      if (!email) return ok({ ok: false, fallback: true, code: "EMAIL_REQUIRED", message: "Email requis" });

      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", String(email).toLowerCase())
        .maybeSingle();
      if (!profile) {
        return ok({ ok: false, fallback: true, code: "USER_NOT_FOUND", message: "Aucun compte associé à cet email" });
      }

      const { data: passkeys } = await admin
        .from("user_passkeys")
        .select("credential_id")
        .eq("user_id", profile.id);
      if (!passkeys || passkeys.length === 0) {
        return ok({ ok: false, fallback: true, code: "NO_PASSKEY", message: "Aucune empreinte enregistrée pour ce compte" });
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeB64 = btoa(String.fromCharCode(...challenge));

      return ok({
        ok: true,
        challenge: challengeB64,
        allowCredentials: passkeys.map((p) => ({ id: p.credential_id, type: "public-key" })),
        userId: profile.id,
      });
    }

    if (action === "verify") {
      if (!credentialId) {
        return ok({ ok: false, fallback: true, code: "MISSING_CREDENTIAL", message: "Empreinte manquante" });
      }

      const { data: passkey } = await admin
        .from("user_passkeys")
        .select("user_id")
        .eq("credential_id", credentialId)
        .maybeSingle();
      if (!passkey) {
        return ok({ ok: false, fallback: true, code: "UNKNOWN_DEVICE", message: "Empreinte non reconnue sur ce compte" });
      }

      const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(passkey.user_id);
      if (userErr || !user?.email) {
        return ok({ ok: false, fallback: true, code: "USER_NOT_FOUND", message: "Utilisateur introuvable" });
      }

      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
      });
      if (linkErr || !link?.properties) {
        return ok({ ok: false, fallback: true, code: "SESSION_FAILED", message: "Session impossible — utilisez votre mot de passe" });
      }

      await admin.from("user_passkeys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("credential_id", credentialId);

      const url = new URL(link.properties.action_link);
      return ok({
        ok: true,
        email: user.email,
        token_hash: url.searchParams.get("token") || link.properties.hashed_token,
        type: "magiclink",
      });
    }

    return ok({ ok: false, fallback: true, code: "UNKNOWN_ACTION", message: "Action inconnue" });
  } catch (e) {
    // True server failure — still return 200 with fallback so client never crashes
    console.error("webauthn-authenticate error", e);
    return ok({ ok: false, fallback: true, code: "SERVER_ERROR", message: String(e?.message ?? e) });
  }
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
