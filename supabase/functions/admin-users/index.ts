import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AppRole = "admin" | "client";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Authentification requise" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);
    const { data: authUser, error: authError } = await admin.auth.getUser(token);
    if (authError || !authUser.user) return json({ error: "Session invalide" }, 401);

    const { data: isAdmin, error: roleError } = await admin.rpc("has_role", { _user_id: authUser.user.id, _role: "admin" });
    if (roleError || !isAdmin) return json({ error: "Accès admin requis" }, 403);

    const body = req.method === "GET" ? { action: "list" } : await req.json().catch(() => ({}));
    const action = String(body.action || "list");

    if (action === "list") {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        admin.from("profiles").select("*").order("created_at", { ascending: false }),
        admin.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) return json({ error: pErr.message }, 500);
      if (rErr) return json({ error: rErr.message }, 500);
      const roleMap = new Map<string, AppRole[]>();
      (roles || []).forEach((r: any) => roleMap.set(r.user_id, [...(roleMap.get(r.user_id) || []), r.role]));
      const users = (profiles || []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) || [] }));
      return json({ users });
    }

    const userId = String(body.user_id || "");
    if (!userId) return json({ error: "Utilisateur requis" }, 400);
    if (userId === authUser.user.id && ["delete", "deactivate", "remove_role"].includes(action)) {
      return json({ error: "Vous ne pouvez pas bloquer votre propre compte admin" }, 400);
    }

    if (action === "deactivate") {
      const { error } = await admin.from("profiles").update({ status: "disabled", disabled_at: new Date().toISOString() }).eq("id", userId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "reactivate") {
      const { error } = await admin.from("profiles").update({ status: "active", disabled_at: null, deleted_at: null }).eq("id", userId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete") {
      await admin.from("profiles").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", userId);
      const { error } = await admin.auth.admin.deleteUser(userId, false);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "add_role") {
      const role = String(body.role || "client") as AppRole;
      if (!["admin", "client"].includes(role)) return json({ error: "Rôle invalide" }, 400);
      const { error } = await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "remove_role") {
      const role = String(body.role || "client") as AppRole;
      const { error } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    console.error("admin-users error", e);
    return json({ error: e instanceof Error ? e.message : "Erreur serveur" }, 500);
  }
});
