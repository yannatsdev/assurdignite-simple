import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const publicKey = Deno.env.get("KKIAPAY_PUBLIC_KEY") ?? "";
  // Heuristic : sandbox keys start with a different pattern; default to live for production keys.
  // KkiaPay live public keys typically don't start with "sandbox" prefix.
  const sandbox = (Deno.env.get("KKIAPAY_SANDBOX") ?? "false").toLowerCase() === "true";
  return new Response(JSON.stringify({ publicKey, sandbox }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});