
# Objectif

Réduire la friction de souscription : passer de **14 écrans** à **3 étapes claires**, corriger les bugs de simulation (chiffres figés), intégrer les mises à jour officielles AssurDignité (Note Technique 26/05/2026), et nettoyer les erreurs de logique.

---

## 1. Parcours d'adhésion en 3 étapes

Remplacer les 14 écrans actuels par un flow condensé, chaque étape regroupant plusieurs sections en accordéons dépliables ou champs conditionnels.

### Étape 1 — « Ma simulation »
Un seul écran, tout est visible/modifiable, la prime se recalcule en direct.
- Choix formule (A/B/C/D) avec cartes visuelles + capitaux.
- Assuré principal : date de naissance.
- Famille (accordéons compacts, optionnels) : conjoint, enfants (0-4), ascendants (0-2).
- Panneau latéral persistant : prime annuelle live + répartition 70/30.
- Bouton unique : **« Continuer avec la formule X — 62 500 FCFA/an »**.

### Étape 2 — « Mes informations »
Tout le KYC + bénéficiaires sur un seul écran découpé en 3 blocs empilés.
- **Bloc identité** : scan CNI (auto-remplissage prénom/nom/DDN/n°) + selfie + coordonnées (email, téléphone, adresse).
- **Bloc famille** (masqué si aucun co-assuré coché en étape 1) : noms + dates pour conjoint/enfants/ascendants déclarés.
- **Bloc bénéficiaires** : au moins un bénéficiaire (nom, lien, quote-part). Bouton « Répartition égale » par défaut.
- Questionnaire médical : compacté en une seule question **« Êtes-vous en bonne santé ? »** + lien « détails » qui déplie les 6 questions uniquement si l'utilisateur répond « non » ou souhaite déclarer.
- Prestations nature / ayants-droit / conditions particulières : **valeurs par défaut appliquées automatiquement** ; lien discret « Personnaliser » pour utilisateurs experts.

### Étape 3 — « Signature & paiement »
- Récapitulatif compact (formule, assurés, prime, bénéficiaires).
- Case unique « J'ai lu et j'accepte les Conditions Générales » + lien pour ouvrir le PDF.
- Signature (canvas tactile).
- Choix moyen de paiement (Orange Money, MTN MoMo, Wave, Moov Money) → paiement immédiat.
- Génération automatique du reçu + contrat PDF téléchargeable.

Le mode « Groupe » (souscription entreprise) devient un flow séparé accessible depuis la landing, sans polluer le parcours particulier.

---

## 2. Bugs de simulation

- **Chiffres figés** : recalculer automatiquement (via `useEffect` sur les inputs) au lieu d'exiger un clic sur « Calculer ». Debounce 300 ms pour éviter les re-renders excessifs.
- **Synchronisation formule ↔ prime** : le changement de formule ne réinitialisait pas `result` proprement. Corriger en recalculant à chaque changement de `option`, `principalDob`, `conjointDob`, `enfants`, `ascendants`, `quoteDate`.
- **Éligibilité ascendants** : la limite d'âge codée est **79 ans**, la Note Technique officielle indique **89 ans**. Corriger dans `actuarial-engine.ts` et dans les validations.
- **Éligibilité principal** : vérifier que la règle « âge + durée ≤ 65 » est bien appliquée (actuellement seule la borne 64 ans est testée).
- **Enfants sans date** : la simulation planta silencieusement si un enfant était ajouté puis laissé vide. Ignorer les entrées incomplètes au lieu de casser.
- **Simulateur landing ↔ adhésion** : passer les paramètres de simulation en query string / store pour éviter que l'utilisateur re-saisisse tout à l'étape 1.

---

## 3. Intégration Note Technique 26/05/2026

- **Ristourne** : corriger le texte partout (CG, chatbot, MCP, landing) → « 30 % de la prime de l'assuré principal restituée si aucun sinistre sur les 3 premières années » (le libellé actuel « 30 % des primes nettes cumulées » est faux).
- **Limites d'âge** : principal/conjoint 18-64, enfants 0-21, ascendants 0-**89** (au lieu de 79). Contrainte `âge + durée ≤ 65 / ≤ 90`.
- **Périodicités** : garder l'annuel par défaut (préférence produit), mais exposer dans la logique actuarielle les coefficients officiels au cas où on active mensuel/trimestriel plus tard :
  - PAC' = PAC + 2 500
  - PSC = 0,51 × PAC + 1 500
  - PTC = 0,26 × PAC + 1 000
  - PMC = 0,09 × PAC + 500
- **Formules PAI ascendants** : la formule corrigée est `PAI_asc = PAP_asc + fc × cap_asc × nbre_asc` (vérifier que le moteur ne double-compte pas).
- Mettre à jour l'outil MCP `simuler-prime` avec les mêmes bornes d'âge et la ristourne corrigée.

---

## 4. Autres bugs / cohérence

- **Store `adhesion-progress`** : réinitialiser à l'entrée du nouveau flow 3-étapes ; l'ancien schéma (14 étapes) va casser localStorage. Prévoir migration ou reset.
- **Validation** : `adhesion-validation.ts` référence les anciens noms d'étapes → réécrire pour les 3 nouvelles.
- **RLS bénéficiaires / assures_complementaires** : vérifier que les nouveaux flux d'insertion (batch en étape 2) respectent bien les policies existantes.
- **PDF contrat** : intégrer la ristourne corrigée, les nouvelles limites d'âge, et le nom actuel des formules.
- **Chatbot FAQs** : mettre à jour les entrées liées à âge ascendants et ristourne.
- **Signature** : bug connu où le canvas se vide sur resize mobile → capturer en dataURL dès la fin du trait.
- **Paiement** : gérer l'échec MoMo (timeout, code erreur) avec message clair + option retry, au lieu de laisser l'utilisateur bloqué.

---

## Détails techniques

Fichiers principaux touchés :
- `src/pages/client/Adhesion.tsx` — réécrire en 3 étapes (composant reste unique mais navigation simplifiée).
- `src/components/adhesion/UnifiedProgressBar.tsx` — 3 pas au lieu de 14.
- `src/components/landing/SimulateurSection.tsx` — recalcul temps réel + passage des params à l'adhésion.
- `src/lib/actuarial-engine.ts` — bornes d'âge, coefficients périodicités, ristourne.
- `src/lib/adhesion-validation.ts` — nouveau schéma 3 étapes.
- `src/lib/mcp/tools/simuler-prime.ts` — alignement bornes + ristourne.
- `src/stores/adhesion-progress.ts` — migration/reset store.
- `supabase/functions/mcp/index.ts` — redeploy après update tool.

Aucune migration DB nécessaire (schémas actuels suffisent). Aucun nouveau secret. Redéploiement de la fonction `mcp` en fin de build.

---

## Résultat attendu

- Souscription en < 3 minutes sur mobile pour un profil simple (principal seul).
- Prime affichée en direct, plus jamais figée.
- Cohérence totale entre landing, adhésion, PDF, chatbot, MCP et Note Technique officielle.
