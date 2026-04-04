

# Plan — Amélioration complète AssurDignité

## Résumé
Refonte et connexion backend complète : fixes UI, authentification réelle, base de données, formulaire d'adhésion 14 étapes, graphiques admin, design amélioré des login pages et du simulateur.

---

## Phase 1 — Fixes UI & Assets (Landing Page)

### 1.1 Footer logos
- Retirer `brightness-0 invert` des logos dans `Footer.tsx` — les logos sont sur fond violet gradient, pas besoin de ces filtres qui les rendent invisibles
- Ajouter une hauteur suffisante et un `object-contain`

### 1.2 Bouton "Nous contacter" dans Hero
- Le bouton outline blanc sur fond sombre est peu visible. Changer le style : fond semi-transparent blanc `bg-white/20 border-white text-white hover:bg-white/30` au lieu de `border-white/30`

### 1.3 Logos opérateurs Mobile Money
- Copier les SVG uploadés (Wave, Orange, Moov, MTN) dans `src/assets/`
- Les utiliser dans les pages Paiements (`Paiements.tsx`, `Sinistre.tsx`) et le formulaire d'adhésion

### 1.4 Image Avantages Section
- Générer une nouvelle image via Lovable AI (famille africaine multigénérationnelle avec personnes âgées, look premium) ou utiliser un SVG placeholder artistique plus adapté
- Remplacer `family-happy.jpg` dans `AvantagesSection.tsx`

### 1.5 Responsiveness globale
- Audit et fix des grilles : `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` sur mobile
- Simulateur : passer en single-column sur mobile (`grid-cols-1 lg:grid-cols-2`)
- Tables dans Contrats/Paiements : wrapper `overflow-x-auto`
- Sidebar : vérifier le comportement collapse sur mobile
- Header mobile menu : améliorer padding et spacing
- Chatbot : réduire width sur mobile (`w-[calc(100vw-2rem)] sm:w-[380px]`)

---

## Phase 2 — Authentification Lovable Cloud

### 2.1 Tables de base
Migration SQL pour créer :

