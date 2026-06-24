
-- 1. kyc_documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('cni_recto','cni_verso','passport','selfie','domicile','autre')),
  storage_path text NOT NULL,
  mime_type text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ocr_payload jsonb,
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own kyc docs"
  ON public.kyc_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all kyc docs"
  ON public.kyc_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update kyc docs"
  ON public.kyc_documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER kyc_documents_updated_at
  BEFORE UPDATE ON public.kyc_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_contract ON public.kyc_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);

-- 2. Storage policies on existing private bucket kyc-documents
DROP POLICY IF EXISTS "Users upload own kyc files" ON storage.objects;
CREATE POLICY "Users upload own kyc files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users read own kyc files" ON storage.objects;
CREATE POLICY "Users read own kyc files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins read all kyc files" ON storage.objects;
CREATE POLICY "Admins read all kyc files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Users delete own kyc files" ON storage.objects;
CREATE POLICY "Users delete own kyc files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Re-grant execute on has_role for all roles (fix payment "function_has role" denial)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;
