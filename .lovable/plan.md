## Plan de polissage UX & responsive AssurDignité

### 1. Carrousel "MarketingCarousel" (dashboard) — lisibilité
Fichier : `src/components/client/MarketingCarousel.tsx`
- Réduire les indicateurs (boutons ronds en bas-droite) : taille `h-1 w-1` (point), zone cliquable invisible plus grande, et **les déplacer en bas-centre** sur une seule ligne fine pour ne pas masquer les textes (notamment "Dignité jusqu'au dernier souffle").
- Augmenter le `padding-bottom` du contenu (`pb-8`) pour dégager les indicateurs.
- Renforcer le dégradé bas (`from-black/90 via-black/60 to-black/20`) afin que les sous-titres restent lisibles sur toutes les images.
- Ajouter `pr-12` au bloc texte pour ne jamais passer sous l'indicateur.

### 2. Chatbot — bouton réductible / réouvrir
Fichier : `src/components/ChatBot.tsx`
- Ajouter état `minimized` persisté dans `localStorage` (clé `chatbot_minimized`).
- Quand minimisé : remplacer la bulle ronde violette par une mini-pastille discrète (icône `MessageCircle` h-8 w-8) en bas-droite avec tooltip "Ouvrir l'assistant".
- Quand ouvert/fermé normal : ajouter un bouton "−" (Minimize2) dans l'en-tête du panneau et à côté du FAB pour le réduire.
- S'applique automatiquement sur landing, dashboard user, dashboard admin (le composant est déjà monté à ces endroits).

### 3. Profil OCR — wording
Fichier : `src/pages/client/Profil.tsx`
- Remplacer "Vos images sont traitées par l'IA Lovable de manière sécurisée et ne sont pas stockées." par "Vos images sont traitées par notre IA de manière sécurisée et ne sont pas stockées."

### 4. Paiements annulés — ne plus afficher dans "Derniers paiements"
Fichiers :
- `src/pages/client/Dashboard.tsx` — la requête `paiements` ajoute `.neq('status', 'cancelled')`.
- Le realtime channel rafraîchit déjà → ok.
- `src/pages/client/Paiements.tsx` — vérifier que le tableau "Mes derniers paiements" applique aussi le filtre `cancelled` masqué (ou affiche dans un onglet "Annulés" séparé). Décision : masquer par défaut, conserver l'historique côté DB.

### 5. Sinistre Fast-Track — bannière lisible
Fichier : `src/pages/client/Sinistre.tsx` (utilise `ClientHeroBanner`)
- Augmenter la hauteur `h-52 sm:h-60` et appliquer un overlay plus marqué côté gauche (`from-black/85 via-black/60 to-black/15`) pour que "Sinistre Fast-Track" et le sous-texte s'affichent en entier sans coupure (le titre apparaît coupé en haut).
- Utiliser `object-cover object-[60%_center]` pour recadrer l'image vers la droite afin de garder la zone texte sombre.

### 6. Étape 11 "Paiement" de l'Adhésion — refonte complète
Fichier : `src/pages/client/Adhesion.tsx` (lignes ~1153-1240)
Supprimer l'encart "Coordonnées bancaires SONAM VIE" (banque, RIB, mobile money, référence à indiquer, méthode utilisée, référence/numéro de transaction).

Remplacer par une page **"Choisissez votre moyen de paiement"** :
- En-tête : "Prime annuelle : XX XXX FCFA"
- 3 onglets / cartes cliquables :
  1. **Mobile Money** — grille 2x2 de logos circulaires (Wave, Orange Money, MTN MoMo, Moov Money) à partir des SVG uploadés. Au clic : champ téléphone + bouton "Payer".
  2. **Carte bancaire** — icônes Visa/Mastercard, champs N° carte / Expiration / CVV / Nom porteur (front-end uniquement, paiement simulé).
  3. **Virement bancaire (RIB)** — affiche le RIB SONAM avec bouton "Copier" + champ "Référence de virement effectué" + bouton "J'ai payé".
