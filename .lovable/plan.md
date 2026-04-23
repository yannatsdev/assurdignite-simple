
# Plan de correction production-ready — Admin, Client, Paiements, Reporting, Calculs, UX

## Objectif

Rendre la plateforme AssurDignité fiable en production avec :
- des données admin réellement live,
- une gestion utilisateurs/rôles opérationnelle,
- un reporting PDF professionnel,
- une FAQ chatbot administrable,
- un import Excel validé pour les paramètres de calcul,
- une séparation claire souscription individuelle / groupe,
- des paiements KkiaPay corrigés,
- une meilleure responsivité mobile/web,
- des reçus et documents plus lisibles.

## 1. Dashboard admin : logos, sidebar et responsive

### Corrections UI
- Repositionner les logos SONAM VIE et AssurDignité dans le bloc blanc de la sidebar admin.
- Supprimer définitivement le texte `ADMIN`.
- Ajuster les tailles pour éviter le débordement visible dans les screenshots :
  - desktop : logos alignés horizontalement, centrés, ratios préservés ;
  - collapsed sidebar : afficher uniquement SONAM ou une version compacte propre ;
  - mobile/tablette : padding réduit mais logos lisibles.
- Harmoniser `AdminSidebar`, `ClientSidebar`, `AdminLayout`, `ClientLayout` pour les breakpoints 375px, 768px, 1105px, 1280px+.

## 2. Reporting admin : données live et temps réel

### Problème actuel
`src/pages/admin/Reporting.tsx` utilise encore des données hardcodées :
- Jan 45, Fév 52, Mar 61, Avr 48 ;
- répartition formules A/B/C/D en pourcentages fixes.

### Correction
- Remplacer `monthlyData` et `formulaData` par des agrégations réelles depuis `contracts`.
- Calculer :
  - contrats actifs ;
  - primes réelles encaissées ou primes des contrats selon contexte ;
  - sinistres réels ;
  - contrats par mois sur les 6 ou 12 derniers mois ;
  - répartition réelle par formule A/B/C/D.
- Ajouter une subscription realtime sur :
  - `contracts`,
  - `paiements`,
  - `sinistres`,
  - `profiles`,
  - `user_roles`.
- Améliorer les états vides : si un seul contrat existe, le graphique doit afficher 1 au bon mois, pas des valeurs fictives.

## 3. Utilisateurs & Rôles : affichage réel + actions admin

### Problème actuel
La requête `profiles.select('*, user_roles(role)')` n’est pas fiable car la relation n’est pas correctement exploitable côté client. Résultat : 0 utilisateurs malgré un compte admin actif.

### Backend à ajouter
Créer une fonction backend sécurisée `admin-users` qui permet aux admins authentifiés de :
- lister les utilisateurs inscrits ;
- récupérer profile + email + téléphone + rôles + statut ;
- désactiver un compte ;
- réactiver un compte ;
- supprimer un compte ;
- ajouter/retirer un rôle.

### Base de données
- Ajouter à `profiles` :
  - `status text default 'active'`,
  - `disabled_at timestamptz`,
  - `deleted_at timestamptz`.
- Garder les rôles dans `user_roles` uniquement, conformément à la règle sécurité.
- Créer ou corriger les politiques RLS nécessaires pour que seuls les admins puissent gérer ces données.

### Interface admin
Dans `src/pages/admin/Utilisateurs.tsx` :
- afficher les vrais compteurs :
  - total utilisateurs,
  - admins,
  - clients,
  - désactivés ;
- ajouter recherche par nom/email/téléphone ;
- ajouter filtres rôle/statut ;
- ajouter actions :
  - désactiver,
  - réactiver,
  - supprimer,
  - changer rôle client/admin ;
- ajouter confirmations avant suppression/désactivation ;
- afficher skeleton loader et messages d’erreur clairs.

## 4. Communication : FAQ chatbot administrable

### Base de données
Créer une table `chatbot_faqs` :
- `id`,
- `question`,
- `answer`,
- `category`,
- `is_active`,
- `sort_order`,
- `created_at`,
- `updated_at`.

