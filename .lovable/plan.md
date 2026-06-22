
# Plan — Vague 2 complète + corrections

## 1. Compte super-admin (correctif)
- Pré-créer le compte `yannsuperadminnirva@gmail.com` / `Yannedge50$` via migration + edge function `admin-signup` (forcer email_confirm=true, rôle `admin`).
- Vérifier que `ADMIN_ACCESS_CODE = "SONAM2026"` est bien la valeur acceptée par `admin-signup` ET par le formulaire `AdminLogin.tsx` (sinon corriger).
- Tester la connexion après migration.

## 2. Souscription — Étape 3 : Scanner CNI + OCR auto-fill
- Nouveau composant `IdCardScanWizard.tsx` (caméra + upload) dans `src/pages/client/Souscrire.tsx` étape 3.
- Réutiliser/étendre l'edge function `kyc-ocr-extract` : envoyer l'image (base64) → Lovable AI Gemini vision → JSON structuré `{nom, prenom, date_naissance, numero_cni, lieu_naissance, sexe, adresse}`.
- Pré-remplissage automatique des champs du formulaire + indicateur "Champs détectés via OCR" éditables.
- Stockage de l'image dans bucket `kyc-documents`.

## 3. Documents PDF (police, attestation, reçu)
- Ajouter capture de signature manuscrite (`react-signature-canvas`) à la fin de l'adhésion → stockée en `signature_data_url` sur le contrat.
- `src/lib/pdf-shared.ts` : 
  - Insérer la signature client (image PNG) dans la zone "Le Souscripteur".
  - Ajouter un tampon circulaire "SONAM VIE • PAYÉ • date" (SVG vectoriel violet incliné -15°) côté Direction Générale.
  - Refondre `pdfHeader` : logo SONAM VIE + logo AssurDignité plus grands, mieux espacés, alignement responsive A4.
  - Harmoniser tailles titres/sections, footer plus aéré.
- Appliquer à : police, attestation, reçu de paiement, rapport admin.

## 4. Dashboard admin — gestion utilisateurs live
- Page `src/pages/admin/Utilisateurs.tsx` : actions suppression / désactivation / réactivation / ajout-retrait de rôle déjà câblées sur `admin-users` edge function.
- Renforcer la suppression : cascade applicative (contrats, bénéficiaires, paiements, sinistres, notifications, kyc) via nouvelle edge function `admin-delete-user-cascade` utilisant service_role.
- Realtime : `supabase.channel` sur `profiles`, `contracts`, `paiements`, `sinistres` → rafraîchit la liste sans reload.
- Activer publication realtime sur ces tables (migration `ALTER PUBLICATION supabase_realtime ADD TABLE …`).
- Côté client : si le profil de l'utilisateur connecté disparaît → `signOut` automatique + redirection landing.

## 5. Landing — corrections demandées
- `HeroSection.tsx` / `SmartRecommender.tsx` : retirer la mention « Conseil IA non contractuel · Confirmation par un conseiller SONAM VIE avant souscription ».
- `GarantiesSection.tsx` : 7 catégories → grille `lg:grid-cols-4` avec dernière ligne centrée (`justify-center`) pour éviter l'orpheline "Garantie Accident". Alternative : passer à `lg:grid-cols-3` (3+3+1 centré) ou réorganiser en `2-2-3` selon ce qui rend mieux visuellement.

## 6. Innovation — IA peut souscrire pour l'utilisateur
- Nouveau composant `AiSubscribeAssistant.tsx` (drawer accessible depuis le chatbot ET le dashboard client).
- Edge function `ai-subscribe-agent` :
  - Conversation guidée (3-5 questions max : âge, situation familiale, budget, MoMo opérateur, bénéficiaires).
  - Appelle `recommend-formula` puis crée automatiquement : contrat (statut `pending_payment`), bénéficiaires, ligne paiement → redirige vers OTP MoMo.
  - Confirmation finale obligatoire avant insert (RGPD/consentement).
- Badge "Souscription assistée par IA" sur le contrat.

## 7. Innovations supplémentaires (admin + client)
- **Admin** : widget "Anomalies détectées par IA" sur dashboard (paiements en retard, sinistres suspects, KYC incomplets) + bouton "Générer rapport mensuel IA".
- **Client** : 
  - Notifications push in-app realtime (cloche).
  - Rappel intelligent renouvellement annuel (J-30, J-7, J-1).
  - Score "Protection famille" gamifié (% complétude bénéficiaires, KYC, paiements à jour).

## Détails techniques
- Migrations SQL : seed admin user, realtime publications, colonne `signature_data_url` sur `contracts`, colonne `ai_assisted` boolean.
- Edge functions nouvelles : `admin-delete-user-cascade`, `ai-subscribe-agent`. Existantes modifiées : `kyc-ocr-extract` (vision), `admin-signup`.
- Dépendances : `react-signature-canvas`.
- Tests Playwright rapides : login admin, OCR mock, génération PDF avec signature+tampon.

## Ordre d'exécution
1. Correctif admin (migration + test login)
2. PDF : signature + tampon + logos
3. OCR auto-fill étape 3
4. Landing corrections (mention + grille garanties)
5. Admin live + cascade delete
6. AI souscription assistée
7. Innovations bonus (anomalies, gamification, rappels)

Je confirme « go » et j'enchaîne en build mode.
