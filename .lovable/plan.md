# Plan d'amélioration AssurDignité

## 1. Page Login utilisateur (src/pages/Login.tsx)
- Supprimer le badge **"Agréé CIMA • SSL 256 bits"** (ligne 88-90).
- Remplacer le titre/sous-titre du visuel par :
  - Titre : **"Bienvenue sur votre Espace Client"**
  - Sous-titre : *"Gérez vos contrats, suivez vos paiements et déclarez vos sinistres en toute simplicité, 100% digital."*
- Garder visible aussi en mobile (retirer `hidden sm:block`).

## 2. KYC Didit — auto-remplissage (src/pages/client/Adhesion.tsx + DiditVerification.tsx)
**Problème :** `onExtractedData` ne se déclenche que si `parseDiditPayload` trouve des champs ; le webhook Didit peut renvoyer la décision dans une forme non couverte.

Corrections :
- Côté `DiditVerification.tsx` :
  - Élargir `parseDiditPayload` pour parcourir aussi `payload.verifications`, `payload.id_document`, `payload.mrz`, `payload.face`, et la clé `extracted_data`.
  - Lors de `result.type === 'completed'`, **toujours** récupérer le profil complet en BDD (`profiles.kyc_payload`) et fire `fireExtracted` même si la SDK n'a rien renvoyé.
  - Re-déclencher `fireExtracted` à chaque update temps-réel approved (retirer le `extractedFiredRef` pour les approved updates qui contiennent un payload non vide).
- Côté `Adhesion.tsx` : forcer `setKyc` même si champs déjà saisis quand l'utilisateur n'a rien tapé manuellement (tracker `kycManuallyEdited`).
- Afficher un toast clair si Didit OK mais aucune donnée extraite, avec bouton "Réessayer la récupération".

## 3. Fast-Track Sinistre — Résumé + Suivi (src/pages/client/Sinistre.tsx + nouvelle page)
- Ajouter un **résumé de dossier** (étape 4 actuelle) listant : infos décès, documents téléchargés (avec lien signed URL), bénéficiaire, méthode paiement, référence, date prévue de virement.
- Créer **`src/pages/client/SinistreSuivi.tsx`** (route `/client/sinistre/:id`) :
  - Stepper visuel (Déclaré → En traitement → Validé → Payé / Rejeté) avec dates.
  - Délai estimé (< 12h après validation).
  - Liste des pièces téléchargées (téléchargeables via signed URL).
  - Realtime sur `sinistres` filtré par id.
  - Lien depuis Dashboard et écran de confirmation Sinistre.
- Côté upload : augmenter limite à 10 Mo (déjà annoncé), valider type, gérer erreur de bucket non public via signed URL (déjà OK).

## 4. Sécurité Passkeys (src/lib/webauthn.ts + Login.tsx)
- Wrap `authenticateWithPasskey` :
  - Détecter `NotAllowedError` (challenge expiré / refus) → message clair + proposer Google.
  - Détecter `InvalidStateError` (device non reconnu) → effacer marker local + proposer Google.
  - Timeout 60s → proposer fallback.
- Sur la page Login : si la biométrie échoue, afficher une **bannière** avec bouton "Continuer avec Google" pré-cliquable.
- Côté Edge Function `webauthn-authenticate` : vérifier que le `credential_id` appartient bien à l'email (déjà fait via `profiles`), retourner code d'erreur explicite (`UNKNOWN_DEVICE`, `NO_PASSKEY`).
- **Garantir l'unicité** : index unique `(user_id, credential_id)` sur `user_passkeys` (migration) et un seul passkey actif par device.

## 5. Biométrie comme 2e confirmation au paiement (Adhesion.tsx — étape Signature)
- Avant `handleSign()`, exiger une vérification WebAuthn de l'utilisateur connecté.
- Si l'utilisateur n'a pas encore de passkey enregistré → propose `registerPasskey()` à la volée (enrôlement immédiat lié à `user.id`).
- Si l'appareil ne supporte pas la biométrie → fallback OTP email (lien magique court).
- Marqueur en BDD `paiements.biometric_confirmed_at` (migration ajout colonne).
- Une passkey = un user (déjà via RLS `auth.uid() = user_id` sur `user_passkeys`).

## 6. ChatBot — base de connaissance + formatage (src/components/ChatBot.tsx + edge fn `chat-ai`)
- Edge function `chat-ai` :
  - Au démarrage, récupérer toutes les `chatbot_faqs` actives + un **bloc règles garanties** (formules A/B/C/D, capitaux, exclusions Article 4, bonus Article 6) injecté dans le system prompt.
  - Forcer le modèle `google/gemini-2.5-flash` à répondre en markdown structuré (cards, citations `>`, listes, liens).
