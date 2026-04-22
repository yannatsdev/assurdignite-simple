

# Plan — Refonte landing YAKO-style, fixes admin/profil/docs, paiement simulation

## 1. Fix signup admin (Edge Function non-2xx)

**`supabase/functions/admin-signup/index.ts`** : L'erreur vient probablement d'un crash silencieux du trigger `handle_new_user` (race condition) ou d'un `SUPABASE_SERVICE_ROLE_KEY` manquant. Refonte robuste :
- Try/catch granulaire avec logs explicites.
- Suppression du `setTimeout` (race) → utiliser `upsert` avec `onConflict: 'user_id,role'` directement.
- Vérifier que l'utilisateur n'existe pas déjà (`listUsers` filtré par email) avant `createUser`. Si existe → assigner juste le rôle admin.
- Retourner les détails d'erreur Supabase (code, message, hint).

**Création du compte** : Après le fix, j'appellerai la fonction directement via `curl_edge_functions` avec `adminyannsonam@gmail.com / Yannedge50$ / ADDWARRIORSONAMVIE777`.

## 2. Refonte landing page — style YAKO Africa Assurance

Inspiration screenshot YAKO : barre supérieure colorée avec contacts, navbar blanche permanente, hero plein écran avec image famille + overlay vert/violet, cartes catégories, section "Notre expertise" avec photo + bullets, section "Notre ADN" 3 piliers (Vision/Mission/Valeurs), témoignages carrousel, bandeau partenaires/logos, footer riche multi-colonnes.

**`src/components/landing/Header.tsx`** :
- Barre top fine violette (contact + email + adresse).
- Navbar **blanche permanente** (plus de transparent au scroll, comme image 6 uploaded).
- Logos SONAM + AssurDignité **agrandis** (h-14 desktop / h-10 mobile, fond blanc avec padding).
- Liens nav : Accueil, Nos Formules, Simulateur, Avantages, FAQ, Contact (taille `text-base font-semibold`).
- CTA "Mon Espace" + "Souscrire" boutons à droite.

**`src/components/landing/HeroSection.tsx`** :
- Titre H1 changé : **"Votre Assurance Obsèques SONAM VIE"** (au lieu de "Assurance Obsèques par SONAM VIE").
- Police agrandie (`text-4xl sm:text-5xl md:text-6xl lg:text-7xl`).
- Sous-titre `text-lg sm:text-xl`.
- Hero plein écran avec image famille + overlay gradient violet→vert.
- 2 CTA principaux + badges de confiance (CIMA, 25 ans, etc.) plus gros.

**Nouvelle section "Comment souscrire"** (remplace `processSteps` actuels dans `Index.tsx`) :
1. Choisir la formule
2. Faire la simulation et la validation
3. Scanner votre CNI, enregistrement biométrique
4. Conditions générales et validation
5. Payer
6. Recevoir la police d'assurance et le reçu

Style : 6 cards horizontales avec numéros violets, icônes différentes, ligne de connexion entre étapes.

**`src/components/landing/FormulesSection.tsx`** — restructure :
- Titre supérieur : **"Trouver nos prestations"** (remplace "Choisissez votre niveau de protection").
- Sous-titre : **"Tout est pris en charge par Sonam Vie"**.
- Section : **"Nos prestations en nature"**.
- Les 4 tableaux des formules (Essentiel, Confort, Serein, Excellence).
- En bas, nouvelle section : **"PRESTATIONS EN NATURE INCLUSES (70 %)"** avec 4 cards :
  - Enlèvement & transport du corps
  - Conservation & traitement
  - Cercueil & accessoires funéraires
  - Levée du corps & cérémonie

**`src/components/landing/SimulateurSection.tsx`** :
- Supprimer mention **"Moteur actuariel CIMA H intégré. Résultats instantanés et détaillés."** (landing + espace client).
- Augmenter polices.

**Nouveau CTA final avant Footer (`Index.tsx`)** :
Section large violet/dégradé avec H2 **"Parlons de votre protection"**, sous-titre rassurant, 2 boutons (Souscrire / Nous contacter), illustration.

**Polices globales** : Augmenter de +1 cran sur tous les sections landing (`text-sm` → `text-base`, `text-base` → `text-lg`, etc.) pour lisibilité optimale.

## 3. Fix login client — mention "100% digital"

**`src/pages/Login.tsx`** : Ajouter "100% digital" après "en toute simplicité".

## 4. Espace client — Profil complet (mot de passe + infos)

**`src/pages/client/Profil.tsx`** : Refonte avec 2 sections :
- **Mes informations** : nom, prénom, email (lecture), téléphone, adresse, date naissance, profession → `update profiles` + bouton "Enregistrer".
- **Sécurité** : champs nouveau mot de passe + confirmation → `supabase.auth.updateUser({ password })` + toast.

**`src/pages/client/Dashboard.tsx`** : Remplacer "Complétez votre profil pour profiter de tous les avantages." par **"Complétez votre profil pour profiter de tous les avantages d'Assurdignité."**

## 5. Espace client — Logos SONAM + AssurDignité fond blanc

