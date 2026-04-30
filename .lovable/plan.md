## Contexte important — écran Google "Lovable"

L'écran de connexion Google (logo cœur Lovable + texte "Accéder à l'application Lovable") est **l'écran de consentement OAuth de Google**, contrôlé côté Google Cloud Console — il n'est pas modifiable depuis le code de l'app. Pour afficher "AssurDignité" + logo SONAM, il faut **utiliser tes propres identifiants Google OAuth (BYOC)** :

1. Créer un projet Google Cloud → écran de consentement OAuth → nom de l'app "AssurDignité", logo SONAM, domaine autorisé.
2. Générer un Client ID + Client Secret OAuth.
3. Les coller dans Lovable Cloud → Users → Authentication Settings → Sign In Methods → Google → "Use your own credentials".

Je peux préparer le code et te guider, mais cette étape de configuration Google + collage des secrets dans Cloud doit être faite par toi (5 min). Sans cela, l'écran Google restera "Lovable".

Je vais malgré tout traiter **tout le reste** maintenant.

---

## Plan d'implémentation

### 1. Nouvelle page Paiement simulée (Mobile Money + OTP)

- Créer `src/pages/client/PaiementCheckout.tsx` (route `/client/paiement/:contractId?`).
- Étape 1 — Sélection opérateur : 4 cartes cliquables avec les SVG `orange.svg`, `wave.svg`, `mtn.svg`, `moov.svg` déjà présents dans `src/assets`. Bandeau jaune "Mode test : paiements simulés, aucun débit réel".
- Étape 2 — Saisie numéro Mobile Money (validation +225 / 10 chiffres).
- Étape 3 — OTP simulé : afficher un code à 6 chiffres généré client-side (ex. `123456`) directement dans l'UI avec mention "Code de test : XXXXXX". Champ OTP, validation, animation de confirmation.
- Étape 4 — Confirmation biométrique (avec le nouveau fallback gracieux, voir §3).
- Étape 5 — Insertion `paiements` (status `paid` direct en mode simulé), notification, redirection succès.
- Refonte de `Paiements.tsx` : bouton principal "Payer ma prime" → ouvre cette page au lieu du formulaire actuel.

### 2. Résumé de transaction pour paiements en attente

Dans `Paiements.tsx` colonne Historique :
- Bouton "Voir le résumé" sur les lignes `pending`.
- Modal avec : montant, méthode, référence, date, contrat lié, statut → 2 actions : **"Reprendre le paiement"** (relance le checkout) et **"Annuler et recommencer"** (UPDATE status='cancelled', puis ouvre checkout vierge).

### 3. Fix biométrie "non disponible"

Dans `src/lib/webauthn.ts` → `verifyBiometricForUser` : la détection actuelle rejette dès qu'`isUserVerifyingPlatformAuthenticatorAvailable()` renvoie `false` (ce qui arrive même avec biométrie présente, ex. iframe preview, contexte non-HTTPS local, navigateur restrictif).

Améliorations :
- Détection plus tolérante : try/catch séparés, fallback sur `navigator.credentials.create` réel si la pré-check échoue mais le navigateur supporte WebAuthn.
- Distinguer 3 cas : (a) WebAuthn supporté + capteur OK → biométrie obligatoire ; (b) WebAuthn supporté mais capteur indéterminé → tenter quand même ; (c) pas de WebAuthn du tout → afficher carte "Biométrie non disponible sur cet appareil" + bouton **"Continuer sans biométrie"** (avec confirmation par mot de passe en fallback).
- Dans `Adhesion.tsx` étape Signature : remplacer le toast d'erreur rouge par un encart info + bouton "Continuer sans biométrie" si cas (c). Si cas (a/b) qui échoue après tentative → toast d'erreur + retry.

### 4. Composants premium réutilisables

Créer dans `src/components/ui/` :
- `premium-card.tsx` — Card avec gradient subtil violet→blanc, bordure 1px, ombre douce, padding cohérent, variant `gradient` / `outline` / `glass`.
- `section-header.tsx` — Titre H2 Playfair + sous-titre DM Sans + slot action à droite.
- `status-pill.tsx` — Pastille colorée typée (`active` vert, `pending` ambre, `paid` vert, `failed` rouge, `cancelled` gris) avec icône.

Appliquer sur : `Dashboard.tsx`, `Paiements.tsx`, `Sinistre.tsx`, `SinistreSuivi.tsx`, `Documents.tsx`, `Contrats.tsx`, `Beneficiaires.tsx`, `Profil.tsx`.

### 5. Refonte Dashboard premium (inspiration mockup image 9)

