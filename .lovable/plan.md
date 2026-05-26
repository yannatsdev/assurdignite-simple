
## Objectif

Ajouter une bannière horizontale animée façon "carousel marquee" (cartes sombres défilant en boucle continue, image en fond, badge icône en haut à gauche, tag "AssurDignité" en haut à droite, titre + description en bas), inspirée des captures fournies mais aux couleurs et messages de SONAM Vie / AssurDignité.

## Nouveau composant : `BrandShowcaseMarquee.tsx`

Emplacement : `src/components/landing/BrandShowcaseMarquee.tsx`

Caractéristiques :
- Rangée horizontale de 6 cartes ~ 380×260 px, fond image avec dégradé sombre, coins arrondis `rounded-3xl`, ring subtil violet.
- Défilement continu (CSS keyframes `marquee` + duplication de la liste) — vitesse ~ 40 s, pause au hover.
- Bord gauche/droit estompé (mask gradient) pour effet "fading edges".
- Animation d'apparition `whileInView` (fade + translate).
- Sur mobile : cartes plus petites (260×220 px), même animation.

Carte (structure) :
```
┌─────────────────────────────┐
│ [icon]        • AssurDignité│
│                              │
│   (image famille africaine) │
│                              │
│  Titre éditorial (Fraunces) │
│  Sous-titre court (DM Sans) │
└─────────────────────────────┘
```

Cartes (6) — réutilisent les visuels existants `src/assets/banners/*`:
1. **Heart** — "Familles unies" / "Principal + conjoint + 4 enfants + 2 ascendants"
2. **Sparkles** — "Dignité préservée" / "70 % prestations nature + 30 % cash"
3. **Clock** — "Versement < 12 h" / "Capital débloqué rapidement après dossier"
4. **Award** — "Bonus Fidélité 30 %" / "3 ans sans sinistre = primes restituées"
5. **Globe** — "Diaspora couverte" / "Rapatriement & assistance funéraire"
6. **ShieldCheck** — "Porteur CIMA" / "SONAM Vie, sécurité réglementaire"

## Intégrations

- **Landing (`src/pages/Index.tsx`)** : insérer `<BrandShowcaseMarquee />` entre `<CiblesSection />` et `<PremiumShowcaseSection />`, fond `bg-muted/20`, padding `py-16`.
- **Dashboard client (`src/pages/client/Dashboard.tsx`)** : insérer une version compacte (`variant="compact"`, hauteur 200 px) sous `ClientHeroBanner`/`MarketingCarousel` existant.
- **Dashboard admin (`src/pages/admin/Dashboard.tsx`)** : même version compacte en bas du header admin pour cohérence de marque.

## Détails techniques

- Pas de nouvelles dépendances : utiliser `framer-motion` (déjà présent) + CSS keyframes Tailwind.
- Ajouter dans `tailwind.config.ts` :
  ```
  marquee: { '0%': {transform:'translateX(0)'}, '100%': {transform:'translateX(-50%)'} }
  animation: { marquee: 'marquee 40s linear infinite' }
  ```
- Respect `prefers-reduced-motion` (animation paused).
- Tokens design system : `bg-card`, `text-foreground`, accents `primary` (violet SONAM) et `secondary` (green).
- Aucune modification de logique métier ni de base de données.

## Fichiers touchés

- Créé : `src/components/landing/BrandShowcaseMarquee.tsx`
- Modifié : `tailwind.config.ts` (keyframes/animation marquee)
- Modifié : `src/pages/Index.tsx`, `src/pages/client/Dashboard.tsx`, `src/pages/admin/Dashboard.tsx`
