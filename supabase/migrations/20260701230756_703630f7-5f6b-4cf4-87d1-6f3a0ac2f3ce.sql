REVOKE SELECT ON public.kyc_documents FROM authenticated;
GRANT SELECT (id, user_id, contract_id, doc_type, storage_path, mime_type, status, created_at, updated_at) ON public.kyc_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;