
## Objectif
Fiabiliser la plateforme AssurDignité : corriger les bugs de simulation, garantir la conformité intégrale avec la Note Technique SONAM VIE 26/05/2026, et simplifier définitivement le parcours d'adhésion en 3 étapes.

> Remarque : aucun nouveau document PDF n'est joint à ce message. Je m'appuie sur la Note Technique 26/05/2026 déjà intégrée en mémoire projet. Si vous voulez que j'intègre un autre document, joignez-le et je l'inclurai dans la même itération.

## 1. Bugs de simulation (chiffres figés / incohérences)

Fichier : `src/lib/actuarial-engine.ts`, `src/components/landing/SimulateurSection.tsx`, `src/pages/client/Adhesion.tsx`, `src/lib/mcp/tools/simuler-prime.ts`.

- Recalcul temps réel garanti sur **tous** les inputs (formule, DDN, conjoint, enfants, ascendants, périodicité) via `useEffect` + debounce 200 ms — supprimer tout état `result` non réinitialisé lors du changement de formule.
- Corriger la clé de dépendance du `useEffect` de simulation pour utiliser un hash stable de `enfants` / `ascendants` (JSON.stringify) — sinon React ne détecte pas les mutations in-place et les chiffres restent figés.
- Reset explicite de `simResult` à `null` quand la DDN principale devient invalide (< 18 ou > 64) au lieu d'afficher l'ancien montant.
- Validation d'âge cohérente partout :
  - Principal / conjoint : 18–64 ans ET `âge + durée ≤ 65`
  - Enfants : 0–21 ans
  - Ascendants : 0–89 ans ET `âge + durée ≤ 90`
- Coefficients de périodicité (Note Technique) appliqués uniformément côté simulateur landing, adhesion, et outil MCP :
  - `PAC' = PAC + 2 500`
  - `PSC = 0,51 × PAC + 1 500`
  - `PTC = 0,26 × PAC + 1 000`
  - `PMC = 0,087 × PAC + 500`
- Ristourne : 30 % de la prime **de l'assuré principal** (pas des primes cumulées) restituée si aucun sinistre sur 3 ans — libellé UI + PDF + CG article 6 alignés.
- Gestion des inputs vides d'enfants / ascendants sans crash (filtrage `dob` valide avant appel moteur).

## 2. Parcours adhésion — 3 étapes définitives

Confirmer et durcir la structure existante :

```text
Étape 1 — Simulation            (formule + famille + prime live)
Étape 2 — Informations & bénéficiaires (KYC + santé compacte + bénéficiaires)
Étape 3 — Signature & paiement  (CG+CP + signature + Orange/MoMo/Wave/Moov)
```

Améliorations :
- Barre d'étapes : icônes parfaitement centrées mobile + desktop (flex `justify-center items-center`, largeurs égales, connecteur `flex-1` centré verticalement) — comme la capture fournie.
- Étape 1 : chaque carte formule affiche 3–4 avantages clés (nature) directement visibles, pas seulement au hover.
- Étape 2 : retirer la mention « et ne sont pas stockées » du bandeau IA (les images sont bien uploadées) → « Vos images sont traitées par notre IA de manière sécurisée. »
- Étape 2 (bénéficiaires 30 %) : retirer « laissez vide pour désigner… » et remplacer par un champ obligatoire avec valeur par défaut suggérée « Héritiers légaux » modifiable.
- Étape 2 (santé) : question unique « Êtes-vous en bonne santé ? » avec 6 sous-questions dépliables si « Non ».
- Étape 3 : afficher **Conditions Générales + Conditions Particulières** (2 blocs distincts, 2 cases à cocher, PDF téléchargeable pour chaque).
- Persistance de l'étape en `sessionStorage` (déjà présente) + reprise propre après refresh.

## 3. Conformité Note Technique 26/05/2026 (rappel des valeurs verrouillées)

- Formules : A 1,5 M / B 2 M / C 3 M / D 5 M FCFA (70 % nature + 30 % espèces).
- Paiement annuel par défaut, périodicités PAC'/PSC/PTC/PMC disponibles.
- Contacts SONAM VIE : 27 20 31 71 82 / 05 95 45 21 65 — `servicecommercialsonamvie@sonam.ci`.
- Table de mortalité CIMA H, taux technique et chargements conformes au moteur actuariel actuel.
- Manifest MCP + tool `simuler_prime` re-déployés avec les mêmes règles.

## 4. Autres corrections plateforme

- OCR CNI : passer le worker Tesseract en mode `fast` (langue `fra` seule, `tessedit_pageseg_mode=6`, image redimensionnée à 1600 px max avant OCR) → gain ~40 % de latence.
- Signature canvas : fix redimensionnement (ResizeObserver + rescale du contenu) pour éviter la perte du tracé lors du passage mobile/desktop.
- Paiement mobile money : messages d'erreur explicites (timeout, PIN refusé, solde insuffisant) au lieu du générique.
- Validation finale (`adhesion-validation.ts`) : messages regroupés par étape avec bouton « Corriger » qui saute directement au champ manquant.
- Chatbot FAQ : mise à jour des réponses avec les nouvelles limites d'âge et la règle ristourne.
- Audit rapide RLS Lovable Cloud sur `contracts`, `beneficiaires`, `assures_complementaires`, `paiements` (lecture/écriture scopées `auth.uid()`).

## Fichiers impactés (aucune migration DB)

- `src/lib/actuarial-engine.ts`
- `src/lib/adhesion-validation.ts`
- `src/lib/mcp/tools/simuler-prime.ts`
- `src/components/landing/SimulateurSection.tsx`
- `src/components/adhesion/UnifiedProgressBar.tsx`
- `src/pages/client/Adhesion.tsx`
- `src/components/kyc/IdCardScanner.tsx` (OCR)
- `src/components/payment/PaymentMethodSelector.tsx`
- `supabase/functions/mcp/index.ts` (redeploy)
- `.lovable/mcp/manifest.json`

## Validation
- Simulation : test 6 profils (jeune seul, couple, famille 3 enfants, avec 2 ascendants 85 ans, diaspora D, senior 63 ans) → prime cohérente, chiffres jamais figés.
- Adhesion : run Playwright headless bout-en-bout (3 étapes) + screenshots.
- Vérif build + typecheck automatiques.
