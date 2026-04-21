import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const publicKey = Deno.env.get("KKIAPAY_PUBLIC_KEY") ?? "";
  const privateKey = Deno.env.get("KKIAPAY_PRIVATE_KEY") ?? "";
  const secretKey = Deno.env.get("KKIAPAY_SECRET") ?? "";
  // KkiaPay test keys are prefixed with `tpk_` (private) and `tsk_` (secret).
  // Live keys use `pk_` / `sk_`. We auto-detect sandbox to match the public key environment.
  const explicit = Deno.env.get("KKIAPAY_SANDBOX");
  const isTest = privateKey.startsWith("tpk_") || secretKey.startsWith("tsk_");
  const sandbox = explicit != null
    ? explicit.toLowerCase() === "true"
    : isTest;
  return new Response(JSON.stringify({ publicKey, sandbox }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});