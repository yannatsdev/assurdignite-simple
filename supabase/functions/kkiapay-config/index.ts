import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const publicKey = Deno.env.get("KKIAPAY_PUBLIC_KEY") ?? "";
  const privateKey = Deno.env.get("KKIAPAY_PRIVATE_KEY") ?? "";
  const secretKey = Deno.env.get("KKIAPAY_SECRET") ?? "";
  const explicit = Deno.env.get("KKIAPAY_SANDBOX");
  const isTest = publicKey.startsWith("tpk_") || privateKey.startsWith("tpk_") || secretKey.startsWith("tsk_");
  const sandbox = explicit != null ? explicit.toLowerCase() === "true" : isTest;
  const configured = Boolean(publicKey && privateKey && secretKey);
  return new Response(JSON.stringify({ publicKey, sandbox, configured, message: configured ? "Configuration KkiaPay prête" : "Clés KkiaPay incomplètes" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
