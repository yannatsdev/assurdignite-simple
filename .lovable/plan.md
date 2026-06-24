
## 1. Suppression Didit / Nirva → KYC basic interne

- Supprimer:
  - `src/components/kyc/DiditVerification.tsx`
  - `supabase/functions/didit-create-session/`, `didit-webhook/`
  - Imports/usages dans `src/pages/client/Adhesion.tsx` (étapes 2 et 3), composants Nirva (animation "système prêt Nirva", scan biométrique).
  - Secrets `DIDIT_*` ne sont plus utilisés (laisser inertes côté infra).
- Nouveau composant `src/components/kyc/BasicKyc.tsx` (assuré principal + conjoint) avec 4 sous-blocs simples:
  1. **Pièce d'identité (recto)** — input `accept="image/*"` (PAS de `capture` forcé sur mobile → ouvre galerie OU caméra au choix) + bouton "Prendre une photo" optionnel (`capture="environment"`).
  2. **Pièce d'identité (verso)** — idem.
  3. **Selfie** — input séparé avec `capture="user"` et fallback upload.
  4. **Justificatif de domicile** (optionnel).
- OCR: garder l'appel à l'edge function `ocr-id-card` existante mais:
  - Réécrire la capture caméra (`getUserMedia`) en utilisant un `<video>` rendu via `srcObject` après `await play()` (sinon écran noir).
  - Sur mobile, ne pas tenter `getUserMedia` par défaut → utiliser directement `<input type="file" accept="image/*" capture="environment">` qui laisse l'OS choisir caméra/galerie.
  - Pré-remplit nom, prénom, date de naissance, numéro CNI/passeport mais l'utilisateur peut éditer.
- Upload des fichiers vers le bucket Storage `kyc-documents` (créer si manquant via migration) avec chemin `userId/contractId/<type>.<ext>` et metadata `{type, side}`.
- Table `kyc_documents` (migration): `id, user_id, contract_id?, doc_type (cni_recto|cni_verso|selfie|domicile|passport), storage_path, status, ocr_payload jsonb, created_at`. RLS: user select/insert own; admins select all via `has_role`.
- Retirer colonnes/flags Didit dans `contracts` (ou les garder mais inutilisés) — par sécurité, remplacer la valeur par défaut `kyc_provider='basic'` via migration.

## 2. Fix "Souscrire" renvoie vers dashboard

- Cause probable: depuis `Souscrire.tsx` → bouton va `/client/adhesion`, mais le composant `SimulateurSection` réutilisé en bas dispatche un autre CTA qui redirige vers `/client` (welcome).
- Action: vérifier le CTA du `SimulateurSection` quand monté dans l'espace client → forcer `onSubscribe={() => navigate('/client/adhesion', { state: { simResult }})}`, et dans `Adhesion.tsx` consommer `location.state.simResult` pour pré-remplir l'étape 0 et sauter à l'étape 1.
- Vérifier qu'aucun `<Navigate to="/client">` ne se déclenche faute d'auth/condition.

## 3. Simplifier le parcours d'adhésion (14 → 7 étapes)

