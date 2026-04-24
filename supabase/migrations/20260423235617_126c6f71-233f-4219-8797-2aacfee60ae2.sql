ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS disabled_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE TABLE IF NOT EXISTS public.chatbot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'Général',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage chatbot faqs" ON public.chatbot_faqs;
DROP POLICY IF EXISTS "Anyone can view active chatbot faqs" ON public.chatbot_faqs;

CREATE POLICY "Admins can manage chatbot faqs"
ON public.chatbot_faqs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active chatbot faqs"
ON public.chatbot_faqs
FOR SELECT
USING (is_active = true);

CREATE TRIGGER update_chatbot_faqs_updated_at
BEFORE UPDATE ON public.chatbot_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.actuarial_config_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name text NOT NULL,
  source_file_name text,
  config_json jsonb NOT NULL,
  validation_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.actuarial_config_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage actuarial config versions" ON public.actuarial_config_versions;
DROP POLICY IF EXISTS "Authenticated users can view active actuarial config" ON public.actuarial_config_versions;

CREATE POLICY "Admins can manage actuarial config versions"
ON public.actuarial_config_versions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active actuarial config"
ON public.actuarial_config_versions
FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.ensure_single_active_actuarial_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.actuarial_config_versions
    SET is_active = false
    WHERE id <> NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_single_active_actuarial_config_trigger ON public.actuarial_config_versions;
CREATE TRIGGER ensure_single_active_actuarial_config_trigger
BEFORE INSERT OR UPDATE OF is_active ON public.actuarial_config_versions
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_actuarial_config();

DROP TRIGGER IF EXISTS paiement_status_change_trigger ON public.paiements;
CREATE TRIGGER paiement_status_change_trigger
AFTER UPDATE OF status ON public.paiements
FOR EACH ROW
EXECUTE FUNCTION public.on_paiement_status_change();

ALTER TABLE public.contracts REPLICA IDENTITY FULL;
ALTER TABLE public.paiements REPLICA IDENTITY FULL;
ALTER TABLE public.sinistres REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.chatbot_faqs REPLICA IDENTITY FULL;
ALTER TABLE public.actuarial_config_versions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.paiements; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sinistres; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_faqs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.actuarial_config_versions; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;