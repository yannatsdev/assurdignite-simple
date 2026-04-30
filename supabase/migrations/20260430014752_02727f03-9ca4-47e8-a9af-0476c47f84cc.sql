
-- 1. Table user_passkeys
CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own passkeys" ON public.user_passkeys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own passkeys" ON public.user_passkeys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own passkeys" ON public.user_passkeys
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users update own passkeys" ON public.user_passkeys
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all passkeys" ON public.user_passkeys
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_user_passkeys_user ON public.user_passkeys(user_id);
CREATE INDEX idx_user_passkeys_cred ON public.user_passkeys(credential_id);

-- 2. Trigger : notifier admins quand nouveau sinistre
CREATE OR REPLACE FUNCTION public.notify_admins_new_sinistre()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link, contract_id)
  SELECT ur.user_id,
         'Nouveau sinistre déclaré',
         'Référence : ' || NEW.reference || ' — ' || COALESCE(NEW.nom_decede, ''),
         'sinistre',
         '/admin/sinistres',
         NEW.contract_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_new_sinistre ON public.sinistres;
CREATE TRIGGER trg_notify_admins_new_sinistre
  AFTER INSERT ON public.sinistres
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_sinistre();

-- Permettre l'insertion de notifications par le trigger (security definer bypass RLS, ok)
-- Mais ajout d'une policy admins peuvent insérer des notifications pour user
CREATE POLICY "Admins insert notifications anywhere" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Realtime
ALTER TABLE public.sinistres REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.paiements REPLICA IDENTITY FULL;
ALTER TABLE public.contracts REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sinistres;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.paiements;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Storage policies pour kyc-documents (pour pièces sinistre)
-- Path utilisé : sinistres/{user_id}/{sinistre_id}/{filename}
DO $$ BEGIN
  CREATE POLICY "Users upload own sinistre docs" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'kyc-documents'
      AND (storage.foldername(name))[1] = 'sinistres'
      AND auth.uid()::text = (storage.foldername(name))[2]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own sinistre docs" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'kyc-documents'
      AND (storage.foldername(name))[1] = 'sinistres'
      AND auth.uid()::text = (storage.foldername(name))[2]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view all kyc-documents" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'admin'::app_role)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Nettoyage données de test
DELETE FROM public.notifications;
DELETE FROM public.paiements;
DELETE FROM public.assures_complementaires;
DELETE FROM public.beneficiaires;
DELETE FROM public.sinistres;
DELETE FROM public.contracts;