Nouveau flux:
1. **Simulation** (DOB + composition famille + capitaux + périodicité) → calcule prime immédiatement.
2. **Famille** (souscripteur, conjoint optionnel, enfants, ascendants, bénéficiaires en un seul écran avec sous-sections).
3. **KYC basic** (composant nouveau ci-dessus, principal + conjoint si applicable).
4. **Santé** (déclaration condensée: 4 questions clé + checkbox d'honneur, expandable pour le reste).
5. **Récapitulatif + CG/CP** (1 seule case d'acceptation regroupée).
6. **Paiement** (MoMo / Wave / Orange / carte) — corriger l'erreur `function_has_role` (cf. §6).
7. **Confirmation + téléchargement** (police PDF avec signature + stamp).

Persistance: brouillon auto-sauvegardé dans `localStorage` + table `adhesion_drafts` (déjà existante ou à créer) à chaque changement d'étape.

## 4. Recalibrage moteur actuariel sur la nouvelle note technique

Dans `src/lib/actuarial-engine.ts`:
- `FC = 0.0015` (0.15% du capital, et non 0.001).
- `FA = 0.18` (18% au lieu de 15%).
- Coefficients périodiques: `PSC = 0.51×PAC + 1500`, `PTC = 0.26×PAC + 1000`, `PMC = 0.09×PAC + 500`, `PAC' = PAC + 2500`.
- Bornes d'âge: principal/conjoint ≤ 64 à la souscription, âge + durée ≤ 65; enfants ≤ 21; ascendants ≤ 89 et + durée ≤ 90.
- Ristourne 30% sur prime principale uniquement, conditionnée S/P < 50% sur 3 années — recalculer `PB(t)`.
- Supporter jusqu'à 10 enfants et 4 ascendants (UI + calcul) avec capitaux individualisés (champs séparés) car le bulletin va jusqu'à enfant 10/ascendant 4.
- Ajouter sélecteur périodicité dans simulateur (annuelle/semestrielle/trimestrielle/mensuelle) — afficher la prime correspondante + total annuel équivalent.
- Mettre à jour le tableau comparatif et le PDF récapitulatif (frais d'acquisition 18%, gestion 0.15%).

## 5. Espace admin — Centre KYC documents

- Nouvelle page `src/pages/admin/KycDocuments.tsx` avec:
  - Liste paginée par utilisateur (avatar, nom, statut KYC, nb docs).
  - Drawer / dialog: prévisualisation des images (signed URL Supabase), payload OCR, boutons Approuver / Rejeter (motif).
  - Filtres: statut, type doc, date.
- Edge function `kyc-signed-url` qui renvoie une signed URL (5 min) pour chaque doc, après vérif rôle admin.
- Ajouter entrée menu admin "KYC & Documents".

## 6. Fix erreur "function_has_role" au paiement

- Erreur signalée: `payment denied for function_has role`. Vérifier la fonction Postgres `has_role(user_id, role)` (SECURITY DEFINER, search_path = public) et la RLS de la table `payments` / appels dans edge functions de paiement (probablement appellent `has_role` avec mauvaise signature ou sans `search_path`).
- Action: migration de correction — recréer `public.has_role(uuid, app_role)` SECURITY DEFINER STABLE SET search_path = public; GRANT EXECUTE TO authenticated, anon, service_role. Réviser les policies qui l'utilisent.

## 7. Landing page — corrections demandées

- **Carrousel "Pourquoi AssurDignité"**: dans `src/components/landing/PourquoiSection.tsx` (ou équivalent) — actuellement transform CSS s'arrête en fin de boucle créant un "trou". Corriger en dupliquant la liste 2× et utilisant `animation: marquee linear infinite` avec `translateX(-50%)`, sans pause à la fin (`animation-iteration-count: infinite`), `will-change: transform`.
- **Supprimer** la section/bloc `ConditionsSection` ("Informations légales · Conditions Générales") de la home (`src/pages/Index.tsx`), garder le lien dans le footer uniquement.

## 8. Améliorations espace client (UX & intelligence)

- Dashboard:
  - Widget "Prochaine échéance" avec countdown + bouton Payer maintenant.
  - Widget "Couverture famille" (donut Recharts: capital total, par membre).
  - "Recommandations IA" (edge function existante `ai-recommendation`) avec call-to-action contextuel (ex: ajouter un ascendant si manquant).
  - Notifications en-tête (sinistres, KYC à compléter, doc expiré).
- Sinistre: assistant guidé en 3 étapes (type, pièces, déclaration) avec upload drag-drop.
- Documents: regrouper par catégorie + recherche.
- Mobile-first: revue rapide des breakpoints du dashboard et de l'adhésion (cards en grille `sm:grid-cols-2`, padding réduit).

## 9. Innovations & recommandations à valider

(Inclus par défaut sauf veto, sans surcharger le scope ci-dessus):
- **Wallet de polices**: pass Apple/Google Wallet généré depuis la police.
- **Rappel WhatsApp** (edge function + Twilio) pour échéance.
- **Mode famille partagé**: inviter un proche par lien sécurisé à voir la couverture.
- **Score de complétude du dossier** (KYC, bénéficiaires, médical) avec gamification.
- **Chatbot sinistre** propulsé par Lovable AI Gateway (model: `google/gemini-2.5-flash`) capable de qualifier la déclaration et précharger les pièces requises.
- **Tableau prédictif admin**: forecasting échéances/sinistres (Recharts area chart + edge function calcul simple).

## 10. Étapes de mise en œuvre (ordre)

1. Migrations SQL (table `kyc_documents`, bucket, fix `has_role`).
2. Suppression Didit/Nirva (code + edges).
3. Composant `BasicKyc` + OCR robuste.
4. Refonte `Adhesion.tsx` (7 étapes) + transmission `simResult`.
5. Mise à jour `actuarial-engine.ts` + UI simulateur (périodicité, capitaux personnalisés).
6. Espace admin KYC.
7. Fix landing (marquee, suppression CG, etc.).
8. Améliorations dashboard client.
9. Test E2E manuel sur les 3 espaces (mobile + desktop).
