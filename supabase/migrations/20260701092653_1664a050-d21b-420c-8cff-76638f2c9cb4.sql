
-- 1) Lock down SECURITY DEFINER functions from public/anon
REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
-- authenticated + service_role keep EXECUTE (used by admin edge fn and app checks)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_sinistre() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_sinistre_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_paiement_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_active_actuarial_config() FROM PUBLIC, anon, authenticated;

-- 2) Explicit restrictive UPDATE policy on paiements: only admins can update
DROP POLICY IF EXISTS "Only admins can update paiements" ON public.paiements;
CREATE POLICY "Only admins can update paiements"
ON public.paiements
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