### Sécurité
- Admins : CRUD complet.
- Chatbot : lecture uniquement des FAQ actives.
- Pas d’exposition inutile des données privées.

### Interface admin
Dans `src/pages/admin/Communication.tsx` :
- liste des FAQ ;
- bouton “Ajouter une question” ;
- édition question/réponse ;
- activation/désactivation ;
- suppression ;
- aperçu de la réponse ;
- filtres actif/inactif.

### Chatbot
Mettre à jour `supabase/functions/chat-ai/index.ts` :
- charger les FAQ actives ;
- injecter ces FAQ dans le prompt système ;
- garder le fallback IA si aucune FAQ ne correspond exactement.

## 5. Outils : upload Excel pour changer les calculs

### Objectif
Permettre à l’admin d’uploader un fichier Excel validé qui met à jour les paramètres de calcul sans modifier le code.

### Base de données
Créer :
- `actuarial_config_versions`
  - `id`,
  - `version_name`,
  - `source_file_name`,
  - `config_json`,
  - `validation_report`,
  - `is_active`,
  - `created_by`,
  - `created_at`.

Optionnel :
- bucket privé `actuarial-configs` pour archiver les fichiers Excel.

### Validation
Ajouter une validation stricte :
- formules A/B/C/D présentes ;
- capitaux principal/conjoint/enfant/ascendant valides ;
- frais et chargements numériques ;
- pas de valeurs négatives ;
- cohérence enfants/ascendants ;
- rejet du fichier si les colonnes attendues sont absentes.

### Interface
Dans `src/pages/admin/Outils.tsx` :
- bloc “Importer un fichier Excel de tarification” ;
- upload `.xlsx` uniquement ;
- aperçu du rapport de validation ;
- bouton “Activer cette version” ;
- historique des versions ;
- possibilité de revenir à une version précédente.

### Calculs
Refactorer `src/lib/actuarial-engine.ts` :
- garder les constantes actuelles comme fallback ;
- ajouter un moteur acceptant une configuration dynamique ;
- créer un hook `useActuarialConfig()` qui charge la configuration active ;
- utiliser cette config dans :
  - simulateur landing,
  - simulateur client,
  - étape adhésion,
  - outil admin.

## 6. Revue des calculs et cohérences métier

### Corrections prévues
- Revalider les limites d’âge :
  - principal : 18 à 64 ans ;
  - conjoint : ≤ 64 ans ;
  - enfant : ≤ 21 ans ;
  - ascendant : ≤ 79 ans.
- Clarifier le capital total affiché :
  - capital principal,
  - capital conjoint,
  - capital enfants,
  - capital ascendants,
  - total garanties.
- Corriger les incohérences entre :
  - simulation,
  - choix formule,
  - reçu,
  - police,
  - conditions particulières.
- Vérifier que la prime annuelle utilisée dans le paiement est exactement celle affichée dans la simulation.

## 7. Souscription : séparer individuelle et groupe

### Problème actuel
La partie groupe est intégrée comme une étape dans le même parcours individuel.

### Nouvelle logique
Au début du parcours `Adhesion` :
- ajouter un écran de choix :
  - “Souscription individuelle personnelle” ;
  - “Souscription groupe / entreprise / association”.

### Parcours individuel
Garder uniquement les étapes personnelles :
1. Simulation
2. Choix formule
3. KYC principal
4. Conjoint
5. Assurés complémentaires
6. Bénéficiaires
7. Prestations nature
8. Ayants-droits
9. Questionnaire médical
10. Conditions générales
11. Paiement
12. Conditions particulières
13. Signature & reçu

### Parcours groupe
Créer un parcours dédié :
- informations structure ;
- représentant légal ;
- responsable RH ;
- effectif ;
- liste du personnel ;
- formules retenues ;
- validation ;
- paiement ou demande de devis.

Cela peut rester dans `Adhesion.tsx` avec composants séparés, ou être extrait en composants :
- `IndividualAdhesionFlow`,
- `GroupAdhesionFlow`.

## 8. Étape Conditions Générales : design amélioré

