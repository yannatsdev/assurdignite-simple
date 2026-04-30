import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY");
    const DIDIT_WORKFLOW_ID = Deno.env.get("DIDIT_WORKFLOW_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
      return new Response(
        JSON.stringify({ error: "Didit not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    let body: { vendor_data_suffix?: string; callback?: string } = {};
    try {
      body = await req.json();
    } catch (_) {
      // ignore
    }

    const vendorData = body.vendor_data_suffix
      ? `${user.id}:${body.vendor_data_suffix}`
      : user.id;

    const callback =
      body.callback ?? `${req.headers.get("origin") ?? ""}/client/adhesion?kyc=done`;

    // Create Didit session
    const diditRes = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key": DIDIT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        callback,
        vendor_data: vendorData,
      }),
    });

    const diditData = await diditRes.json();
    if (!diditRes.ok) {
      console.error("Didit error", diditRes.status, diditData);
      return new Response(
        JSON.stringify({ error: "Didit session creation failed", details: diditData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Persist pending status on profile (only for principal, not conjoint suffix)
    if (!body.vendor_data_suffix) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await admin
        .from("profiles")
        .update({
          kyc_session_id: diditData.session_id,
          kyc_status: "pending",
          kyc_provider: "didit",
        })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify({
        session_id: diditData.session_id,
        session_token: diditData.session_token,
        verification_url: diditData.url ?? diditData.verification_url,
        status: diditData.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("create-session exception", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
