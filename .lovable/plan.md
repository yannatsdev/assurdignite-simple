

# Plan — Corrections complètes, formulaire d'adhésion 14 étapes, et améliorations globales

## Diagnostic des 404

Les routes sont sous `/client/*` et `/admin/*` mais les URLs rapportées (`/souscrire`, `/contracts`, etc.) manquent le préfixe. Le problème vient probablement de liens incorrects dans les sidebars ou la navigation directe. Les routes dans `App.tsx` sont correctes — les sidebars pointent bien vers `/client/...` et `/admin/...`. Les 404 viennent d'une navigation directe sans préfixe. **Solution** : Ajouter des redirects dans App.tsx pour les routes sans préfixe.

---

## Phase 1 — Fixes 404 et routage

**App.tsx** : Ajouter des routes redirect :
- `/souscrire` → `/client/souscrire`
- `/contrats` → `/client/contrats`
- `/paiements` → `/client/paiements`  
- `/beneficiaires` → `/client/beneficiaires`
- `/sinistre` → `/client/sinistre`
- `/assistance` → `/client/assistance`
- `/documents` → `/client/documents`
- `/profil` → `/client/profil`
- `/parametrage` → `/admin/parametrage`
- `/finances` → `/admin/finances`
- `/sinistres` → `/admin/sinistres`
- `/fraude` → `/admin/fraude`
- `/reporting` → `/admin/reporting`
- `/utilisateurs` → `/admin/utilisateurs`
- `/communication` → `/admin/communication`
- `/outils` → `/admin/outils`

Ajouter route `/client/adhesion` pour le formulaire d'adhésion.

## Phase 2 — Admin test user

SQL migration :
```sql
-- Insert admin role for a test user (will need to create user first via signup, then assign role)
-- We'll create an edge function or use a migration to insert admin role
```

Approche : Créer une migration qui insère un admin role. L'utilisateur devra d'abord s'inscrire via `/login`, puis la migration assignera le rôle admin. **Alternative plus simple** : activer auto-confirm pour permettre de créer un compte test, puis assigner le rôle admin via migration.

## Phase 3 — Header "Espace Client" visibility fix

Le bouton "Espace Client" a `border-white/30 text-white` quand non scrollé — sur fond blanc après scroll, le texte blanc est invisible. Fix : quand `scrolled`, appliquer des styles normaux avec texte visible.

## Phase 4 — Landing page additions

### FAQ Section
Nouvelle section `FAQSection.tsx` avec accordion des questions fréquentes (basé sur FAQ_DATA existant dans ChatBot).

### Conditions Générales Section
Nouvelle section `ConditionsGeneralesSection.tsx` avec le texte des CG en accordion scrollable.

### Hero animations
- Ajouter un effet de typing/typewriter sur le titre
- Animer l'image hero avec un léger zoom/parallax
- Compteurs animés pour les stats

### Formule D populaire
Changer `popular: true` de formule B à formule D dans `FormulesSection.tsx`.

## Phase 5 — Chatbot amélioré

Enrichir `FAQ_DATA` avec ~20 questions couvrant :
- Détails de chaque formule (A, B, C, D)
- Prestations en nature (cercueil, transport, inhumation)
- Conditions d'éligibilité par âge
- Bonus fidélité détaillé
- Processus de souscription step by step
- Paiement Mobile Money (Wave, Orange, MTN, Moov)
- Délais et processus sinistre
- Ayants-droits et enfants à naître
- Documents nécessaires
- Rapatriement et assistance

Améliorer `findAnswer()` avec un scoring de pertinence multi-mots au lieu du match simple.
Améliorer le formatage avec support des listes à puces (`- `) et numérotées (`1. `).
Ajouter auto-scroll vers le dernier message.

## Phase 6 — Login responsive (images mobile)

Pour `Login.tsx` et `AdminLogin.tsx` : sur mobile/tablette, afficher l'image en haut (petite) au lieu de la cacher complètement. Utiliser un layout empilé sur mobile avec une image de taille réduite.

## Phase 7 — Formulaire d'adhésion 14 étapes

Créer `src/pages/client/Adhesion.tsx` complet avec :

1. **Simulation** — SimulateurSection intégré (version compacte)
2. **Choix formule** — 4 cartes A/B/C/D avec résultats de simulation
3. **KYC principal** — nom, prénom, DOB, email, phone, adresse, CNI
4. **Conjoint/épouse** — mêmes infos (optionnel, toggle)
5. **Assurés complémentaires** — nom, DOB, lien parenté + 1 prestation nature dropdown
6. **Bénéficiaires** — nom aîné, lien parenté, téléphone (pas de %)
7. **Prestations nature** — dropdowns : cercueil, conservation corps, transport, inhumation
8. **Ayants-droits non assurés** — enfants nés/à naître, noms, numéros
9. **Questionnaire médical** — 6+ questions santé + checkbox légale obligatoire
10. **Appartenance groupe** — association, groupe (optionnel)
11. **Conditions générales** — texte scrollable complet, checkbox validation obligatoire en bas
12. **Paiement** — Mobile Money (Wave/Orange/Moov/MTN logos) + virement bancaire (joindre RIB)
13. **Conditions particulières** — affichées après paiement réussi
14. **Signature + Reçu PDF** — OTP, génération PDF brandé SONAM VIE (jspdf)

Chaque étape = composant dans le wizard avec progress bar, navigation prev/next, validation par étape.

Le formulaire insère dans les tables `contracts`, `beneficiaires`, `assures_complementaires`, `paiements`.

## Phase 8 — Simulateur amélioré

- Ajouter animation de compteur animé pour le montant final
- Ajouter des icônes pour les formules au lieu du select simple
- Transitions plus fluides entre les résultats
- Meilleur responsive mobile

## Phase 9 — Compléter pages manquantes admin

Transformer les `AdminPlaceholder` en pages avec contenu réel (même si données mock) :
- **Paramétrage** : formulaire d'édition des capitaux par formule, chargements
- **Contrats admin** : table filtrable de tous les contrats
- **Finances** : réconciliation, tableau encaissé vs dû
- **Sinistres admin** : workflow avec statuts
- **Anti-fraude** : journal d'audit, alertes
- **Reporting** : dashboards avec filtres
- **Utilisateurs** : liste des users avec rôles
- **Communication** : gestion FAQ, modèles notifs
- **Outils** : simulateur interne, recherche globale

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/App.tsx` | Redirects + route adhesion |
| `src/components/landing/Header.tsx` | Fix bouton Espace Client |
| `src/components/landing/HeroSection.tsx` | Animations améliorées |
| `src/components/landing/FormulesSection.tsx` | Formule D populaire |
| `src/components/landing/FAQSection.tsx` | **Nouveau** |
| `src/components/landing/ConditionsSection.tsx` | **Nouveau** |
| `src/pages/Index.tsx` | Ajouter FAQ + CG sections |
| `src/components/ChatBot.tsx` | FAQ enrichie + meilleur matching + formatage |
| `src/pages/Login.tsx` | Image visible mobile |
| `src/pages/AdminLogin.tsx` | Image visible mobile |
| `src/pages/client/Adhesion.tsx` | **Refonte complète** — 14 étapes |
| `src/pages/admin/*.tsx` | 9 pages admin complètes |
| Migration SQL | Admin user role |

## Ordre d'exécution

1. Migration DB (admin user)
2. Fix 404 routes + redirects
3. Fix Header bouton + responsive login
4. Landing page : FAQ, CG, hero animations, formule D
5. ChatBot enrichi
6. Formulaire adhésion 14 étapes
7. Pages admin complètes
8. Simulateur animations

