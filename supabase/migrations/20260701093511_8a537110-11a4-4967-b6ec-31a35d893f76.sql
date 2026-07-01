
-- 1) kyc_documents: allow users to SELECT their own rows. Sensitive columns
-- (ocr_payload, reviewed_by, reviewed_at, reject_reason) remain hidden via
-- column-level GRANTS already in place — table-level SELECT is revoked,
-- only safe columns are granted to `authenticated`.
DROP POLICY IF EXISTS "Users read own kyc docs" ON public.kyc_documents;
CREATE POLICY "Users read own kyc docs"
  ON public.kyc_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2) paiements: add a RESTRICTIVE policy that hard-denies non-admin UPDATEs,
-- so any future permissive policy cannot accidentally open write access.
DROP POLICY IF EXISTS "Restrict paiements update to admins" ON public.paiements;
CREATE POLICY "Restrict paiements update to admins"
  ON public.paiements
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
