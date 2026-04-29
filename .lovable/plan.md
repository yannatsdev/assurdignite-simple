## Intégration Didit Identity Verification

Remplacer le KYC manuel (upload CNI/photo/domicile) par le flux Didit avec SDK JavaScript + session backend sécurisée. Le sci-fi wizard précédemment proposé est abandonné.

### 1. Secrets backend

Demander via `add_secret` :
- `DIDIT_API_KEY` — Didit Console > API & Webhooks
- `DIDIT_WORKFLOW_ID` — Didit Console > Workflows
- `DIDIT_APP_ID` — (stocké pour référence/logs)

Toutes côté backend uniquement. Le frontend ne reçoit qu'un `session_token` + `verification_url`.

### 2. Schéma DB

Migration : ajouter colonnes à `profiles` (ou nouvelle table `kyc_sessions`) :
```
kyc_session_id text
kyc_status text         -- 'pending' | 'in_review' | 'approved' | 'declined'
kyc_provider text default 'didit'
kyc_verified_at timestamptz
kyc_payload jsonb
```
RLS : user lit/met à jour son propre profil ; service role écrit via webhook.

### 3. Edge functions

**`didit-create-session`** (verify_jwt = true)
- Auth user via JWT
- POST `https://verification.didit.me/v3/session/`
- Headers : `x-api-key: DIDIT_API_KEY`
- Body : `{ workflow_id, vendor_data: user.id, callback: "<app>/client/adhesion?kyc=done" }`
- Retourne `{ session_id, session_token, verification_url }` au client
- Insère ligne `pending` dans `profiles.kyc_*`

**`didit-webhook`** (verify_jwt = false, public)
- Reçoit POST de Didit avec résultat final
- Vérifie signature HMAC (header `x-signature`) avec `DIDIT_WEBHOOK_SECRET` (à demander aussi)
- Met à jour `profiles.kyc_status`, `kyc_verified_at`, `kyc_payload` via service role
- Log dans `supabase/config.toml` : ajouter `[functions.didit-webhook] verify_jwt = false`

### 4. Frontend — composant `<DiditVerification />`

Nouveau fichier `src/components/kyc/DiditVerification.tsx`:
- Bouton « Démarrer la vérification d'identité »
- Au clic : `supabase.functions.invoke('didit-create-session')`
- Charge SDK : `const { DiditSdk } = await import('@didit-protocol/sdk-web')`
- `DiditSdk.shared.onComplete = (result) => { ... }` met à jour état local + UI
- `DiditSdk.shared.onEvent` pour afficher progression (étape document_front, face, etc.)
- `startVerification({ url: verification_url, configuration: { showExitConfirmation: true, closeModalOnComplete: true } })`
- Fallback bouton « Ouvrir dans un nouvel onglet » si SDK échoue

Polling léger (`select kyc_status from profiles`) toutes les 3s pendant que modal ouvert, ou realtime subscribe sur `profiles` row pour basculer immédiatement quand webhook arrive.

### 5. Intégration dans `Adhesion.tsx`

Étape 3 « KYC Principal » :
- Garder champs textuels (nom, prénom, dob, email, phone, adresse, CNI) — utiles pour la police
- **Remplacer** la zone upload (CNI recto/verso, selfie, justificatif domicile) par `<DiditVerification />`
- Bloquer `Suivant` tant que `kyc_status !== 'approved'` (autoriser `in_review` avec warning)
- Badge vert « Identité vérifiée par Didit » + sessionId masqué

Étape 4 « Conjoint » : même composant avec `vendor_data` distinct (`${user.id}:conjoint`).

Supprimer / archiver `CameraSelfie` et logique `kycFiles` upload Supabase Storage (garder bucket pour autres docs).

### 6. Dashboard admin

`src/pages/admin/Utilisateurs.tsx` ou `Contrats.tsx` : afficher colonne `KYC` avec badge (Approved/Pending/Declined) + lien vers `kyc_payload` (JSON viewer modal).

### 7. Installation

```
bun add @didit-protocol/sdk-web
```

### 8. Détails techniques

- SDK importé en dynamic import pour ne pas charger au boot
- Mode modal par défaut (mobile + desktop friendly)
- `loggingEnabled: import.meta.env.DEV`
- Webhook URL à configurer dans Didit Console : `https://vnnzizjgbphhsmkdenbn.supabase.co/functions/v1/didit-webhook`
- Rate limit free 10/min — ajouter throttle côté `didit-create-session` (1 session/user/min)

### Fichiers touchés

Nouveaux :
- `supabase/functions/didit-create-session/index.ts`
- `supabase/functions/didit-webhook/index.ts`
- `src/components/kyc/DiditVerification.tsx`
- migration SQL pour colonnes profiles

Modifiés :
- `src/pages/client/Adhesion.tsx` (étape 3 et 4)
- `src/pages/admin/Utilisateurs.tsx` (colonne KYC)
- `supabase/config.toml` (verify_jwt webhook)
- `package.json` (sdk-web)

### Question avant exécution

Je vais te demander 4 secrets : `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_APP_ID`, et `DIDIT_WEBHOOK_SECRET` (signature webhook — à créer dans la console Didit). Confirme l'approbation pour démarrer.