- Front :
  - Améliorer le rendu : composants `Card` pour les blocs "Formule X", `blockquote` stylé pour citations CIMA, liens internes (`/client/sinistre`, `/client/contrats`) reconnus via regex et transformés en boutons.
  - Synchronisation espace utilisateur : si `user` connecté, charger `contracts` et inclure un résumé dans le contexte ("contrat actif POL-XXX, formule D, prochain paiement..."). Permet de répondre "Quand expire mon contrat ?".

## 7. Notifications admin temps-réel (nouveau composant + AdminLayout)
- Créer `src/components/admin/NotificationBell.tsx` :
  - Subscribe realtime sur `notifications` (filter `user_id=eq.{adminId}` ou via `has_role`).
  - Badge avec compteur non-lu.
  - Popover avec historique (50 derniers), groupés par type (`sinistre`, `paiement`, `contrat`, `info`).
  - Filtres par type de sinistre (déclaré / en traitement / payé / rejeté).
  - Marquer lu au clic + bouton "Tout marquer lu".
- Intégrer dans `AdminLayout.tsx` (header).
- Élargir trigger `notify_admins_new_sinistre` (déjà actif) + ajouter trigger pour status update sinistre.

## 8. Design premium cohérent
- Créer `src/components/ui/premium-card.tsx`, `section-header.tsx`, `stat-tile.tsx`, `status-pill.tsx` réutilisables (couleurs SONAM violet/vert/bleu, gradients, micro-interactions framer-motion).
- Auditer toutes les pages client + admin pour utiliser ces composants (dashboard, contrats, paiements, sinistres, profil, beneficiaires, documents, assistance).
- Typographies : `font-display` (Playfair) pour titres, `font-sans` (DM Sans) pour body, harmoniser tailles (h1 3xl/2xl mobile, h2 xl, body sm/base).
- Micro-interactions : hover scale 1.02 sur cards, ripple sur boutons primaires, transitions `framer-motion` page (déjà sur quelques pages → généraliser via wrapper dans layouts).

## 9. Compte admin seed
- Via `admin-signup` edge function (déjà existante) :
  - Email : `adminyannsonam@gmail.com`
  - Password : `Yannedge50$`
  - Code d'accès : `ADDWARRIORSONAMVIE777` (déjà = `ADMIN_ACCESS_CODE`)
- Exécuter automatiquement lors du déploiement via un script ou directement appeler l'endpoint une fois.

## Détails techniques
- **Migrations SQL :**
  ```sql
  -- Unicité passkeys
  create unique index if not exists user_passkeys_user_credential_uniq
    on public.user_passkeys (user_id, credential_id);
  -- Confirmation biométrique paiement
  alter table public.paiements
    add column if not exists biometric_confirmed_at timestamptz;
  -- Trigger update sinistre
  create or replace function public.notify_admins_sinistre_status()
  returns trigger language plpgsql security definer set search_path=public as $$
  begin
    if NEW.status is distinct from OLD.status then
      insert into public.notifications (user_id, title, message, type, link, contract_id)
      select ur.user_id, 'Sinistre mis à jour',
             'Réf '||NEW.reference||' → '||NEW.status,
             'sinistre', '/admin/sinistres', NEW.contract_id
      from public.user_roles ur where ur.role='admin';
    end if;
    return NEW;
  end$$;
  create trigger trg_sinistre_status
    after update on public.sinistres
    for each row execute function public.notify_admins_sinistre_status();
  ```
- **Edge function** `chat-ai` mise à jour pour fetch FAQ + règles + contexte user.
- **Routes** ajoutées dans `App.tsx` : `/client/sinistre/:id`.

## Fichiers impactés
**Modifiés :** `src/pages/Login.tsx`, `src/pages/client/Adhesion.tsx`, `src/pages/client/Sinistre.tsx`, `src/components/kyc/DiditVerification.tsx`, `src/lib/webauthn.ts`, `src/components/ChatBot.tsx`, `src/layouts/AdminLayout.tsx`, `src/App.tsx`, `supabase/functions/chat-ai/index.ts`, `supabase/functions/webauthn-authenticate/index.ts`.
**Créés :** `src/pages/client/SinistreSuivi.tsx`, `src/components/admin/NotificationBell.tsx`, `src/components/ui/premium-card.tsx`, `src/components/ui/section-header.tsx`, `src/components/ui/status-pill.tsx`, migration SQL.
