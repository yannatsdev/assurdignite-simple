# Plan — Mise à jour tarifs Excel v2, suppression KkiaPay, chatbot intelligent, responsive

## 1. Nouveau barème actuariel (Excel v27/04/2026 — fichier "maintenance_fees_2")

Le fichier de référence est `ASSUR_DIGNITE_v27042026_maintenance_fees_2.xlsm`. Comparaison avec l'ancien barème (cas type principal 42 ans / conjoint 42 / 1 enfant 15 / 1 ascendant 55, formule A) :

| Rôle      | Ancienne prime | Nouvelle prime | Δ      |
|-----------|----------------|----------------|--------|
| Principal | 20 877,65      | 21 325,89      | +2,15% |
| Conjoint  | 20 877,65      | 21 325,89      | +2,15% |
| Enfant    | 4 601,46       | 4 652,71       | +1,11% |
| Ascendant | 28 090,12      | 28 714,27      | +2,22% |
| **PTTC formule A** | **76 946,88** | **78 518,76** | +2,04% |

### Mise à jour de `src/lib/actuarial-engine.ts`

Recalibrer les facteurs `LOADING` pour refléter exactement les nouveaux primes Excel v2 :

```ts
const LOADING = {
  principal: 2.06518,
  conjoint:  2.06518,
  enfant:   10.09274,
  ascendant: 1.61309,
};
```

Paramètres confirmés inchangés : `FC = 0.002`, `FA = 0.15`, `FRAIS_ANNUAL = 2500`, `v = 0.966184`.

Capitaux par formule (Excel `Options`) — inchangés (A 1.5M, B 2M, C 3M, D 5M ; conjoint = principal ; enfant 500k ; ascendant 1.05M / 1.4M / 2.1M / 3.5M).

Ce changement se propage automatiquement à :
- Simulateur landing (`SimulateurSection.tsx`)
- Adhésion client (`pages/client/Adhesion.tsx`, étape 1)
- Outils admin
- PDF police, reçu, conditions particulières

Tests de non-régression : valider que `simulatePrime({A, P=42, C=42, E=15, Asc=55})` renvoie ≈ 78 519 FCFA (Excel v2).

### Cohérence FormulesSection / SimulateurSection

Mettre à jour les primes affichées dans `FormulesSection.tsx` (cartes A/B/C/D) avec les nouveaux totaux Excel v2 (78 519 / 99 807 / 142 385 / 227 540 FCFA) en exemple de prime famille standard.

## 2. Suppression complète de KkiaPay

L'intégration KkiaPay ne fonctionne pas en production. Suppression complète :

**Fichiers à supprimer** :
- `src/components/KkiapayWidget.tsx`
- `supabase/functions/kkiapay-config/index.ts`
- `supabase/functions/kkiapay-webhook/index.ts`

**Fichiers à modifier** :
- `src/pages/client/Adhesion.tsx` — étape "Paiement" : remplacer le widget par un écran de confirmation hors-ligne avec consigne d'appel commercial + bouton "Marquer comme à payer plus tard" qui crée le contrat en statut `pending_payment`.
- `src/pages/client/Paiements.tsx` — retirer toute référence Kkiapay ; afficher uniquement les paiements existants en base.

**Nouveau flux paiement** (étape adhésion 12) :
- Affichage du montant total
- Bloc instructions : virement bancaire SONAM VIE OU paiement en agence (Plateau, Trade Center) OU contact commercial (27 20 31 71 82)
- Bouton "Confirmer ma souscription (paiement à régulariser)" → crée le contrat statut `pending_payment`, crée un paiement statut `pending` méthode `manual`
- L'admin valide ensuite le paiement dans `Finances` admin (status → `paid`), ce qui déclenche le trigger DB existant `on_paiement_status_change` qui passe le contrat à `active`.

Aucune migration de table nécessaire — les statuts existent déjà.

## 3. Chatbot — corriger la logique et le rendre intelligent

**Problème** : le bot répond systématiquement "Contactez le 27 20 31 71 82… venez nous voir au Plateau… je vous invite à nous contacter…" au lieu d'aider à la souscription en ligne.

### Refonte du prompt système (`supabase/functions/chat-ai/index.ts`)

