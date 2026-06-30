# Plan — Simplification parcours, OCR rapide, fixes auth & télémétrie

## 1. OCR plus rapide et plus fiable
- `supabase/functions/kyc-ocr-extract/index.ts`: garder `gemini-2.5-flash`, réduire le prompt système, supprimer le champ `image2` quand non utilisé (1 seul appel = 2× plus rapide pour CNI recto seul), `max_tokens: 400`, `temperature: 0`.
- `src/components/kyc/IdCardScanner.tsx`: compression plus agressive (max 1280px, JPEG q=0.72, target <350 KB), démarrage caméra avec `facingMode: { ideal: 'environment' }` + fallback, capture auto dès détection de stabilité (déjà partiel), suppression de l'auto-retry « haute qualité » qui double le temps — un seul appel, puis bouton « Réessayer » manuel.
- Préchauffage edge function (`supabase.functions.invoke('kyc-ocr-extract', { body: { ping: true } })`) au montage de l'étape Identité pour éviter le cold start.

## 2. Suppression de l'empreinte sur Login
- `src/pages/Login.tsx`: retirer le bouton « Connexion par empreinte », l'état `biometricAvailable`, `handleBiometric`, `bioFailed`, `bioMessage`, les imports `Fingerprint` et `authenticateWithPasskey`.
- `src/components/PasskeyEnrollPrompt.tsx`: ne plus monter le composant (retirer ses usages dans `ClientLayout`/Dashboard si présents).
- Edge functions `webauthn-*` et table `user_passkeys`: conservées côté backend mais plus appelées depuis le client (pas de migration destructive pour ne pas casser les données existantes).

## 3. Fixes création de compte / sign-in
- `src/contexts/AuthContext.tsx`: messages d'erreur traduits (Invalid login credentials → « Email ou mot de passe incorrect », User already registered → « Compte existant, connectez-vous »), trim email, lowercase email, validation longueur password ≥ 6 côté client avant appel.
- `signUp`: ajouter `emailRedirectTo: window.location.origin + '/client'` (corrige la redirection après confirmation email).
- `src/pages/Login.tsx`: désactiver bouton pendant `isLoading`, afficher erreurs inline (pas seulement toast), reset password link vers `/reset-password` (créer page minimale si absente).

## 4. Parcours adhésion simplifié — 5 étapes max (mode rural inclus)
Refonte `src/pages/client/Adhesion.tsx` pour passer de 14 sous-étapes à **5 écrans** :
1. **Simulation rapide** — formule + capital + âge → prime affichée (gros chiffres).
2. **Scan identité** — OCR (1 photo recto, verso optionnel), auto-remplissage.
3. **Confirmation infos + bénéficiaires** — un seul écran, tout pré-rempli, bénéficiaires en accordéon (1 minimum).
4. **KYC + Conditions + Signature** — upload selfie (optionnel rural), case conditions, signature tactile.
5. **Paiement + Reçu** — MoMo/Wave, OTP, reçu PDF téléchargeable.

Implémentation:
- Refactor en composants `Step1Simulation`, `Step2Scan`, `Step3Infos`, `Step4Signature`, `Step5Paiement` sous `src/components/adhesion/steps/`.
- État unique `AdhesionDraft` persistant en `sessionStorage` (déjà partiel).
- **Mode rural**: toggle auto si `navigator.connection.effectiveType` ∈ {`2g`,`slow-2g`} OU viewport <380px → boutons 56px, labels courts, skip selfie, queue offline (IndexedDB simple) + bannière « Mode hors-ligne, vos données seront envoyées dès la reconnexion ».
- Bouton sticky « Suivant » plein largeur en bas (réutiliser `StickyActionBar`).

## 5. Bouton « Continuer en envoi manuel »
- `src/components/kyc/IdCardScanner.tsx` et `BasicKyc.tsx`: en cas d'échec OCR/KYC, panneau d'erreur avec :
  - Bouton primaire **« Réessayer »**.
  - Bouton secondaire **« Continuer en envoi manuel »** → ouvre un formulaire texte (nom, prénom, n° CNI, date naissance, date expiration) + upload photo brute (sans OCR), marqué `kyc_documents.ocr_status = 'manual'` pour revue admin.
  - Étapes affichées : « 1. Saisissez vos infos · 2. Photo recto · 3. Photo verso · 4. Un agent vérifiera sous 24h ».
- `src/pages/admin/KycDocuments.tsx`: filtre « En attente de vérification manuelle » + badge orange.

## 6. Export CSV Télémétrie complet
- `src/pages/admin/Telemetrie.tsx`: revoir `exportCsv` pour inclure colonnes : `date_iso, user_id, user_email, kind (ocr|pdf|kyc), name, duration_ms, success, error_message, meta_json`. Agréger sur la période un second CSV résumé : `kind, count, avg_ms, p95_ms, error_rate_pct`. Bouton « Export détaillé » et « Export résumé ». Garantir téléchargement via `Blob` + `URL.createObjectURL` + `<a download>`.
- Tester localement que filtre date+user est appliqué avant export.

## 7. Test Playwright complet en CI
- `tests/e2e/parcours-complet.spec.ts`: étendre pour couvrir parcours réel mock (simulation → scan stubbed → infos → signature canvas → paiement mock → reçu PDF téléchargé). Assert `download.suggestedFilename()` contient `recu`.
- `package.json`: script `"test:e2e": "playwright test"`.
- `.github/workflows/e2e.yml` (créer): job Ubuntu, `bun install`, `bunx playwright install --with-deps chromium`, build, `bun run test:e2e`, upload artefacts.

## 8. Fixes erreurs diverses
- `Adhesion.tsx` : corriger redirection après simulation qui renvoyait vers `/client` au lieu de l'étape 2 (garder `step` synchronisé avec sessionStorage au mount).
- Console errors: vérifier `BasicKyc` n'appelle pas `adhesionProgress.setKyc` avec un doc non typé.

## Section technique

### Fichiers créés
- `src/components/adhesion/steps/Step1Simulation.tsx`
- `src/components/adhesion/steps/Step2Scan.tsx`
- `src/components/adhesion/steps/Step3Infos.tsx`
- `src/components/adhesion/steps/Step4Signature.tsx`
- `src/components/adhesion/steps/Step5Paiement.tsx`
- `src/components/kyc/ManualKycForm.tsx`
- `src/hooks/useRuralMode.ts`
- `src/lib/offline-queue.ts` (IndexedDB minimal via `idb-keyval`)
- `.github/workflows/e2e.yml`
- `src/pages/ResetPassword.tsx` (si absent)

### Fichiers modifiés
- `src/pages/Login.tsx`, `src/contexts/AuthContext.tsx`
- `src/pages/client/Adhesion.tsx` (refonte majeure)
- `src/components/kyc/IdCardScanner.tsx`, `src/components/kyc/BasicKyc.tsx`
- `supabase/functions/kyc-ocr-extract/index.ts`
- `src/pages/admin/Telemetrie.tsx`, `src/pages/admin/KycDocuments.tsx`
- `tests/e2e/parcours-complet.spec.ts`, `playwright.config.ts`
- `package.json` (script test:e2e, dep `idb-keyval`)

### Migration BDD
- Ajout colonne `kyc_documents.ocr_status text default 'auto'` (valeurs: `auto|manual|verified|rejected`) avec GRANT + RLS conservée.

### Non-objectifs
- Pas de suppression de la table `user_passkeys` ni des edge functions webauthn (gardées pour usage futur côté espace client).
- Pas de refonte visuelle du landing ni de l'admin hors pages citées.
