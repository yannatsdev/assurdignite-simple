## Plan d'implémentation

### 1. Connexion Google sur la page Login client
- Ajouter un bouton "Continuer avec Google" sur `src/pages/Login.tsx` (mode connexion ET inscription)
- Utiliser le module managé Lovable Cloud OAuth (`lovable.auth.signInWithOAuth("google")`) — aucune clé requise, géré automatiquement
- Redirection vers `/client` après succès, gestion des erreurs via toast
- Note : OTP WhatsApp **mis de côté** comme demandé

### 2. Connexion biométrique (WebAuthn / Passkeys)
- Créer `src/lib/webauthn.ts` : helpers `registerPasskey()` et `authenticateWithPasskey()` utilisant l'API navigateur native (`navigator.credentials`)
- Créer table `user_passkeys` (id, user_id, credential_id, public_key, counter, device_name, created_at) avec RLS stricte (user lit/écrit uniquement les siens)
- 2 edge functions : `webauthn-register` (génère challenge + stocke credential) et `webauthn-authenticate` (vérifie assertion + ouvre session via magic link/JWT custom)
- À la **2ᵉ connexion** : si l'appareil supporte WebAuthn (`PublicKeyCredential` détecté) ET utilisateur déjà inscrit, proposer modal "Activer la connexion par empreinte ?"
- Page Login : si passkey enregistré pour cet appareil → bouton prioritaire "🖐️ Connexion empreinte" en haut + repli email/mot de passe
- Stockage local `localStorage` flag `passkey_enrolled_for_<userId>` pour proposer une seule fois

### 3. Fix uploads pièces justificatives Sinistre + temps réel admin
**Problème actuel** : `src/pages/client/Sinistre.tsx` étape 1 → bouton "Charger" sans handler, fichiers non uploadés.

- Brancher chaque bouton sur un `<input type="file" hidden>` avec `accept="image/*,.pdf"`
- Upload vers bucket Storage `kyc-documents` (existant) sous `sinistres/{user_id}/{sinistre_id}/{type}-{filename}`
- Créer le sinistre (INSERT) **avant** uploads pour avoir l'id, puis stocker les URLs publiques signées dans `sinistres.documents_urls` (champ ARRAY existant)
- Indicateur de progression par fichier + état "uploadé ✓"
- Politique storage : ajouter policies pour bucket `kyc-documents` permettant à l'utilisateur d'uploader sous son `user_id` et aux admins de tout lire
- **Temps réel admin** : sur `src/pages/admin/Sinistres.tsx`, ajouter `supabase.channel().on('postgres_changes', { table: 'sinistres' })` pour mise à jour live de la liste (insert + update). Activer la table dans publication realtime via migration.
- Page admin Sinistres : ajouter colonne "Documents" avec aperçu + lien de téléchargement signé

### 4. Bouton "Appeler maintenant" → dialer
- `src/pages/client/Assistance.tsx` : envelopper le bouton dans `<a href="tel:+2250595452165">` (numéro 05 95 45 21 65)
- Ajouter aussi un bouton WhatsApp (`https://wa.me/2250595452165`) pour cohérence mobile premium

### 5. Notifications temps réel admin pour nouveaux sinistres
- Trigger DB `on_sinistre_insert` qui crée une ligne dans `notifications` pour tous les admins (via fonction security definer qui boucle sur `user_roles` admins)
- Dashboard admin (`src/pages/admin/Dashboard.tsx`) : abonnement realtime sur `sinistres` + toast "Nouveau sinistre déclaré : {ref}" + badge compteur en temps réel
- Bell icon dans `src/components/admin/AdminSidebar.tsx` avec compteur non-lus

### 6. Refonte design premium (mobile + web)
**Objectif** : look "assurance premium high-end" type Allianz/AXA digital.
- `src/index.css` : ajouter ombres douces premium (`--shadow-premium`), gradients SONAM violet→bleu plus riches, glass-morphism subtil pour cartes
- Cartes : bordures fines `border-border/40`, padding plus aéré, micro-animations Framer Motion sur hover et apparition (fade+slide)
- Sidebar client (`ClientSidebar.tsx`) : icônes plus grandes mobile, indicateur actif avec barre verticale violette + glow
- Header mobile : bottom-nav style iOS pour navigation principale (Accueil, Contrats, Sinistre, Profil)
- Dashboard client : hero card avec motif décoratif SVG en filigrane, typographie Playfair plus marquée
- Page Login : ajouter mini-carrousel de témoignages, icônes confiance (Cadenas SSL, agréé CIMA)
- Toutes les pages : transitions de route fluides avec Framer Motion

### 7. Nettoyage données prod (mock + base)
**Code (mocks restants)** :
- Dashboard client : "Bonus Fidélité-Santé 1/3 an" en dur → calculer depuis `contracts.date_effet` (années écoulées sans sinistre lié)
- Dashboard admin : `livePresence` non utilisé → soit retirer soit brancher sur Supabase presence
- Vérifier `Communication.tsx`, `Reporting.tsx`, `Fraude.tsx` pour valeurs en dur

**Base (vider tests)** :
- Migration `DELETE FROM paiements; DELETE FROM sinistres; DELETE FROM beneficiaires; DELETE FROM assures_complementaires; DELETE FROM contracts; DELETE FROM notifications;`
- Conserver `profiles`, `user_roles`, `actuarial_config_versions`, `chatbot_faqs`

---

## Détails techniques

**Nouvelle table** : `user_passkeys (id uuid pk, user_id uuid not null, credential_id text unique, public_key text, counter bigint default 0, device_name text, created_at timestamptz default now())` + RLS user-scope.

**Trigger sinistres** :
```sql
create function notify_admins_new_sinistre() returns trigger ...
  insert into notifications (user_id, title, message, type, link)
  select ur.user_id, 'Nouveau sinistre', 'Réf: '||NEW.reference, 'sinistre', '/admin/sinistres'
  from user_roles ur where ur.role = 'admin';
```

**Realtime** : `ALTER PUBLICATION supabase_realtime ADD TABLE sinistres, notifications;`

**Storage policies** sur `kyc-documents` :
- INSERT/SELECT : `auth.uid()::text = (storage.foldername(name))[2]` (path = `sinistres/{user_id}/...`)
- SELECT admin : `has_role(auth.uid(), 'admin')`

**Fichiers modifiés** : `Login.tsx`, `Sinistre.tsx` (client), `Assistance.tsx`, `Sinistre.tsx` (admin), `Dashboard.tsx` (admin+client), `AdminSidebar.tsx`, `ClientSidebar.tsx`, `index.css`, + nouveaux : `lib/webauthn.ts`, `components/PasskeyPrompt.tsx`, `components/MobileBottomNav.tsx`, edge functions `webauthn-register`, `webauthn-authenticate`.

**Connecteur** : configurer Google OAuth via outil natif Lovable Cloud (aucune action utilisateur requise).