- Header avec avatar circulaire + "Hello 👋 {Prénom}" + cloche notifications.
- Barre de recherche globale (filtre actions rapides + contrats).
- **Carte contrat hero** : gradient violet, photo/icône, formule en grand, dates clés, bouton "Renouveler" si proche échéance, ID Card avec QR (deep-link vers `/client/contrats/:id`).
- Grille **Quick Actions** colorée (4 tuiles : Sinistre / Documents / Bénéficiaires / Simuler) — version chips arrondies premium.
- Section **Live & Rewards** : carte "Bonus Fidélité-Santé" avec progression circulaire + carte "Chat avec expert" → ouvre chatbot.
- Bottom-nav mobile sticky (Home / Contrats / Sinistres / Profil) avec FAB central violet "+" → menu rapide (déclarer sinistre / payer / souscrire).
- Animations Framer Motion sur entrée des cartes.

### 6. Section Historique des sinistres

Nouvelle section dans `Dashboard.tsx` + page dédiée `src/pages/client/SinistresHistorique.tsx` :
- Liste de tous les sinistres de l'utilisateur (`sinistres` filtrés `user_id`).
- Colonnes : Référence, Date déclaration, Nom du défunt, Statut (`status-pill`), Action → "Suivre" qui pointe vers `SinistreSuivi` `/client/sinistre/:id`.
- Filtres par statut, recherche par référence/nom.

### 7. Suivi des pièces — recherche, tri, prévisualisation

Dans `SinistreSuivi.tsx` (et `Documents.tsx`) :
- Barre de recherche par nom de fichier.
- Select de tri par type (`acte_deces`, `cni`, `acte_naissance`, `bulletin_pharmacie`, etc.).
- Prévisualisation : Dialog plein écran qui ouvre PDF dans `<iframe>` (signed URL) ou image dans `<img>` selon le mime/extension.
- Badge type + taille du fichier sur chaque carte.

### 8. Chatbot contextuel avec actions rapides

Dans `src/components/ChatBot.tsx` :
- Au mount, charger contexte : contrat actif ? paiement dû ? sinistre en cours ? attestation dispo ?
- Afficher chips d'**actions rapides contextuelles** au-dessus du champ de saisie :
  - Si contrat actif sans paiement annuel → "💳 Payer ma prime" (→ `/client/paiement`)
  - Toujours → "🚨 Déclarer un sinistre" (→ `/client/sinistre`)
  - Si contrat actif → "📄 Télécharger mon attestation" (génère PDF jsPDF)
  - Si sinistre en cours → "🔍 Suivre mon sinistre" (→ `/client/sinistre/:id`)
- Côté edge function `chat-ai` : injecter le contexte utilisateur (contrat, dernière prime, sinistres) dans le system prompt.

### 9. Nettoyage cohérence générale

- Vérifier toutes les routes dans `App.tsx` (ajouter `/client/paiement`, `/client/historique-sinistres`).
- Uniformiser tous les badges de statut → `status-pill`.
- Uniformiser tous les en-têtes de page → `section-header`.
- Vérifier que `methode` affichée dans historique paiements est lisible (`Orange Money` au lieu de `orange_money`).
- Corriger les imports `lucide-react` cassés éventuels.

---

## Détails techniques

**Fichiers créés**
- `src/pages/client/PaiementCheckout.tsx`
- `src/pages/client/SinistresHistorique.tsx`
- `src/components/ui/premium-card.tsx`
- `src/components/ui/section-header.tsx`
- `src/components/ui/status-pill.tsx`
- `src/components/payment/OperatorPicker.tsx`
- `src/components/payment/OtpVerification.tsx`
- `src/components/payment/TransactionSummaryDialog.tsx`
- `src/components/documents/DocumentPreviewDialog.tsx`

**Fichiers modifiés**
- `src/lib/webauthn.ts` — détection robuste + flag `unsupported` retourné
- `src/pages/client/Adhesion.tsx` — fallback "Continuer sans biométrie"
- `src/pages/client/Paiements.tsx` — refonte + bouton checkout + résumé pending
- `src/pages/client/Dashboard.tsx` — refonte premium
- `src/pages/client/Sinistre.tsx` & `SinistreSuivi.tsx` — recherche/tri/preview pièces
- `src/pages/client/Documents.tsx` — recherche/tri/preview
- `src/components/ChatBot.tsx` — chips contextuelles
- `supabase/functions/chat-ai/index.ts` — contexte utilisateur dans prompt
- `src/App.tsx` — nouvelles routes
- `src/layouts/ClientLayout.tsx` — bottom-nav mobile premium

**Pas de migration DB requise** — tout passe par les tables existantes (`paiements`, `sinistres`, `contracts`, `notifications`).

---

## Action à ta charge (Google branding)

Une fois le plan approuvé, je te re-rappellerai en fin d'implémentation comment configurer ton propre OAuth Google pour remplacer "Lovable" par "AssurDignité" sur l'écran Google. C'est la seule étape qui ne peut pas être faite par code.