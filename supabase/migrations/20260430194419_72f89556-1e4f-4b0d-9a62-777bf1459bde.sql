-- Unique index passkeys
CREATE UNIQUE INDEX IF NOT EXISTS user_passkeys_credential_uniq
  ON public.user_passkeys (credential_id);

-- Biometric confirmation on payments
ALTER TABLE public.paiements
  ADD COLUMN IF NOT EXISTS biometric_confirmed_at timestamptz;

-- Trigger: notify admins on sinistre status update
CREATE OR REPLACE FUNCTION public.notify_admins_sinistre_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link, contract_id)
    SELECT ur.user_id,
           'Sinistre mis à jour',
           'Réf ' || NEW.reference || ' → ' || NEW.status,
           'sinistre',
           '/admin/sinistres',
           NEW.contract_id
    FROM public.user_roles ur
    WHERE ur.role = 'admin'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sinistre_status ON public.sinistres;
CREATE TRIGGER trg_sinistre_status
AFTER UPDATE ON public.sinistres
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_sinistre_status();

-- Attach insert trigger if missing
DROP TRIGGER IF EXISTS trg_sinistre_insert ON public.sinistres;
CREATE TRIGGER trg_sinistre_insert
AFTER INSERT ON public.sinistres
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_sinistre();