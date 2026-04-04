
-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  police_number TEXT UNIQUE NOT NULL,
  formule TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  date_effet DATE NOT NULL,
  date_expiration DATE NOT NULL,
  prime_annuelle INTEGER NOT NULL,
  principal_name TEXT,
  principal_dob DATE,
  conjoint_name TEXT,
  conjoint_dob DATE,
  nb_enfants INTEGER DEFAULT 0,
  nb_ascendants INTEGER DEFAULT 0,
  capital_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contracts" ON public.contracts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage contracts" ON public.contracts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Beneficiaires table
CREATE TABLE public.beneficiaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  lien_parente TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.beneficiaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beneficiaires" ON public.beneficiaires FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own beneficiaires" ON public.beneficiaires FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own beneficiaires" ON public.beneficiaires FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own beneficiaires" ON public.beneficiaires FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all beneficiaires" ON public.beneficiaires FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage beneficiaires" ON public.beneficiaires FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Paiements table
CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  montant INTEGER NOT NULL,
  methode TEXT,
  status TEXT DEFAULT 'pending',
  reference TEXT,
  date_paiement TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paiements" ON public.paiements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own paiements" ON public.paiements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all paiements" ON public.paiements FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage paiements" ON public.paiements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sinistres table
CREATE TABLE public.sinistres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  nom_decede TEXT NOT NULL,
  date_deces DATE,
  lieu_deces TEXT,
  circonstances TEXT,
  status TEXT DEFAULT 'declared',
  beneficiaire_nom TEXT,
  methode_paiement TEXT,
  numero_paiement TEXT,
  documents_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sinistres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sinistres" ON public.sinistres FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sinistres" ON public.sinistres FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sinistres" ON public.sinistres FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sinistres" ON public.sinistres FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage sinistres" ON public.sinistres FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Assures complementaires table
CREATE TABLE public.assures_complementaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  dob DATE,
  lien_parente TEXT,
  prestation_nature TEXT,
  type_assure TEXT
);
ALTER TABLE public.assures_complementaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assures via contract" ON public.assures_complementaires FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own assures via contract" ON public.assures_complementaires FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins can manage assures" ON public.assures_complementaires FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sinistres_updated_at BEFORE UPDATE ON public.sinistres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sinistres;
ALTER PUBLICATION supabase_realtime ADD TABLE public.paiements;
