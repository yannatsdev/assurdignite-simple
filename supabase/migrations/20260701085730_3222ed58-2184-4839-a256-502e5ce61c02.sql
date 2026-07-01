-- Replace the ALL policy on kyc_documents with scoped INSERT/UPDATE-limited policies
-- so end users cannot SELECT sensitive review columns via the policy surface.
DROP POLICY IF EXISTS "Users manage their own kyc docs" ON public.kyc_documents;

CREATE POLICY "Users insert own kyc docs"
  ON public.kyc_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own kyc docs (limited)"
  ON public.kyc_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Read access stays via existing column-limited grants + existing SELECT policy for safe cols
-- Tighten storage KYC upload policies to authenticated only
DROP POLICY IF EXISTS "Users upload own kyc files" ON storage.objects;
CREATE POLICY "Users upload own kyc files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users upload own sinistre docs" ON storage.objects;
CREATE POLICY "Users upload own sinistre docs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Revoke column-level SELECT on profiles sensitive fields from authenticated
REVOKE SELECT (kyc_payload, kyc_session_id, id_document_number) ON public.profiles FROM authenticated;