- Au submit, même logique qu'avant : insert `paiements` (`status: 'pending'`), notification, passage à l'étape suivante.

Copier les 4 SVG opérateurs dans `src/assets/operators/` (wave-circle.svg, orange-circle.svg, mtn-circle.svg, moov-circle.svg) — les fichiers existants `src/assets/operators/*` seront remplacés par les nouveaux SVG circulaires uploadés.

### 7. Étape 13 Signature — retirer la biométrie
Fichier : `src/pages/client/Adhesion.tsx`
- Supprimer toute la branche biométrie (lignes 1290-1316) : ne garder que le bouton "Signer et finaliser" (= comportement actuel `handleSign` sans `verifyBiometricForUser`).
- Retirer l'import `verifyBiometricForUser`, l'état `bioConfirming`, et la fonction `proceedAfterBio` si non utilisée ailleurs.
- Supprimer le champ `biometric_confirmed_at` posé à cette étape (laisser seulement à l'étape paiement si pertinent).

### 8. Landing — supprimer la frise "Souscription → Cotisation → Protection"
Fichier : `src/components/landing/PremiumShowcaseSection.tsx` (ligne 131)
- Supprimer la ligne / le bloc contenant "Souscription → Cotisation annuelle → Protection garantie" et ses icônes parents.

### 9. Simulateur landing — wording
Fichier : `src/components/landing/SimulateurSection.tsx`
- Ligne 245 et 262 : "Frais accessoires" → "Frais additionnels".
- Ligne 249 : "PRIME ANNUELLE TOTALE (PTTC)" → "PRIME ANNUELLE TOTALE".
- Ligne 263 : "= Prime annuelle TTC (PTTC)" → "= Prime annuelle TTC".

### 10. Adhésion — bannière familles défilante
Fichier : `src/pages/client/Adhesion.tsx` (en haut du formulaire, avant le stepper)
- Insérer `<MarketingCarousel className="mb-6" />` (le composant existe déjà et utilise les bannières familles africaines).
- Vérifier que les indicateurs corrigés au point 1 ne masquent pas le texte.

### 11. Responsive — passes ciblées
- Dashboard user : carte hero + carrousel + actions rapides → vérifier breakpoints `sm/md/lg`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Adhésion : stepper horizontal scrollable sur mobile (`overflow-x-auto snap-x`), padding `px-3 sm:px-6`.
- Admin Dashboard / Sinistres / Contrats : envelopper les tableaux dans `overflow-x-auto`, cartes statistiques en `grid-cols-2 lg:grid-cols-4`.
- Landing Header : menu burger mobile déjà présent → vérifier z-index et fermeture au tap.

### Fichiers impactés (récap)

**Modifiés**
- `src/components/client/MarketingCarousel.tsx`
- `src/components/ChatBot.tsx`
- `src/pages/client/Profil.tsx`
- `src/pages/client/Dashboard.tsx`
- `src/pages/client/Paiements.tsx`
- `src/pages/client/Sinistre.tsx`
- `src/pages/client/Adhesion.tsx` (étape paiement + signature + bannière)
- `src/components/landing/PremiumShowcaseSection.tsx`
- `src/components/landing/SimulateurSection.tsx`
- `src/layouts/AdminLayout.tsx` / pages admin (responsive tables)

**Créés**
- `src/assets/operators/wave-circle.svg`, `orange-circle.svg`, `mtn-circle.svg`, `moov-circle.svg` (depuis les SVG uploadés)
- `src/components/payment/PaymentMethodSelector.tsx` — nouveau sélecteur Mobile Money / Carte / Virement utilisé dans l'étape 11 d'Adhésion

### Hors-scope
- Pas de vraie intégration paiement (Stripe/Paddle) — la nouvelle UI carte + mobile money reste en mode déclaratif (insert `paiements` pending), comme l'existant.
- Pas de migration DB.
- Pas de toucher à `kyc-ocr-extract` ni `IdCardScanner`.
