import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kkiapay-signature" };
const okStatuses = new Set(["SUCCESS", "SUCCESSFUL", "PAID", "COMPLETED", "paid", "success"]);
const failStatuses = new Set(["FAILED", "CANCELLED", "CANCELED", "ERROR", "failed", "cancelled"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const payload = await req.json();
    const transactionId = payload?.transactionId || payload?.transaction_id || payload?.reference;
    const rawStatus = payload?.status || payload?.state || payload?.event;
    const amount = Number(payload?.amount || payload?.montant || 0);
    if (!transactionId || !rawStatus) return new Response(JSON.stringify({ error: "Payload invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    let meta: { paiement_id?: string; contract_id?: string; user_id?: string } = {};
    const rawData = payload?.data || payload?.metadata || payload?.customData;
    if (typeof rawData === "string") { try { meta = JSON.parse(rawData); } catch { meta = {}; } } else if (rawData && typeof rawData === "object") meta = rawData;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const newStatus = okStatuses.has(String(rawStatus)) ? "paid" : failStatuses.has(String(rawStatus)) ? "failed" : "pending";
    if (meta.paiement_id) {
      const { error } = await supabase.from("paiements").update({ status: newStatus, reference: transactionId, date_paiement: new Date().toISOString(), methode: "kkiapay" }).eq("id", meta.paiement_id);
      if (error) throw error;
    } else if (meta.contract_id && meta.user_id) {
      const { error } = await supabase.from("paiements").insert({ contract_id: meta.contract_id, user_id: meta.user_id, montant: amount, methode: "kkiapay", status: newStatus, reference: transactionId });
      if (error) throw error;
    } else {
      console.warn("kkiapay-webhook: paiement non rattaché", payload);
    }
    return new Response(JSON.stringify({ ok: true, status: newStatus }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("kkiapay-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
