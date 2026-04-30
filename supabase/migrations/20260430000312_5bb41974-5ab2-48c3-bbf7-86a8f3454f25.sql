ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_session_id text,
  ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS kyc_provider text DEFAULT 'didit',
  ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_payload jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_kyc_session_id ON public.profiles(kyc_session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);