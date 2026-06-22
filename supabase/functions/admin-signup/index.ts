import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_ACCESS_CODE = "SONAM2026";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password, fullName, accessCode } = await req.json();
    console.log("[admin-signup] request for", email);

    if (!email || !password || !fullName || !accessCode) {
      return new Response(JSON.stringify({ error: "Tous les champs sont requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (accessCode !== ADMIN_ACCESS_CODE) {
      return new Response(JSON.stringify({ error: "Code d'accès invalide" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      console.error("[admin-signup] missing env vars", { hasUrl: !!url, hasKey: !!serviceKey });
      return new Response(JSON.stringify({ error: "Configuration serveur manquante" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    // Check if user already exists
    let userId: string | null = null;
    try {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        userId = existing.id;
        console.log("[admin-signup] user already exists, will assign admin role:", userId);
      }
    } catch (e) {
      console.error("[admin-signup] listUsers error:", e);
    }

    if (!userId) {
      const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (signUpError) {
        console.error("[admin-signup] createUser error:", signUpError);
        return new Response(JSON.stringify({ error: signUpError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = userData.user.id;
    }

    // Ensure profile exists (in case trigger failed)
    await supabaseAdmin.from("profiles").upsert(
      { id: userId, email, full_name: fullName },
      { onConflict: "id" }
    );

    // Remove any existing roles, assign admin
    const { error: delErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    if (delErr) console.error("[admin-signup] delete roles error:", delErr);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleErr) {
      console.error("[admin-signup] insert admin role error:", roleErr);
      return new Response(JSON.stringify({ error: `Rôle non assigné: ${roleErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Compte admin créé avec succès" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-signup] uncaught error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