Dans l’étape “Conditions Générales” :
- remplacer le simple bloc texte par une carte professionnelle :
  - header violet ;
  - résumé des points clés ;
  - accordéons par article ;
  - bloc exclusions bien visible ;
  - progression de lecture ;
  - case d’acceptation claire ;
  - bouton télécharger/imprimer les CG.
- Améliorer lisibilité mobile :
  - police plus grande ;
  - meilleure hauteur ;
  - padding ;
  - contraste renforcé.

## 9. KkiaPay : corriger les échecs de paiement

### Vérifications et corrections
- Vérifier la fonction `kkiapay-config` :
  - sandbox bien détecté ;
  - public key sandbox correcte ;
  - réponse claire côté frontend.
- Corriger `KkiapayWidget` :
  - envoyer un payload `data` exploitable ;
  - normaliser téléphone/email/nom ;
  - afficher les erreurs techniques KkiaPay au lieu d’un message générique ;
  - éviter les listeners doublons ;
  - nettoyer les callbacks.
- Mettre en place un flux fiable :
  - créer un paiement `pending` avant ouverture du widget ;
  - envoyer `paiement_id`, `user_id`, `contract_id` ou `draft_id` dans `data` ;
  - webhook met à jour `paid` ou `failed` ;
  - le client écoute le realtime du paiement ;
  - le parcours avance seulement quand le paiement est confirmé.
- Pour l’adhésion, créer un contrat `draft` ou une souscription temporaire avant paiement, puis activer après paiement/signature.
- Améliorer les messages d’échec :
  - clé API incorrecte ;
  - mode sandbox/live incohérent ;
  - transaction refusée ;
  - popup bloquée ;
  - réseau indisponible.

## 10. Génération rapport admin PDF

### Problème actuel
Le bouton “Générer” redirige vers `/admin/reporting`, mais ne génère pas de rapport.

### Correction
Dans `src/pages/admin/Reporting.tsx` :
- ajouter un bouton “Générer rapport PDF”.
- Générer un rapport professionnel avec `jsPDF` et les helpers de `pdf-shared` :
  - logos SONAM + AssurDignité alignés ;
  - date de génération ;
  - KPIs ;
  - contrats par mois ;
  - répartition formule ;
  - encaissements ;
  - sinistres ;
  - synthèse finale.
- Exporter :
  - PDF ;
  - CSV optionnel des données affichées.
- Ajouter état loading et toast succès.

## 11. Reçu et documents : visibilité “Non inclus” + montants

### Corrections
- Dans les reçus et documents :
  - rendre “Non inclus” visible avec badge gris/rouge clair ;
  - afficher “0 FCFA” ou “Non inclus” de manière cohérente ;
  - ne pas mélanger capital disponible et garantie non souscrite ;
  - ajouter bénéficiaires, options, assurés complémentaires, formule, prime, référence paiement.
- Améliorer les tableaux PDF :
  - meilleure hauteur de ligne ;
  - texte multi-ligne ;
  - contraste des headers ;
  - pagination automatique si contenu long.
- Harmoniser reçu de paiement, police, conditions particulières et attestation.

## 12. Admin : autres pages à rendre live

### Finances
- Ajouter realtime sur `paiements`.
- Afficher correctement :
  - paid,
  - pending,
  - failed.
- Ajouter filtres méthode/statut/date.
- Corriger logos méthodes, notamment `simulation_mtn`, `simulation_orange`, `simulation_moov`, `simulation_wave`.

### Contrats
- Ajouter realtime.
- Ajouter statut `draft`, `active`, `pending_payment`, `expired`, `cancelled`.
- Ajouter actions admin : voir détail, changer statut, exporter.

### Sinistres
- Ajouter realtime.
- Ajouter confirmation sur changement de statut.
- Ajouter affichage documents si présents.

## 13. Backend et sécurité

### Migrations nécessaires
- `profiles.status`, `disabled_at`, `deleted_at`.
- Table `chatbot_faqs`.
- Table `actuarial_config_versions`.
- Éventuellement table `subscriptions_drafts` ou champ `contracts.status = draft/pending_payment`.
- Triggers `updated_at` sur nouvelles tables.
- Corriger le trigger `on_paiement_status_change` s’il n’est pas attaché à `paiements`.

