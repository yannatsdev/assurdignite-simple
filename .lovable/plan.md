# Plan — Robustesse, observabilité & parcours rural-friendly

## 1. Tests end-to-end Playwright (anti-régression)

Nouveau fichier `tests/e2e/parcours-complet.spec.ts` qui couvre toute la chaîne en mode authentifié + mocké :

- **Setup** : helper `tests/e2e/_helpers/auth.ts` qui injecte une session Supabase via `localStorage` (token de test depuis `.env.test`) puis pose des `page.route(...)` pour intercepter :
  - `functions/v1/kyc-ocr-extract` → renvoie un payload OCR factice (nom, prénom, n° CNI, date).
  - Upload Storage `kyc-documents` → 200 OK.
  - `paiements` insert → status `paid`.
- **Scénario** `parcours complet` :
  1. Simulation (formule B, âge 45) → assert prime calculée.
  2. Scan OCR : upload d'une image fixture `tests/e2e/fixtures/cni.jpg` → assert champs pré-remplis.
  3. Upload KYC verso + selfie → assert badges « Enregistré ».
  4. Bénéficiaires (1 par défaut, 100%).
  5. Cocher conditions + signature canvas (`page.mouse` trace).
  6. Paiement mocké → redirection vers `/espace-client/documents`.
  7. Générer Reçu / Attestation / Police → assert téléchargement (`page.waitForEvent('download')` × 3).
- **Spec secondaire** `parcours-erreurs.spec.ts` : OCR 500 → vérifie message retry visible et bouton « Réessayer ».
- Ajoute `tests/e2e/fixtures/cni.jpg` (image grise 800×500 générée à la volée si absente).

## 2. Dashboard Télémétrie — filtres avancés + CSV

Édite `src/pages/admin/Telemetrie.tsx` :
- **Filtres** : ajouter `DateRangePicker` (from/to libre via `react-day-picker` déjà installé), filtre `user_id` déjà présent — étendre à recherche par email (join `profiles`).
- **Charts par kind** : remplacer le graphique unique par 3 `LineChart` côte-à-côte (OCR / PDF / KYC) avec p95 + taux d'erreur en bar overlay (`ComposedChart`).
- **Export CSV** : bouton « Exporter CSV » → sérialise `filtered` rows (`id,created_at,kind,name,duration_ms,success,error_message,user_id`) via `Blob` + `URL.createObjectURL`. Pas de dep additionnelle.
- KPI supplémentaires : `Taux d'erreur OCR`, `Taux d'erreur KYC`, `p95 PDF`.

## 3. UX retry OCR/KYC + guidance

Édite `src/components/kyc/BasicKyc.tsx` :
- Stocker `lastError` et `attempts` par doc.
- En cas d'échec : afficher carte d'erreur avec message court (« Image floue ? Recadrez et réessayez ») + bouton **Réessayer** (ré-ouvre le file picker) + lien **Continuer sans OCR** (saisie manuelle).
- Sur succès OCR : toast + ligne d'aide « Étape suivante : verso de votre pièce ».
- Messages courts par phase (« Compression… », « Envoi… », « Analyse IA… »).

Édite `src/components/adhesion/UnifiedProgressBar.tsx` pour exposer un slot « action » (bouton retry) quand `ocr.phase === 'error'`.

## 4. Mobile : skeletons + sticky actions cohérentes

- Nouveau `src/components/adhesion/StepSkeleton.tsx` (squelettes : OcrSkeleton, PdfSkeleton, KycSkeleton — utilisent `<Skeleton />` shadcn).
- Édite `src/pages/client/Adhesion.tsx` :
  - Afficher skeleton pendant `ocrBusy` / `pdfBusy` / `kycBusy` au lieu de simple spinner.
  - Extraire la barre d'action en composant `<StickyActionBar prev next loading />` rendu en `fixed bottom-0` sur mobile (`md:static`) pour **toutes** les macro-étapes — actuellement incohérente d'un step à l'autre.
  - Boutons : pleine largeur mobile, hauteur 56px, label court (« Suivant »).