Nouveau `BASE_PROMPT` :
- Présenter AssurDignité comme une plateforme **100% digitale** où l'utilisateur peut souscrire en ligne en quelques minutes via "Mon Espace".
- Expliquer le **processus d'inscription en 14 étapes** quand on demande "comment souscrire" :
  1. Créer son compte → `/login`
  2. Lancer la simulation et choisir une formule (A/B/C/D)
  3. KYC : pièce d'identité + selfie biométrique
  4. Renseigner conjoint(e), enfants (≤21 ans), ascendants (≤79 ans)
  5. Désigner les bénéficiaires
  6. Choisir les prestations en nature
  7. Compléter le questionnaire médical
  8. Lire et accepter les Conditions Générales
  9. Régler la première prime annuelle (paiement en agence ou par virement, ou contact commercial)
  10. Recevoir police d'assurance + reçu téléchargeables dans son espace
- Donner des **réponses concrètes** sur formules, capitaux, exclusions, bonus fidélité, délai de paiement (<12h), répartition 70/30.
- Ne renvoyer vers le téléphone/agence **qu'en dernier recours** (cas hors champ : sinistre en cours, demande de modification de contrat existant, problème technique grave).
- Inclure systématiquement un lien d'action (`/login`, `/#simulateur`, `/#formules`) à la fin de chaque réponse.
- Toujours utiliser la table FAQ active (`chatbot_faqs`) en priorité.

### Améliorer le composant `src/components/ChatBot.tsx`

- Ajouter des suggestions plus riches : "Comment souscrire ?", "Quelles formules ?", "Quel prix pour ma famille ?", "Délai de paiement", "Bonus fidélité", "Documents nécessaires".
- Ajouter des **boutons d'action contextuels** dans la réponse : si le bot mentionne souscription → bouton "Commencer ma souscription" qui ouvre `/login`. Si simulation → bouton "Ouvrir le simulateur".
- Optimiser le scroll mobile et les hauteurs (max-h responsive).

## 4. Header mobile — toutes les infos visibles

Dans `src/components/landing/Header.tsx`, la barre top contact tronque sur mobile. Refonte :
- Sur mobile (< sm) : afficher téléphone + email sur 2 lignes condensées (icônes + valeurs cliquables `tel:`/`mailto:`), avec scroll horizontal supprimé.
- Adresse Plateau visible dès `md` (déjà ok).
- Layout : passer la top bar en `flex-col gap-1 py-1.5` sur mobile, `flex-row h-9` sur sm+.

## 5. Hero section — descendre la box texte

Dans `src/components/landing/HeroSection.tsx` :
- Ajouter `mt-6 sm:mt-10` au bloc `<motion.div>` qui contient badge/titre/description (lignes 102-116) pour le descendre légèrement.
- Augmenter le `pt-28 sm:pt-32` à `pt-32 sm:pt-40` sur la section pour libérer de la place sous le header.
- Garder l'animation slider (4 slides existants).

## 6. Responsive global — site + plateforme

Audit et corrections sur tous les breakpoints (375, 414, 768, 1024, 1280) :

### Landing
- `FormulesSection` : aligner hauteur des cartes (`flex flex-col h-full` + bouton CTA collé en bas avec `mt-auto`).
- `AvantagesSection` : grilles `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` cohérentes.
- `SimulateurSection` : passer le grid principal en `lg:grid-cols-2` (déjà ok), réduire padding mobile.
- `Footer` : colonnes en `grid-cols-2 lg:grid-cols-4` avec gap consistant.

### Espace client
- `ClientLayout` : sidebar drawer mobile (Sheet) + topbar avec logo compact + menu hamburger.
- `Adhesion.tsx` : la barre de progression (14 étapes) doit scroller horizontalement sur mobile sans casser la mise en page. Étapes en cartes empilées.
- `Documents.tsx`, `Paiements.tsx`, `Sinistre.tsx` : tableaux responsifs (`overflow-x-auto` + version cards mobile).