**`src/components/client/ClientSidebar.tsx`** + **`src/layouts/ClientLayout.tsx`** :
- Bloc logos sur fond **blanc** avec padding et `rounded-xl shadow-sm border`, agrandis (h-12).
- Version mobile : logos centrés, taille adaptée (h-10).
- Same fix admin sidebar.

## 6. Étape 12 — Paiement simulation + logos opérateurs

**`src/pages/client/Adhesion.tsx`** Step 12 :
- Bloc actuel KkiaPay conservé.
- **Nouveau bloc** "Effectuer un paiement de simulation" avec 4 logos cliquables (MTN, Orange, Moov, Wave) en grid 2x2.
- Au clic d'un logo → modal de confirmation "Simuler paiement de XXX FCFA via {opérateur}" → bouton "Confirmer".
- À la confirmation → insert `paiements{ status:'paid', methode:'simulation_'+op, reference:'SIM-'+timestamp }` + toast succès + avance à étape 13.

**Copie des logos uploadés** dans `src/assets/payments/` : `mtn.svg`, `orange.svg`, `moov.svg`, `wave.svg`.

## 7. Documents — design pro et impression

**Tous les générateurs PDF (police, reçu, sinistre)** : refonte complète style screenshot 5 (sonam violet header, logos bien alignés).

**Header PDF unifié** :
- Bandeau violet `#4A0E78` plein largeur, hauteur 80px.
- Logo SONAM gauche (50px h) + AssurDignité (40px h) sur **fond blanc arrondi** dans le header.
- Coordonnées à droite (téléphone, email, adresse).

**Reçu de paiement** : doit contenir nom + prénom + n° police + formule choisie + options + liste bénéficiaires (nom/lien/%) + montant payé + date + référence + cachet.

**Police d'assurance** : couverture pro avec logos centrés, encadré violet "POLICE N° XXXX", sections numérotées (Souscripteur, Assurés, Bénéficiaires, Garanties, Conditions), signatures bas.

**`src/lib/pdf-logos.ts`** : Vérifier dimensions logos base64 (correction ratio).

**`src/pages/client/Documents.tsx`** : CSS `@media print` (cacher sidebar/nav, A4, marges, page-break), boutons "Télécharger PDF" + "Imprimer".

## 8. Responsivité globale

Audit rapide :
- Header : burger menu mobile fonctionnel, logos visibles.
- Sidebar client/admin : drawer mobile.
- Tableaux dashboards : `overflow-x-auto`.
- Cards grids : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Formulaires Adhésion : inputs `w-full` + spacing.
- Tester viewports 375 / 768 / 1280.

## 9. Fix erreurs / build

- TypeScript clean.
- Import des SVG via `?url` ou `import logoMtn from '@/assets/payments/mtn.svg'`.
- Build final OK.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `supabase/functions/admin-signup/index.ts` | Robustification + idempotence |
| `src/components/landing/Header.tsx` | Top bar + navbar blanche permanente + logos agrandis |
| `src/components/landing/HeroSection.tsx` | Titre changé, polices agrandies, hero plein écran |
| `src/pages/Index.tsx` | Nouveau parcours "Comment souscrire" 6 étapes + CTA final "Parlons de votre protection" |
| `src/components/landing/FormulesSection.tsx` | Restructure : "Trouver nos prestations" + section "Prestations en nature 70%" |
| `src/components/landing/SimulateurSection.tsx` | Retrait mention CIMA H, polices + |
| `src/pages/Login.tsx` | "100% digital" |
| `src/pages/client/Profil.tsx` | Update infos + changement mot de passe |
| `src/pages/client/Dashboard.tsx` | Texte "d'Assurdignité" |
| `src/components/client/ClientSidebar.tsx` | Logos fond blanc agrandis |
| `src/components/admin/AdminSidebar.tsx` | Logos fond blanc agrandis |
| `src/layouts/ClientLayout.tsx` + `AdminLayout.tsx` | Responsive logos mobile |
| `src/pages/client/Adhesion.tsx` Step 12 | Bloc paiement simulation 4 logos opérateurs |
| `src/assets/payments/*.svg` | Copie MTN/Orange/Moov/Wave |
| `src/lib/pdf-logos.ts` | Fix ratios logos |
| Tous générateurs PDF (Documents, Adhesion reçu, Sinistre) | Header unifié pro, contenu enrichi reçu |
| `src/pages/client/Documents.tsx` | CSS @media print + bouton imprimer |
| `src/index.css` | Print styles globaux |

## Ordre d'exécution

1. Fix `admin-signup` edge function + création compte admin yann
2. Copie logos paiements SVG dans assets
3. Refonte Header (top bar + navbar blanche + logos)
4. Refonte Hero + Index parcours 6 étapes + CTA final
5. Restructure FormulesSection + retrait mention CIMA Simulateur
6. Login "100% digital" + Dashboard texte
7. Profil : update infos + password
8. ClientSidebar + AdminSidebar logos blancs agrandis
9. Adhesion Step 12 paiement simulation
10. Refonte PDFs (header pro + reçu enrichi + print CSS)
11. Audit responsive + build final