Édite `src/pages/client/Documents.tsx` : skeleton card pendant `trackSync` de génération PDF.

## 5. Fix « Empreinte refusée » (WebAuthn / passkey)

Erreur signalée : *« Emprunte refusee edge function returned a non-2xx »* + message UI « L'empreinte n'a pas fonctionné. Connectez-vous… ».

- Édite `supabase/functions/webauthn-authenticate/index.ts` (et `webauthn-register`) : ne **jamais** renvoyer 4xx/5xx sur échec attendu. Toujours `status: 200` avec `{ ok: false, fallback: true, code, message }`. Réserver les non-200 aux pannes réelles.
- Édite `src/lib/webauthn.ts` + `src/components/PasskeyEnrollPrompt.tsx` + `src/pages/Login.tsx` :
  - Catch `fallback: true` → afficher un message clair *non bloquant* : « Empreinte indisponible, utilisez votre email/mot de passe ci-dessous » et **focus** le champ email.
  - Ne plus crasher si `navigator.credentials` absent (rural, vieux Android) : détection upfront, masquer le bouton passkey.
- Ajoute télémétrie `track({ kind: 'auth', name: 'passkey.authenticate' })`.

## 6. Parcours d'inscription simplifié (population rurale)

Édite `src/pages/Login.tsx` (signup) + `src/pages/client/Adhesion.tsx` :
- **Signup minimal** : email + mot de passe (ou téléphone + OTP si dispo) — supprimer champs accessoires (déplacés dans le profil post-onboarding).
- **Wording** : phrases courtes, vocabulaire concret (« Votre nom », « Votre date de naissance »), pas de jargon assurance dans les labels.
- **Mode « assistance »** : toggle en haut du wizard « Je préfère être appelé » → masque le wizard et affiche un seul écran avec numéros SONAM (27 20 31 71 82) + bouton WhatsApp.
- **Saisie tolérante** : dates en 3 champs JJ/MM/AAAA (`date-input` existant), numéros sans format strict, OCR comme chemin par défaut pour éviter la saisie manuelle.
- **Macro-steps réduits à 4** sur mobile : *Vous → Vos proches → Signature & Paiement → Reçu* (la simulation devient pré-remplie depuis la home, l'identité fusionnée avec le scan).

## Détails techniques

- Aucune nouvelle dépendance npm — `react-day-picker`, `recharts`, `framer-motion` déjà présents.
- Pas de migration DB (la table `telemetry_events` et ses index existent).
- Edge functions WebAuthn : adapter le pattern « toujours 200 + fallback » documenté dans le knowledge stack-overflow.
- E2E : `playwright.config.ts` déjà configuré ; ajouter `testDir: 'tests/e2e'` si manquant et un projet `webServer` qui pointe sur `http://localhost:8080`.
- Telemetry CSV : pure client-side, pas de backend.

## Fichiers touchés

Création :
- `tests/e2e/parcours-complet.spec.ts`
- `tests/e2e/parcours-erreurs.spec.ts`
- `tests/e2e/_helpers/auth.ts`
- `tests/e2e/fixtures/cni.jpg`
- `src/components/adhesion/StepSkeleton.tsx`
- `src/components/adhesion/StickyActionBar.tsx`

Édition :
- `src/pages/admin/Telemetrie.tsx`
- `src/components/kyc/BasicKyc.tsx`
- `src/components/adhesion/UnifiedProgressBar.tsx`
- `src/pages/client/Adhesion.tsx`
- `src/pages/client/Documents.tsx`
- `src/pages/Login.tsx`
- `src/lib/webauthn.ts`
- `src/components/PasskeyEnrollPrompt.tsx`
- `supabase/functions/webauthn-authenticate/index.ts`
- `supabase/functions/webauthn-register/index.ts`
- `playwright.config.ts` (si besoin)