### Espace admin
- `AdminLayout` / `AdminSidebar` : drawer mobile, logos compactés à l'icône SONAM seule en collapsed.
- `Reporting.tsx` : graphiques Recharts en `ResponsiveContainer` (déjà), KPIs en `grid-cols-2 lg:grid-cols-4`.
- `Utilisateurs.tsx`, `Contrats.tsx`, `Finances.tsx`, `Sinistres.tsx` : tables avec wrapper `overflow-x-auto`, colonnes secondaires cachées sur mobile (`hidden md:table-cell`).

### Polissage design global
- Boutons : tailles homogènes (`h-10 sm:h-11`).
- Cartes : ombres et radius cohérents (`rounded-xl shadow-md hover:shadow-lg transition`).
- Inputs : déjà 16px sur mobile (anti-zoom iOS) — vérifier sélecteurs.
- Animations Framer Motion respectent `prefers-reduced-motion`.

## 7. Améliorations dashboard utilisateur

- `pages/client/Dashboard.tsx` : carte "Prochaine prime" avec date et montant ; carte "État du contrat" avec badge couleur ; raccourcis "Déclarer un sinistre", "Mes bénéficiaires", "Télécharger ma police".
- Ajouter compteur "Bonus fidélité" (années sans sinistre / 3 ans).
- Notifications panel (utilise table `notifications` existante) avec realtime.

## 8. Améliorations dashboard admin

- `pages/admin/Dashboard.tsx` : KPIs live (contrats actifs, primes encaissées du mois, sinistres en cours, taux de transformation).
- Ajouter graphique "Évolution mensuelle des contrats" (12 mois glissants) à partir de `contracts.created_at`.
- Liste "Derniers contrats" + "Derniers paiements en attente" avec actions rapides.
- Bouton "Valider paiement" sur les paiements `pending` qui passe en `paid` (le trigger DB activera le contrat).
- Quick action : générer rapport PDF (déjà dans `Reporting.tsx`, ajouter raccourci dashboard).

## 9. Suppression mémoire / config

- Supprimer la mention "KkiaPay" du chatbot et des FAQ par défaut.
- Mettre à jour la mémoire projet (`mem://features/structure`) pour refléter la suppression de KkiaPay et le flux paiement manuel.

## Détails techniques

### Fichiers principaux modifiés
- `src/lib/actuarial-engine.ts` — nouveaux LOADING
- `src/components/landing/Header.tsx` — top bar mobile
- `src/components/landing/HeroSection.tsx` — décalage box
- `src/components/landing/FormulesSection.tsx` — primes mises à jour, alignement
- `src/components/landing/SimulateurSection.tsx` — micro-ajustements UI
- `src/components/ChatBot.tsx` — suggestions + boutons d'action
- `src/pages/client/Adhesion.tsx` — étape paiement réécrite, retire KkiapayWidget
- `src/pages/client/Paiements.tsx` — retire KkiaPay
- `src/pages/client/Dashboard.tsx` — refonte cartes + bonus fidélité
- `src/pages/admin/Dashboard.tsx` — KPIs live + actions rapides
- `src/layouts/ClientLayout.tsx`, `src/layouts/AdminLayout.tsx` — responsive
- `src/components/admin/AdminSidebar.tsx`, `src/components/client/ClientSidebar.tsx` — drawer mobile
- `src/index.css` — ajustements responsive

### Fichiers supprimés
- `src/components/KkiapayWidget.tsx`
- `supabase/functions/kkiapay-config/index.ts`
- `supabase/functions/kkiapay-webhook/index.ts`

### Fonctions edge mises à jour
- `supabase/functions/chat-ai/index.ts` — nouveau prompt + boutons d'action côté client

### Aucune migration DB requise
Les statuts `pending_payment` / `pending` / `paid` existent déjà, le trigger `on_paiement_status_change` fonctionne déjà.

## Ordre d'exécution
1. Mise à jour `actuarial-engine.ts` (nouveau barème) + `FormulesSection`
2. Suppression KkiaPay (fichiers + références)
3. Réécriture étape paiement Adhésion (mode manuel)
4. Refonte chatbot (prompt + UI suggestions/actions)
5. Header mobile + Hero box
6. Responsive landing (Formules, Avantages, Footer, Simulateur)
7. Responsive espace client (layout, Adhésion, Documents, Paiements)
8. Responsive espace admin (layout, sidebars, tables)
9. Refonte Dashboard client + admin
10. Build + vérification console
