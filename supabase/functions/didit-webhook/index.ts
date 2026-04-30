import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp",
};

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  // Try signing the raw body alone first
  const candidates: string[] = [rawBody];
  if (timestampHeader) candidates.push(`${timestampHeader}.${rawBody}`);
  for (const candidate of candidates) {
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(candidate));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (hex === signatureHeader.toLowerCase()) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const DIDIT_WEBHOOK_SECRET = Deno.env.get("DIDIT_WEBHOOK_SECRET");

    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const timestamp = req.headers.get("x-timestamp");

    if (DIDIT_WEBHOOK_SECRET && DIDIT_WEBHOOK_SECRET.trim() !== "" && signature) {
      const ok = await verifySignature(rawBody, signature, timestamp, DIDIT_WEBHOOK_SECRET);
      if (!ok) {
        console.warn("Invalid Didit webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log("Webhook: skipping signature verification (no secret or no signature header)");
    }

    const payload = JSON.parse(rawBody);
    const sessionId: string | undefined = payload.session_id ?? payload.sessionId;
    const status: string | undefined = payload.status ?? payload.decision?.status;
    const vendorData: string | undefined = payload.vendor_data ?? payload.vendorData;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = vendorData?.split(":")[0];
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const normalizedStatus = (status ?? "pending").toLowerCase().replace(/\s+/g, "_");
    const update: Record<string, unknown> = {
      kyc_session_id: sessionId,
      kyc_status: normalizedStatus,
      kyc_payload: payload,
    };
    if (normalizedStatus === "approved") {
      update.kyc_verified_at = new Date().toISOString();
    }

    if (userId) {
      const { error } = await admin.from("profiles").update(update).eq("id", userId);
      if (error) console.error("profile update error", error);
    } else {
      // fallback: update by session id
      const { error } = await admin
        .from("profiles")
        .update(update)
        .eq("kyc_session_id", sessionId);
      if (error) console.error("profile update by session error", error);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook exception", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
