-- Lock down SECURITY DEFINER functions: revoke public EXECUTE, then grant only where required.
-- Trigger functions never need direct EXECUTE grants; they run as table owner.

-- Trigger / guard functions — no direct API caller should ever invoke these.
REVOKE ALL ON FUNCTION public.ensure_single_active_actuarial_config()          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_contracts_sensitive_update()               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profiles_kyc_update()                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_sinistres_sensitive_update()               FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user()                                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_paiement_status_change()                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_new_sinistre()                     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_sinistre_status()                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column()                       FROM PUBLIC, anon, authenticated;

-- has_role: called by RLS policies for signed-in users. Revoke from public/anon, keep authenticated.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- get_public_stats: intentionally public (landing page stats). Revoke PUBLIC then grant explicit roles.
REVOKE ALL ON FUNCTION public.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;
