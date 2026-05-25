
## Objectif
Ajouter le composant **Typewriter**, élever la typographie/design (réf. image Safeon), et compléter les zones incomplètes en alignant 100% du contenu sur les 2 documents officiels (Fiche Produit V03 + Processus Sinistres).

## 1. Nouveau composant UI
- **`src/components/ui/typewriter.tsx`** — composant fourni (corrigé : JSX wrappers `<span>` reconstruits, `framer-motion` déjà installé donc pas d'install).
- Intégration dans **`HeroSection.tsx`** : titre principal avec mot final qui s'écrit en boucle (ex: « Une assurance obsèques pour… [votre famille | vos parents | la diaspora | toute une vie] »).

## 2. Refonte typographique (inspirée image Safeon)
- **`src/index.css`** : importer 2 nouvelles polices Google Fonts pour rivaliser avec Safeon — **Fraunces** (display serif éditorial pour gros titres) + maintenir **DM Sans** en corps. Conserver Playfair pour signatures secondaires.
- Nouveau token `font-editorial` → Fraunces. Appliquer aux H1 landing, héros client, titres formules.
- Augmenter `tracking-tight`, `leading-[1.05]` sur titres XL, italique sur mot clé (motif Safeon : « peace **of mind** »).
- Ajouter soulignement décoratif SVG « wavy » sous un mot clé du H1 (réf. image : « mind » souligné).

## 3. Hero landing — refonte façon Safeon
- Layout bento : grosse colonne titre + 2 cartes empilées à droite (visuel famille, badge « Protection fiable », mini-carte support).
- Boutons façon Safeon : pill blanc + avatar group + flèche.
- Bannière secondaire pleine largeur sur fond violet/sombre avec gros titre serif + stats (« 50 000+ familles », « < 12h paiement »).

## 4. Compléter les parties incomplètes avec contenu officiel

### a) Section Formules (`FormulesSection.tsx`)
Aligner sur la fiche officielle :
- A – **Essentielle** 1 500 000 (Nature 1 050 000 / Cash 450 000)
- B – **Standard** 2 000 000 (1 400 000 / 600 000)
- C – **Premium** 3 000 000 (2 100 000 / 900 000)
- D – **Excellence Diaspora** 5 000 000 (3 500 000 / 1 500 000)

Renommer partout dans l'app (mapping `FORMULE_NAMES` dans `PolicyHeroCard.tsx`, simulateur, contrats, admin).

### b) Page Sinistre client (`Sinistre.tsx` + `SinistreSuivi.tsx`)
Refléter les 8 étapes officielles :
1. Déclaration · 2. Pré-validation · 3. Activation assistance (<1h contact, <2h prestataire) · 4. Constitution dossier · 5. Validation SONAM · 6. Cash MoMo (<12h) · 7. Prestations nature · 8. Clôture.
- Ajouter liste pièces obligatoires : acte décès, certificat médical, CNI défunt, CNI bénéficiaire, n° MoMo.
- Canaux déclaration : app 24/24, hotline, WhatsApp, agence, réseau commercial.
- Badge SLA cible (<1h accusé, <12h cash, <4h activation).

### c) Page Souscrire / Adhesion
Aligner le stepper sur le parcours officiel 7 étapes (téléchargement → formule → KYC bio → bénéficiaires → CG/CP → paiement → activation).

### d) Section Avantages / PremiumShowcase
Ajouter les 6 arguments commerciaux officiels (Dignité, Rapidité, Sérénité, Fidélité 30%, 100% digital, Famille élargie incl. ascendants 90 ans).

### e) Section FAQ
Compléter avec : exclusions (carence, fraude, suicide CG, guerre), conditions d'éligibilité (18–59 ans AP, ascendants ≤90 ans), questionnaire médical, bonus 30% conditions.

### f) Footer / Conditions
Mentions officielles : « Produit soumis au Code CIMA. Porteur de risque : SONAM Vie. Concepteur : AIF SARL. »

### g) Admin — page Sinistres
Ajouter les statuts officiels du workflow (Déclaré → Pré-validé → Assistance activée → Dossier constitué → Validé SONAM → Cash payé → Nature exécutée → Clôturé) + escalade niveaux 1/2/3 + KPIs cibles (>95% SLA, >90% satisfaction, <12h cash).

## 5. Mentions ChatBot
Mettre à jour le system prompt edge function `chat-ai` avec les contenus officiels (formules exactes, SLA, exclusions, partenaires) pour réponses 100% fiables.

## 6. Détails techniques
- Pas de migration DB nécessaire (uniquement contenu + UI).
- `framer-motion` déjà présent — confirmer via package.json sinon installer.
- Aucune logique métier modifiée (moteur actuariel CIMA H inchangé).
- Responsive : nouveau hero testé 375 / 768 / 1024 / 1440.

## Fichiers impactés
**Créés** : `src/components/ui/typewriter.tsx`
**Modifiés** : `src/index.css`, `tailwind.config.ts`, `HeroSection.tsx`, `FormulesSection.tsx`, `PremiumShowcaseSection.tsx`, `FAQSection.tsx`, `Footer.tsx`, `Sinistre.tsx`, `SinistreSuivi.tsx`, `Adhesion.tsx`, `pages/admin/Sinistres.tsx`, `PolicyHeroCard.tsx` (mapping noms formules), `supabase/functions/chat-ai/index.ts`.
