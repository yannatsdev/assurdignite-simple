## Objectif

Remplacer les 6 images du composant `BrandShowcaseMarquee` (section "Une protection pensée pour vous") par des visuels inédits, afin d'éviter toute répétition avec :
- HeroSection (hero-family, hero-family-2/3/4)
- MarketingCarousel client (banners/family-united, family-elderly, family-mother, fast-payout)
- Autres sections existantes

## Approche

Générer 6 images photo-réalistes uniques via `imagegen` (qualité `standard`, format paysage 1280×800), chacune illustrant un thème distinct cohérent avec AssurDignité / SONAM Vie. Style : photographie éditoriale africaine premium, lumière chaude, ton éditorial dignifiant.

| # | Thème carte | Visuel à générer |
|---|---|---|
| 1 | Souscription mobile | Main africaine tenant un smartphone affichant une interface d'assurance, lumière douce de bureau |
| 2 | Accompagnement humain | Conseillère SONAM en costume parlant chaleureusement avec un couple ivoirien en agence |
| 3 | Assistance funéraire dignifiée | Mains jointes en soutien, fleurs blanches, ambiance recueillie et respectueuse |
| 4 | Capital famille / billets FCFA | Famille africaine prospère à la maison, ambiance sereine et lumineuse, plan large salon |
| 5 | Diaspora / rapatriement | Avion au crépuscule au-dessus d'un aéroport africain, valise et passeport au premier plan |
| 6 | Signature de contrat clair | Gros plan main signant un document d'assurance avec stylo et tablette, bureau moderne |

## Implémentation

1. Générer 6 fichiers dans `src/assets/marquee/` :
   - `souscription-mobile.jpg`
   - `conseiller-agence.jpg`
   - `assistance-recueillie.jpg`
   - `famille-serenite.jpg`
   - `diaspora-avion.jpg`
   - `signature-contrat.jpg`

2. Modifier `src/components/landing/BrandShowcaseMarquee.tsx` :
   - Remplacer les 6 imports d'images existants par les nouveaux
   - Conserver les icônes, titres et textes actuels (déjà différenciés)

## Fichiers touchés

- Créés : 6 fichiers dans `src/assets/marquee/`
- Modifié : `src/components/landing/BrandShowcaseMarquee.tsx`

Aucune autre section, aucune logique métier ni base de données affectée.