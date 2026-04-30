## Objectif

Upgrader visuellement l'espace client (Dashboard, Contrats, Profil, Sinistre) au niveau "premium insurance app" inspiré de l'image 5, intégrer les bannières familles africaines (images 6 & 7) sur la landing **et** dans l'espace client, et ajouter dans **Profil** un scanner OCR pour pré-remplir automatiquement les informations personnelles (l'OCR existe déjà à l'étape 3 de l'adhésion).

## Note sur la librairie demandée

`@paper-design/shaders-react` (MeshGradient, PulsingBorder) est une librairie WebGL lourde (~500 ko) et instable sur mobile bas de gamme — risque sur le marché ivoirien. Je vais reproduire le rendu "shader premium" avec nos composants existants (`Sparkles` canvas + dégradés animés CSS `gradient-x` + `framer-motion`), zéro dépendance ajoutée. Si tu veux quand même la vraie lib shader, dis-le et je l'installe.

## Plan d'exécution

### 1. Nouvelle carte hero "Policy Card" premium (Dashboard)
Inspirée de la "Car Insurance Card" violette de l'image 5.
- Carte arrondie 3xl, dégradé violet animé (`animate-gradient-x`), motifs de cercles concentriques en background SVG, glassmorphism intérieur
- Affichage : numéro de police, formule, capital, prime, expiration, bouton "Renouveler / Voir détails"
- Si pas de contrat → variante "Souscrire maintenant" avec bannière `family-united.jpg` en background floutée
- Animation d'apparition framer-motion + halo `Sparkles` discret

### 2. Section "Health & Wellness" → "Mes Garanties" (Dashboard)
Cartes horizontales scrollables (style image 5 : Health/Bike/Home/Travel) :
- Couverture Principal, Conjoint, Enfants, Ascendants
- Chaque carte = pastille colorée + icône + count + capital
- `overflow-x-auto snap-x` pour mobile, grille sur desktop

### 3. Bannière marketing "AssurDignité" dans le dashboard
Carrousel auto-play (3 slides) utilisant les 4 bannières familles existantes (`family-united`, `family-elderly`, `family-mother`, `family-pro`) avec textes superposés :
- "Familles unies, protégées ensemble"
- "Dignité jusqu'au dernier souffle"
- "Bonus Fidélité jusqu'à 30%"
- Auto-rotation 5s, indicateurs, animations fade

### 4. Page Contrats — refonte visuelle
- Empty state premium : illustration + bannière `family-united` + CTA "Souscrire" coloré
- Cartes contrat redesignées comme la "Policy Card" du dashboard (mini-version), avec QR code de la police (lib `qrcode` déjà ?? sinon SVG simple) pour l'identifier rapidement
- Animations stagger d'apparition

### 5. Page Profil — nouvelle section OCR + design premium
- Header avec bannière `family-pro.jpg` en background flou + avatar circulaire glassmorphism par-dessus
- **Nouveau bloc "Remplissage automatique" en haut du profil** :
  - Bouton "📷 Scanner ma pièce d'identité pour pré-remplir"
  - Réutilise le composant `IdCardScanner` existant
  - Sur extraction OK → pré-remplit `full_name` (= first_name + last_name), pas de champ DOB/CNI sur profil donc juste full_name + toast de confirmation
  - Option : étendre la table `profiles` pour stocker `date_of_birth`, `id_document_number`, `id_document_type` → migration SQL
- Cartes Notifications + Sécurité avec design premium (icônes colorées, hover scale)

### 6. Page Sinistre — touches premium
- Stepper redesigné : pastilles numérotées avec connecteurs animés (au lieu des 4 boutons actuels)
- Bannière de réassurance en haut : "Versement < 12h" avec image `fast-payout.jpg`
- Étape "Confirmation" : confettis discrets + bannière succès animée

### 7. Composant réutilisable `ClientHeroBanner`
Nouveau composant `src/components/client/ClientHeroBanner.tsx` :
- Props : `image`, `title`, `subtitle`, `cta?`
- Glassmorphism + dégradé sombre + animation entrée
- Utilisé sur Dashboard, Contrats vide, Sinistre, Profil

### 8. Composant `MarqueeBanner` réutilisable
Bandeau défilant (trust indicators) : "Agréé CIMA · Versement < 12h · 50 000+ familles protégées · Paiement sécurisé"
- Utilise le composant `Marquee` existant
- Ajouté en haut du Dashboard et de Souscrire

### 9. Migration DB (pour OCR profil étendu)
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS id_document_type text,
  ADD COLUMN IF NOT EXISTS id_document_number text;
```

### 10. Animations & cohérence
- Tous les nouveaux blocs : `motion.div` avec `whileInView` stagger
- Hover : `hover:-translate-y-0.5 hover:shadow-premium`
- Sparkles canvas léger (density=30) sur les hero cards uniquement (perf mobile)
- Respect du token couleur SONAM VIE : violet `#4A0E78` + vert `#6AB04C`

## Fichiers impactés

**Créés**
- `src/components/client/ClientHeroBanner.tsx`
- `src/components/client/PolicyHeroCard.tsx`
- `src/components/client/MarketingCarousel.tsx`
- `src/components/client/TrustMarquee.tsx`

**Modifiés**
- `src/pages/client/Dashboard.tsx` — refonte hero + carrousel + garanties
- `src/pages/client/Contrats.tsx` — empty state + cartes premium
- `src/pages/client/Profil.tsx` — bannière header + bloc OCR + cartes redesignées
- `src/pages/client/Sinistre.tsx` — stepper + bannière réassurance

**Migration**
- Extension table `profiles` (3 colonnes nullable, sûr)

## Hors-scope (je ne touche pas)

- Landing page : déjà refondue lors des tours précédents (PremiumShowcase, FamilyBanner). Sauf si tu confirmes vouloir y ajouter encore plus.
- Espace admin
- Édition de `IdCardScanner` ni de `kyc-ocr-extract` (déjà fonctionnels)
- Pas d'installation de `@paper-design/shaders-react` (sauf demande explicite)
