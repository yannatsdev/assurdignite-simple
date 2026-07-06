
# Plan — Corrections AssurDignité (Note Technique 26/05/2026)

Exécution séquentielle des 8 prompts. Un seul chantier, livré en une passe cohérente.

## 1. Moteur de simulation — anti-figement
Fichiers : `src/lib/actuarial-engine.ts`, `src/components/landing/SimulateurSection.tsx`, `src/components/landing/SmartRecommender.tsx`, `src/pages/client/Adhesion.tsx`, `src/pages/client/Souscrire.tsx`.
- Reconstruire les `useEffect` de calcul avec deps stables : `option`, `quoteDate`, `principal.dob`, `conjoint.included`, `conjoint.dob`, `JSON.stringify(enfants)`, `JSON.stringify(ascendants)`, `duree`.
- Debounce 200ms (helper commun).
- `setResult(null)` immédiat si `principal.dob` vide / invalide / âge hors [18,64].
- Filtrer `enfants` et `ascendants` sans `dob` avant appel `simulatePrime`.
- Reset à chaque changement de formule (le résultat ne persiste jamais d'une formule à l'autre).

## 2. Coefficient PMC 0,09 (bug 0,087)
- `simuler_prime` MCP : `mensuelle: PAC * 0.09 + 500` (actuellement 0.087).
- Grep `0.087` / `0,087` dans tout le repo (code, `.lovable/plan.md`, PDF templates, docs).
- `PERIODICITY.mensuel.coef` déjà à 0.09 dans `actuarial-engine.ts` — vérifier.
- Ajout test Vitest `src/lib/actuarial-engine.test.ts` couvrant les 4 formules PAC'/PSC/PTC/PMC avec PAC=100000.

## 3. Chargements & taux (fc, fa)
- Confirmer `TAUX=0.035`, `FC=0.0015`, `FA=0.18`, `ENC_A=2500` (déjà OK dans `actuarial-engine.ts`).
- Grep `3‰`, `0.003`, `16%`, `0.16` → remplacer par `0,15%` / `18%` partout (bulletin d'adhésion PDF, conditions, avis de situation, labels UI, ChatBot).
- Vérifier `src/lib/pdf-shared.ts` et tout générateur PDF.

## 4. Limites d'âge cohérentes
- Règle unique : principal/conjoint 18–64 ET âge+durée ≤ 65 ; enfants 0–21 ; ascendants 0–89 ET âge+durée ≤ 90.
- MCP `simuler_prime` : `age: z.number().min(18).max(64)` (déjà OK mais re-vérifier après grep 75).
- `adhesion-validation.ts` : ajouter contrainte âge+durée.
- Messages d'erreur explicites dans formulaires (Adhesion.tsx, SimulateurSection.tsx).
- Chatbot FAQ : mise à jour.

## 5. Ristourne 30% — assiette = prime principal uniquement
- Auditer tout calcul/libellé « ristourne » / « 30% ».
- Si calcul basé sur prime totale famille → corriger vers `persons.find(p=>p.role==='Principal').primeAffichee * 0.30`.
- Libellés : « 30% de la prime de l'Assuré Principal » — jamais « prime totale ». Fichiers : landing (FormulesSection, AvantagesSection, FAQSection), Dashboard client, Contrats, PDF, CG.

## 6. MCP — noms formules & cohérence moteur
- `list-formules.ts` : A=Dignité Simple, B=Serein, C=Prestige, D=Excellence (retirer Essentielle/Standard/Premium/Excellence Diaspora).
- `simuler-prime.ts` MCP : remplacer la formule ad-hoc `capital * (0.008 + (age-30)*0.0004)` par un appel au vrai moteur `simulatePrime()` (import partagé) pour aligner les résultats site ↔ MCP.
- Cas de test : principal 42 ans formule A → même montant des deux côtés.
- Regénérer manifest (`app_mcp_server--extract_mcp_manifest`) + `supabase--deploy_edge_functions ["mcp"]`.

## 7. Contenu produit (Dossier Officiel)
- Ascendants : jusqu'à 4, souscription ≤ 89 ans, couverture ≤ 90 ans, mise en avant vs marché (55–75 ans).
- Sinistre : règle cash 100% si prestation nature impossible (étranger, rites rapides). Ajouter dans workflow sinistre + FAQ + CG.
- Délais : distinguer clairement 15 jours ouvrés contractuel (CIMA) vs objectif interne « quelques heures » (non contractuel, jamais fusionnés).
- Bonus Fidélité-Santé = même ristourne du Prompt 5 (pas de doublon).
- ChatBot.tsx : refresh FAQ (âges, ristourne, délais).
- Grep `IMPACT.02` partout → remplacer par `AssurDignité`.
- Alignement landing page (Hero, Formules, Avantages, FAQ) sur ces règles.

## 8. QA finale
- `bun run build` + `tsgo` clean.
- Playwright headless : réparer tests existants + nouveau scénario 6 profils (jeune seul, couple, famille 3 enfants, 2 ascendants 85 ans, diaspora D, senior 63 ans). Vérifier non-figement entre changements.
- Barre progression 3 étapes mobile/desktop (screenshot Playwright).
- Vérif RLS : `contrats`, `beneficiaires`, `assures_complementaires`, `paiements` toujours scopés `auth.uid()`.
- Rapport final : bugs corrigés, tableau avant/après (fc, fa, coef PMC, bornes âge, noms formules), captures simulateur.

## Livrables
- Rapport de bugs par prompt (avant/après).
- Manifest MCP regénéré + fonction `mcp` redéployée.
- Test unitaire périodicité + scénario Playwright 6 profils.
- Zéro régression build/type/RLS.

Confirmez pour lancer l'implémentation.
