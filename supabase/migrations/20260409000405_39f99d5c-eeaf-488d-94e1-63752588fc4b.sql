
-- Create KYC documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- RLS: users upload to their own folder
CREATE POLICY "Users upload own KYC docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users view own docs
CREATE POLICY "Users view own KYC docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: admins view all
CREATE POLICY "Admins view all KYC docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- Add kyc_documents JSONB column to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS kyc_documents jsonb DEFAULT '{}';