### Fonctions backend
- `admin-users` :
  - list,
  - deactivate,
  - reactivate,
  - delete,
  - role update.
- `kkiapay-webhook` :
  - validation payload,
  - update fiable paiement,
  - logs utiles.
- `chat-ai` :
  - FAQ active intégrée.

## 14. Landing page et interface globale

### Landing
- Revoir incohérences visuelles restantes :
  - tailles textes ;
  - alignements ;
  - spacing ;
  - boutons ;
  - cartes trop hautes ou désalignées ;
  - images trop lourdes.
- Optimiser les animations pour mobile :
  - réduire animations trop coûteuses ;
  - respecter `prefers-reduced-motion`.

### Client
- Vérifier :
  - adhésion complète ;
  - simulation ;
  - paiement ;
  - documents ;
  - profil ;
  - bénéficiaires ;
  - sinistre ;
  - paiements.
- Fixer overflow mobile et boutons trop serrés.

### Admin
- Vérifier :
  - dashboard ;
  - reporting ;
  - utilisateurs ;
  - communication ;
  - outils ;
  - finances ;
  - contrats ;
  - sinistres ;
  - anti-fraude.
- Ajouter skeleton loaders et empty states professionnels.

## 15. Tests et validation finale

### Tests techniques
- Build TypeScript.
- Vérifier imports.
- Vérifier erreurs console.
- Vérifier erreurs réseau.
- Vérifier fonctions backend.

### Tests fonctionnels
- Créer/voir un contrat.
- Vérifier que reporting affiche ce contrat réellement.
- Vérifier que la répartition formule utilise les vraies données.
- Vérifier que Utilisateurs & Rôles affiche l’admin et les clients.
- Tester désactivation/réactivation utilisateur.
- Tester ajout/désactivation FAQ.
- Tester upload Excel valide/invalide.
- Tester paiement simulation.
- Tester KkiaPay sandbox avec meilleure gestion d’erreur.
- Générer rapport PDF admin.
- Générer reçu/police côté client.

### Tests responsive
- Mobile 375px.
- Tablette 768px.
- Desktop 1105px.
- Desktop large 1280px+.

## Fichiers principaux impactés

- `src/components/admin/AdminSidebar.tsx`
- `src/layouts/AdminLayout.tsx`
- `src/layouts/ClientLayout.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Reporting.tsx`
- `src/pages/admin/Utilisateurs.tsx`
- `src/pages/admin/Communication.tsx`
- `src/pages/admin/Outils.tsx`
- `src/pages/admin/Finances.tsx`
- `src/pages/admin/Contrats.tsx`
- `src/pages/admin/Sinistres.tsx`
- `src/pages/client/Adhesion.tsx`
- `src/pages/client/Documents.tsx`
- `src/pages/client/Paiements.tsx`
- `src/components/KkiapayWidget.tsx`
- `src/components/ChatBot.tsx`
- `src/lib/actuarial-engine.ts`
- `src/lib/pdf-shared.ts`
- `src/index.css`
- `supabase/functions/chat-ai/index.ts`
- `supabase/functions/kkiapay-config/index.ts`
- `supabase/functions/kkiapay-webhook/index.ts`
- nouvelle fonction `supabase/functions/admin-users/index.ts`
- nouvelles migrations base de données

## Ordre d’exécution

1. Migrations backend : profils statut, FAQ, versions Excel, triggers.
2. Fonction `admin-users`.
3. Fix Utilisateurs & Rôles.
4. Fix Reporting live + realtime.
5. Fix Dashboard admin et bouton rapport PDF.
6. Fix logos/sidebar admin et responsive layout.
7. FAQ administrable + intégration chatbot.
8. Upload Excel + config actuarielle dynamique.
9. Refactor simulation/calculs avec config active.
10. Séparation souscription individuelle/groupe.
11. Refonte étape Conditions Générales.
12. Fix KkiaPay + flux pending/paid/failed.
13. Reçu/documents : “Non inclus”, bénéficiaires, options, design.
14. Améliorations UI landing/client/admin.
15. Tests build, console, réseau, responsive et parcours complet.
