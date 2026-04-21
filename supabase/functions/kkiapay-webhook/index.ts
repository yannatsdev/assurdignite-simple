import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kkiapay-signature",
};

/**
 * KkiaPay webhook receiver.
 * Body shape from KkiaPay (typical):
 * {
 *   transactionId: string,
 *   status: 'SUCCESS' | 'FAILED',
 *   amount: number,
 *   data?: string  // JSON-encoded { paiement_id, contract_id, user_id }
 * }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { transactionId, status, amount, data } = payload ?? {};

    if (!transactionId || !status) {
      return new Response(JSON.stringify({ error: "Payload invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let meta: { paiement_id?: string; contract_id?: string; user_id?: string } = {};
    if (typeof data === "string") {
      try { meta = JSON.parse(data); } catch { /* ignore */ }
    } else if (typeof data === "object" && data) {
      meta = data;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const newStatus = status === "SUCCESS" ? "paid" : "failed";

    if (meta.paiement_id) {
      await supabase.from("paiements").update({
        status: newStatus, reference: transactionId, date_paiement: new Date().toISOString(),
      }).eq("id", meta.paiement_id);
    } else if (meta.contract_id && meta.user_id) {
      await supabase.from("paiements").insert({
        contract_id: meta.contract_id, user_id: meta.user_id,
        montant: amount ?? 0, methode: "kkiapay", status: newStatus, reference: transactionId,
      });
    } else {
      console.warn("kkiapay-webhook: no meta to attach payment", payload);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("kkiapay-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});