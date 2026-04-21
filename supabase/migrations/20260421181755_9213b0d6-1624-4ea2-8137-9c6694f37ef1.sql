-- 1. Bootstrap admin user adminyannsonam@gmail.com
DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
  v_email text := 'adminyannsonam@gmail.com';
  v_password text := 'Yannedge50$';
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = v_email LIMIT 1;
  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data,
      raw_user_meta_data, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','Admin Yann SONAM'),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email', v_user_id::text, now(), now(), now());
  ELSE
    v_user_id := v_existing;
    UPDATE auth.users SET encrypted_password = crypt(v_password, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, v_email, 'Admin Yann SONAM')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
END $$;

-- 2. Trigger: paiement validé -> contract active
CREATE OR REPLACE FUNCTION public.on_paiement_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.contract_id IS NOT NULL THEN
    UPDATE public.contracts SET status = 'active', updated_at = now() WHERE id = NEW.contract_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paiement_status_change ON public.paiements;
CREATE TRIGGER trg_paiement_status_change
AFTER INSERT OR UPDATE OF status ON public.paiements
FOR EACH ROW EXECUTE FUNCTION public.on_paiement_status_change();

-- 3. RPC stats publiques pour landing
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'contracts_active', (SELECT COUNT(*) FROM public.contracts WHERE status = 'active'),
    'sinistres_paid', (SELECT COUNT(*) FROM public.sinistres WHERE status = 'paid'),
    'total_paid', COALESCE((SELECT SUM(montant) FROM public.paiements WHERE status = 'paid'), 0)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;