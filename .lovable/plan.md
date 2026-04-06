

# Plan — Documents téléchargeables, Adhésion enrichie, Groupe complet, Design amélioré

## Résumé
Rendre les documents téléchargeables avec branding SONAM/AssurDignité, enrichir le formulaire d'adhésion (simulation détaillée, explications formules, formulaire groupe complet), améliorer le paiement/signature, corriger le formatage des nombres, et améliorer le design global.

---

## 1. Documents téléchargeables avec branding (Documents.tsx)

Refondre `src/pages/client/Documents.tsx` pour générer des PDF brandés à la volée via `jspdf` :
- **Police d'assurance** : PDF avec logos SONAM + AssurDignité, données du contrat actif (police_number, formule, capital, prime, dates, assuré principal, bénéficiaires)
- **Conditions Générales** : PDF avec le texte CG complet et logos
- **Conditions Particulières** : PDF avec détails spécifiques au contrat
- **Reçu de paiement** : PDF avec détails du dernier paiement
- **Attestation d'assurance** : PDF attestation avec numéro de police et validité

Chaque PDF inclut : header avec les 2 logos, infos SONAM (tél, email, adresse), pied de page légal. Les boutons "Télécharger" déclenchent la génération.

Fetch des données réelles depuis Supabase (contrat actif + paiements) pour alimenter les PDFs.

## 2. Simulation détaillée (Étape 1 Adhésion)

Dans `Adhesion.tsx` step 0 :
- Ajouter un bloc explicatif des 4 formules avec tableau comparatif (capital principal/conjoint/enfant/ascendant pour chaque formule)
- Inclure conjoint, enfants, ascendants dans la simulation (pas seulement DOB principal)
- Afficher résultat détaillé : ventilation par personne, graphique PieChart 70/30, total formaté
- Ajouter note explicative sur le calcul actuariel CIMA H

## 3. Explications formules (Étape 2)

Dans step 1 (Choix Formule) :
- Ajouter description détaillée sous chaque carte : ce qui est inclus (nature 70% : cercueil, conservation, transport, inhumation + espèces 30%)
- Afficher capital par catégorie (principal, conjoint, enfant, ascendant)
- Badge "Populaire" sur Formule D

## 4. Formulaire Groupe (Étape 10)

Remplacer le step 9 (Groupe) simple par le formulaire complet fourni :
- **Section A** : Identification souscripteur (raison sociale, forme juridique, RCCM, secteur, adresse, effectif)
- **Section B** : Personnes habilitées (représentant légal + responsable RH)
- **Section C** : Modalités contrat (type adhésion, périmètre, date effet, durée)
- **Section D** : Formules/garanties/tarifs (formules cochées, capitaux, options, périodicité, mode paiement, qui paie)
- **Section E** : Récapitulatif financier (primes par formule)
- **Section F** : Déclarations et engagements (checkboxes)
- **Annexe** : Table éditable pour liste du personnel/membres (nom, DOB, sexe, téléphone, matricule, statut, formule, capital, prime, bénéficiaires)

Toggle "Souscription individuelle / groupe" pour afficher le formulaire approprié.

## 5. Paiement → transition auto (Étape 12)

Dans step 11 (Paiement) : quand `handlePay()` réussit, auto-avancer à l'étape suivante après 1.5s avec toast de confirmation.

## 6. Signature améliorée (Étape 14)

- Ajouter un canvas de signature manuscrite (dessiner avec le doigt/souris) en plus de l'OTP
- Bouton "Effacer" pour recommencer la signature

## 7. Reçu PDF amélioré

Refondre `generatePDF()` :
- Header avec les 2 logos (SONAM VIE + AssurDignité) — utiliser les images encodées en base64
- Titre "REÇU DE SOUSCRIPTION — ASSURDIGNITÉ"
- Infos SONAM : adresse, tél, email
- Tableau structuré avec toutes les infos du contrat
- Formatage correct des nombres (pas de `/`, juste `1 500 000 FCFA`)
- Pied de page avec mentions légales

## 8. Formatage des nombres

Corriger `formatCFA()` dans `actuarial-engine.ts` pour s'assurer que le formatage utilise uniquement des espaces comme séparateur de milliers, pas de `/`. Vérifier partout dans l'app.

## 9. Note explicative dans le simulateur landing page

Dans `SimulateurSection.tsx` : ajouter un bloc info/accordion expliquant les 4 formules avec leurs capitaux avant le formulaire.

## 10. Design amélioré espace client & admin

**Client** :
- Cards avec gradient subtil et hover effects
- Meilleur espacement et typographie
- Loading skeletons au lieu de spinners simples
- Dashboard : ajouter date d'expiration du contrat, barre de progression fidélité

**Admin** :
- Cards KPI avec icônes colorées et gradient backgrounds
- Meilleur responsive des graphiques
- Tables avec alternating row colors

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/client/Documents.tsx` | Refonte complète — génération PDF brandés |
| `src/pages/client/Adhesion.tsx` | Enrichir steps 0, 1, 9, 11, 13 + formulaire groupe |
| `src/components/landing/SimulateurSection.tsx` | Ajouter note explicative formules |
| `src/lib/actuarial-engine.ts` | Vérifier formatCFA |
| `src/pages/client/Dashboard.tsx` | Améliorer design |
| `src/pages/admin/Dashboard.tsx` | Améliorer design |

## Ordre d'exécution

1. Formatage nombres (actuarial-engine)
2. Documents téléchargeables avec branding
3. Adhésion : simulation détaillée + explications formules
4. Adhésion : formulaire groupe complet
5. Adhésion : paiement transition + signature canvas + reçu PDF amélioré
6. Simulateur landing page : note formules
7. Design improvements client & admin

