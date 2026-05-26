
## Plan d'amélioration AssurDignité

### 1. Hero Section — visibilité des images
Le dégradé `bg-gradient-hero` est trop opaque, on ne voit plus les familles africaines.
- Remplacer l'overlay plein par un dégradé directionnel plus léger : `bg-gradient-to-r from-black/75 via-black/40 to-transparent` + voile violet doux `from-primary/30` en haut.
- Garder une lisibilité texte grâce à un `drop-shadow` renforcé sur h1/p et un fond glassmorphism léger derrière le badge.
- Ajouter un léger zoom Ken Burns (déjà présent) sans assombrir.

### 2. Composant Typewriter
- Créer `src/components/ui/typewriter.tsx` (version corrigée du snippet — le JSX manquait, on remet `<span>` wrapper + cursor `motion.span`).
- Intégrer dans le H1 du Hero : ligne fixe "Votre Assurance Obsèques" puis Typewriter qui défile : `["SONAM VIE", "Digne", "Rapide < 12h", "100% Famille", "Bonus 30%"]` en `text-sonam-green`.
- `framer-motion` est déjà installé (utilisé partout) — pas de nouvelle dépendance.

### 3. Alignement complet sur la Fiche Produit officielle
Compléter les contenus manquants identifiés dans les PDF :

**a) FormulesSection** — vérifier que les 4 formules affichent bien : Capital total, Nature 70 %, Cash MoMo 30 %, positionnement (Accessible / Équilibrée / Renforcée / Haut de gamme).

**b) Nouvelle section `GarantiesSection`** sur la landing avec les 7 garanties officielles (Décès toutes causes, Capital décès, Assistance funéraire, Paiement rapide, Assistance renforcée, Rapatriement diaspora, Garantie accident optionnelle).

**c) Nouvelle section `CiblesSection`** (4 segments : Particuliers, Secteur informel, Diaspora, Groupes) avec icônes Lucide + bento grid.

**d) `ConditionsSection`** — ajouter les conditions d'âge officielles : AP 18–59 ans, AG 0–90 ans, Ascendants ≤ 90 ans, questionnaire médical possible, KYC obligatoire, prime à jour, délai de carence.

**e) Footer / page À propos** — préciser : Porteur de risque SONAM Vie, Concepteur AIF SARL, Plateforme AssurDignité, Zone Côte d'Ivoire + Diaspora, agréé CIMA.

**f) Page Sinistre client (`src/pages/client/Sinistre.tsx`)** — afficher le processus 8 étapes officiel (Déclaration → Pré-validation → Activation → Constitution → Validation SONAM → Cash MoMo → Prestations Nature → Clôture) avec SLA (< 1h prise en charge, < 12h cash, 2–4h logistique). Pièces obligatoires listées : Acte de décès, certificat médical, pièces d'identité défunt et bénéficiaire, coordonnées Mobile Money. Canaux de déclaration : Application, Hotline 24/24, Agence, Réseau, WhatsApp.

**g) Section "Bonus Fidélité"** — rappeler taux 30 % de la prime AP après 3 années consécutives sans sinistre.

**h) Moyens de paiement** — s'assurer que la grille affiche Orange Money, MTN, Moov, Wave + Carte bancaire (Diaspora).

**i) Exclusions** — ajouter section/accordion : carence, fraude, impayé, suicide selon CG, guerre/émeutes.

**Remplacement systématique** : toute mention `IMPACT.02` / `IMPACT0.2` dans le code et les contenus → `AssurDignité` (recherche `rg -i "impact"` puis remplacement ciblé).

### 4. Détails techniques
- Aucune migration DB requise.
- Pas de nouvelle dépendance npm.
- Tout en composants frontend, design tokens existants (primary violet, sonam-green, sonam-blue).
- Responsive : sections en `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.

### Fichiers
- **Créés** : `src/components/ui/typewriter.tsx`, `src/components/landing/GarantiesSection.tsx`, `src/components/landing/CiblesSection.tsx`.
- **Modifiés** : `src/components/landing/HeroSection.tsx` (overlay + Typewriter), `src/components/landing/FormulesSection.tsx`, `src/components/landing/ConditionsSection.tsx`, `src/components/landing/Footer.tsx`, `src/pages/Index.tsx` (ordre des sections), `src/pages/client/Sinistre.tsx` (processus 8 étapes + pièces + canaux), recherche/remplacement `IMPACT` → `AssurDignité`.

Approuve pour que je passe à l'implémentation.
