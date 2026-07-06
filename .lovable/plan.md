
## Objectif

Appliquer intégralement le zip `AssurDignite_corrige.zip` que vous avez audité, en écrasant les 27 fichiers du projet qui diffèrent, puis aligner la mémoire projet et redéployer le MCP.

## Fichiers à écraser (contenus pris tels quels depuis votre zip)

**Moteur & IA**
- `src/lib/actuarial-engine.ts` — recalcul par assuré selon la périodicité (correction ‑7 % à ‑13 % vs Excel)
- `src/lib/adhesion-validation.ts`
- `src/lib/mcp/tools/simuler-prime.ts` — branché sur le vrai moteur (PC + CIMA H)
- `src/lib/mcp/tools/list-formules.ts` — noms de formules alignés
- `supabase/functions/mcp/index.ts` (bundle), `supabase/functions/chat-ai/index.ts`, `supabase/functions/recommend-formula/index.ts`

**Landing** (message produit : indemnité 100 % espèces sous 15 j ouvrés, plus de "70/30 en 12 h")
- `HeroSection`, `FormulesSection`, `GarantiesSection`, `AvantagesSection`, `FAQSection`, `ConditionsSection`, `SimulateurSection`, `PremiumShowcaseSection`, `SmartRecommender`

**Tunnel client & PDF**
- `src/pages/client/Adhesion.tsx` — sélecteur de périodicité, plafond 10 enfants / 4 ascendants, montant échéance réellement facturé
- `src/pages/client/Documents.tsx` — CG/CP/Police fidèles au vrai document
- `src/pages/client/Sinistre.tsx`, `SinistreSuivi.tsx`, `Dashboard.tsx`, `src/pages/Index.tsx`
- `src/components/ChatBot.tsx`, `src/components/kyc/IdCardScanner.tsx`, `src/components/client/MarketingCarousel.tsx`, `src/components/client/TrustMarquee.tsx`
- `.lovable/plan.md`

## Étapes

1. Copier ces 27 fichiers depuis `/tmp/adcor/assurdignite/` vers le projet (overwrite).
2. Régénérer `.lovable/mcp/manifest.json` (`app_mcp_server--extract_mcp_manifest`) et redéployer la fonction `mcp` pour propager la nouvelle formule côté serveur.
3. Mettre à jour `mem://index.md` :
   - Remplacer la ligne "70 % nature + 30 % cash MoMo" par : **indemnité 100 % espèces versée sous 15 jours ouvrés**.
   - Ajouter au Core : plafond famille **10 enfants / 4 ascendants**, ristourne = **30 % de la prime du principal** (pas du cumul).
   - Ajouter mémoire `mem://features/periodicity` : coefficients Excel + `primeForPeriodicity` recalculée par assuré.
4. Vérifier le typage TS (`tsgo`) sur les fichiers écrasés — corriger seulement les erreurs strictes que TS révèle, sans altérer la logique.

## Points d'attention

- Les modifs UI de nos tours précédents (icônes centrées étape 1, Conditions Particulières ajoutées, mention "images non stockées" retirée, bénéficiaires 30 % obligatoires) sont incluses/absorbées par votre `Adhesion.tsx` et `IdCardScanner.tsx` corrigés — j'applique votre version telle quelle. Dites-moi si vous voulez qu'on réintègre l'un de ces éléments par-dessus.
- Aucune migration BD : conforme à votre note ("Non fait"). Le montant réellement encaissé passe déjà par `paiements.montant`.
- Pas de `npm install/build` déclenché manuellement ; Lovable rebuild automatiquement après les écritures.
