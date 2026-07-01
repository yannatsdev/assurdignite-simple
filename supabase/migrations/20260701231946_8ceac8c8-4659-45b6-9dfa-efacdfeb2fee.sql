
-- Prevent users from modifying sensitive columns on their own rows.
-- Uses BEFORE UPDATE triggers that block changes unless caller is admin/service_role.

CREATE OR REPLACE FUNCTION public.guard_contracts_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.signature_data_url IS DISTINCT FROM OLD.signature_data_url
     OR NEW.kyc_documents IS DISTINCT FROM OLD.kyc_documents THEN
    RAISE EXCEPTION 'Not allowed to modify signature_data_url or kyc_documents';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_contracts_sensitive_update ON public.contracts;
CREATE TRIGGER trg_guard_contracts_sensitive_update
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.guard_contracts_sensitive_update();

CREATE OR REPLACE FUNCTION public.guard_profiles_kyc_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.kyc_payload IS DISTINCT FROM OLD.kyc_payload
     OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.kyc_verified_at IS DISTINCT FROM OLD.kyc_verified_at
     OR NEW.kyc_session_id IS DISTINCT FROM OLD.kyc_session_id THEN
    RAISE EXCEPTION 'Not allowed to modify KYC fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profiles_kyc_update ON public.profiles;
CREATE TRIGGER trg_guard_profiles_kyc_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_kyc_update();

CREATE OR REPLACE FUNCTION public.guard_sinistres_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.methode_paiement IS DISTINCT FROM OLD.methode_paiement
     OR NEW.numero_paiement IS DISTINCT FROM OLD.numero_paiement
     OR NEW.beneficiaire_nom IS DISTINCT FROM OLD.beneficiaire_nom THEN
    RAISE EXCEPTION 'Not allowed to modify status or payment fields on sinistre';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_sinistres_sensitive_update ON public.sinistres;
CREATE TRIGGER trg_guard_sinistres_sensitive_update
  BEFORE UPDATE ON public.sinistres
  FOR EACH ROW EXECUTE FUNCTION public.guard_sinistres_sensitive_update();

REVOKE EXECUTE ON FUNCTION public.guard_contracts_sensitive_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profiles_kyc_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_sinistres_sensitive_update() FROM PUBLIC, anon, authenticated;