```sql
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function for role checking
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger to auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

RLS policies for profiles and user_roles tables.

### 2.2 Auth context
- Create `src/contexts/AuthContext.tsx` with `useAuth` hook
- Use `supabase.auth.onAuthStateChange` + `getSession`
- Check role via `has_role()` function
- Wrap app in `AuthProvider`

### 2.3 Login pages
- `Login.tsx` : connect to `supabase.auth.signInWithPassword`, add signup form, handle errors with toast
- `AdminLogin.tsx` : same auth, but after login check `has_role(uid, 'admin')`, redirect to `/admin` or show error
- Add protected route wrapper `ProtectedRoute` component checking auth state
- Wrap `/client/*` routes with client protection
- Wrap `/admin/*` routes with admin protection

### 2.4 Login page design (Yako Africa style)
- Split-screen layout: left side = generated image (African woman with phone for client, African business team for admin), right side = login form
- Use AI image generation for both images
- Full-height layout, image covers left 50% on desktop, hidden on mobile

---

## Phase 3 — Base de données (Contrats, Paiements, Sinistres, Bénéficiaires)

### 3.1 Tables
```sql
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  police_number TEXT UNIQUE NOT NULL,
  formule TEXT NOT NULL CHECK (formule IN ('A','B','C','D')),
  status TEXT DEFAULT 'active',
  date_effet DATE NOT NULL,
  date_expiration DATE NOT NULL,
  prime_annuelle INTEGER NOT NULL,
  principal_name TEXT, principal_dob DATE,
  conjoint_name TEXT, conjoint_dob DATE,
  nb_enfants INTEGER DEFAULT 0, nb_ascendants INTEGER DEFAULT 0,
  capital_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.beneficiaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL, lien_parente TEXT, telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  montant INTEGER NOT NULL,
  methode TEXT, -- 'wave', 'orange', 'mtn', 'moov', 'virement'
  status TEXT DEFAULT 'pending',
  reference TEXT,
  date_paiement TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sinistres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  nom_decede TEXT NOT NULL, date_deces DATE,
  lieu_deces TEXT, circonstances TEXT,
  status TEXT DEFAULT 'declared',
  beneficiaire_nom TEXT, methode_paiement TEXT, numero_paiement TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.assures_complementaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  nom TEXT NOT NULL, dob DATE, lien_parente TEXT,
  prestation_nature TEXT, role TEXT -- 'enfant', 'ascendant'
);
```

RLS: users see only their own data, admins see all via `has_role()`.

### 3.2 Connect to client pages
- `Dashboard.tsx` : fetch user's contracts, display real data
- `Contrats.tsx` : list from `contracts` table
- `Paiements.tsx` : list from `paiements` table
- `Beneficiaires.tsx` : CRUD on `beneficiaires` table
- `Sinistre.tsx` : insert into `sinistres` table on submission

### 3.3 Connect admin pages
- `admin/Dashboard.tsx` : aggregate queries (count contracts, sum primes, count sinistres)
- Admin contract management, sinistre workflow pages with real data

---

## Phase 4 — Formulaire d'adhésion 14 étapes

Create `src/pages/client/Adhesion.tsx` with a multi-step wizard:

1. **Simulation** — embedded SimulateurSection component
2. **Choix formule** — 4 cards based on simulation results
3. **KYC principal** — nom, prénom, DOB, email, phone, adresse, pièce d'identité
4. **Conjoint/épouse** — même infos (optionnel)
5. **Assurés complémentaires** — nom, DOB, lien de parenté + 1 prestation en nature (dropdown)
6. **Bénéficiaires** — nom de l'aîné, lien, option choisie (pas de pourcentage)
7. **Prestations en nature** — liste déroulante (cercueil extérieur, conservation, transport, inhumation…)
8. **Ayants-droits non assurés** — enfants nés/à naître, autres noms/numéros
9. **Questionnaire médical** — questions santé + mention légale obligatoire (checkbox)
10. **Appartenance groupe** — association, groupe fictif (optionnel)
11. **Conditions générales** — texte scrollable complet, validation obligatoire en bas
12. **Paiement** — Mobile Money (Wave/Orange/Moov/MTN avec logos SVG) + virement (joindre RIB) + bouton payer
13. **Conditions particulières** — affichées après paiement
14. **Signature + Reçu PDF** — OTP signature, génération PDF brandé SONAM VIE (jspdf)

Add route `/client/adhesion` in App.tsx.

---

## Phase 5 — Graphiques Admin (Recharts)

In `admin/Dashboard.tsx`, replace placeholders with:
- **Évolution portefeuille** : `<AreaChart>` — polices actives par mois (mock data initially, real data from contracts table)
- **Répartition par formule** : `<PieChart>` — A/B/C/D distribution
- **Sinistralité par âge** : `<BarChart>` — tranches d'âge
- **Performance par canal** : `<BarChart>` — Mobile Money vs virement vs cash

Use SONAM brand colors for chart palettes.

---

## Phase 6 — Simulateur design amélioré

Enhance `SimulateurSection.tsx`:
- Add animated progress ring showing coverage level
- Add a `<PieChart>` showing 70% nature / 30% espèces split
- Add a `<BarChart>` showing per-person premium breakdown
- Better card design with gradient borders and shadow effects
- Animated counter for the premium amount
- Option cards with visual icons instead of plain select dropdown
- Mobile-optimized single column layout

---

## Phase 7 — Design global amélioré

- Add subtle gradient backgrounds to sections
- Improve card hover effects with `transition-all duration-300 hover:shadow-xl hover:-translate-y-1`
- Better spacing and typography hierarchy
- Animated counters in hero stats
- Smooth scroll behavior
- Loading states with skeleton components

---

## Fichiers impactés (principaux)

| Fichier | Action |
|---------|--------|
| `src/components/landing/Footer.tsx` | Fix logos |
| `src/components/landing/HeroSection.tsx` | Fix button visibility |
| `src/components/landing/AvantagesSection.tsx` | New image |
| `src/components/landing/SimulateurSection.tsx` | Redesign + charts |
| `src/pages/Login.tsx` | Split-screen + Supabase auth |
| `src/pages/AdminLogin.tsx` | Split-screen + Supabase auth + role check |
| `src/contexts/AuthContext.tsx` | New — auth provider |
| `src/components/ProtectedRoute.tsx` | New — route protection |
| `src/pages/client/Adhesion.tsx` | New — 14-step form |
| `src/pages/client/*.tsx` | Connect to real DB |
| `src/pages/admin/Dashboard.tsx` | Recharts graphs |
| `src/App.tsx` | Add routes, auth wrapper |
| `src/assets/` | Add Mobile Money SVGs, new images |
| Migration SQL | profiles, roles, contracts, paiements, sinistres, beneficiaires |

---

## Ordre d'exécution

1. Migration DB (tables + RLS + triggers)
2. Auth context + protected routes
3. Login pages redesign + real auth
4. UI fixes (footer, hero button, responsiveness)
5. Mobile Money logos + Avantages image
6. Client pages connected to real data
7. Admin dashboard with Recharts
8. Simulateur redesign with charts
9. Formulaire d'adhésion 14 étapes

