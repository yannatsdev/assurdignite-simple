

# Plan — Refonte premium UX, fix KkiaPay, branding chatbot, RAZ data

## 1. Fix paiement KkiaPay bloqué (Étape 12 + Paiements)

Le custom element `<kkiapay-widget>` ne se monte pas correctement quand React le rend après le chargement du script CDN → bouton "Payer maintenant" affiche un spinner infini.

**Refonte `src/components/KkiapayWidget.tsx`** :
- Ne plus rendre le custom element. Charger dynamiquement le script `https://cdn.kkiapay.me/k.js` au mount avec polling de `window.openKkiapayWidget`.
- Exposer un bouton React natif premium "Payer maintenant" qui appelle `window.openKkiapayWidget({ amount, key, sandbox, position:'center', theme, name, email, phone, callback })` → ouvre la popup KkiaPay officielle.
- Attacher `window.addSuccessListener(cb)` et `addFailedListener(cb)` une seule fois par instance avec cleanup.
- Props : `amount, email, phone, name, onSuccess, onFailed, sandbox=true, label?`.
- État : `loading` (script chargement), `processing` (paiement en cours), `ready`.
- Toast `sonner` succès/échec.

**`Adhesion.tsx` Step 12** : Sur `onSuccess`, créer la ligne `paiements{ user_id, contract_id, montant, status:'paid', methode:'kkiapay', reference:resp.transactionId }` puis avancer à l'étape 13.

**`Paiements.tsx`** : Sur `onSuccess`, insert paiement payé + toast.

## 2. Notifications instantanées paiement

- `client/Paiements.tsx` + `Dashboard.tsx` : déjà abonnés au realtime. Ajouter un `toast.success("Paiement confirmé — votre contrat est actif ✓")` ou `toast.error("Paiement échoué")` quand `payload.eventType==='UPDATE'` et `status` change.
- Nouvelle page `src/pages/client/Notifications.tsx` (historique) + table `notifications` (migration) avec realtime + lien vers contrat. Badge cloche dans `ClientLayout`.

## 3. Refonte design Dashboards (inspiration screenshot Digisurance)

**`src/pages/client/Dashboard.tsx`** :
- Ligne du haut : 3 cards horizontales colorées (orange/violet/vert) — "Couverture obsèques", "Capital garanti", "Bénéficiaires".
- Tabs filtres ("Tous", "Actifs", "Expirés").
- Liste accordéons des contrats (style screenshot 1) : header avec n° police + nom assuré + chevron, déploie panneau avec coverages (table), summary invoice à droite avec "Next bill", bouton "Voir reçu".
- Modal "Pay Now" (style screenshot 2) : facture détaillée + sélection moyen paiement → KkiaPay.
- Toast "Payment Success" (style screenshot 3) après paiement.

**`src/pages/admin/Dashboard.tsx`** :
- 3 cards horizontales colorées (Polices actives / Primes encaissées / Sinistres traités).
- Tabs "Tous / Santé / Auto / Vie".
- Tableaux accordéons des contrats récents avec sparklines.
- Cards "À traiter aujourd'hui" : sinistres en attente + paiements en échec + nouvelles adhésions.
- Heatmap activité hebdomadaire.

## 4. Réinitialisation données (RAZ)

Migration SQL :
```sql
TRUNCATE TABLE public.paiements, public.sinistres, public.beneficiaires,
  public.assures_complementaires, public.contracts CASCADE;
```
Conserve `user_roles`, `profiles`, `auth.users` (admin bootstrap intact).
Toutes les pages affichent désormais des **données live réelles** (vide au départ) et plus de mock. Vérifier `Dashboard.tsx` admin → retirer les fallbacks `'2 847'`, `'128 500 000'` etc. (afficher 0 si vide).

## 5. Landing page — nettoyages demandés

- **`FormulesSection.tsx`** : supprimer entièrement le bloc "Transparence tarifaire / Comment est calculée votre prime ?" (lignes 103-137). Ne conserver que les formules + services nature.
- **`AdminLogin.tsx`** : supprimer la mention "Demo admin : adminyannsonam@gmail.com / Yannedge50$" (lignes 141-145). Garder uniquement la mention du code d'accès en mode signup.

## 6. Simulateur — onglet "Détails administratifs"

`SimulateurSection.tsx` : Remplacer `showDetails` par des `Tabs` (shadcn) avec 2 onglets quand admin :
- **"Résumé"** (public) : prime annuelle + répartition + prime par assuré.
- **"Détails administratifs"** (admin only) : PAP Total, PAI ×1.002, PAC ÷0.85, Frais fixes 2 500 FCFA, formule détaillée.
Pour les non-admins, l'onglet 2 n'apparaît pas.

## 7. ChatBot premium intelligent

**`src/components/ChatBot.tsx`** :
- Rebranding visuel : header avec logo SONAM mini, titre "Assistant AssurDignité", sous-titre "Disponible 24/7", animation pulse en ligne.
- Quick replies enrichies : "Mes formules", "Déclarer un sinistre", "Suivi de mon dossier", "Renouveler ma prime", "Contact urgence".
- Détection intent côté UI : si user tape "sinistre" ou "décès", proposer un bouton "🚨 Démarrer Fast-Track sinistre" qui ouvre un modal `<FastTrackSinistreModal>` (4 étapes : Décédé → Date/Lieu → Documents (upload) → Confirmation), insère dans `sinistres` table avec `status='fast_track'`, retourne référence.
- Suivi dossier : si user tape "suivi" ou ref `SIN-XXX`, fetch sinistre et affiche carte status (déclaré / en cours / payé) avec timeline.
- Markdown rendu via `react-markdown` (à ajouter) au lieu du parser custom — meilleure mise en forme (titres ###, listes, gras).

**`supabase/functions/chat-ai/index.ts`** : enrichir le system prompt → "Tu es l'assistant officiel AssurDignité de SONAM VIE. Réponds toujours en français, structuré en titres et puces. Si l'utilisateur évoque un décès/sinistre, propose le Fast-Track sinistre. Cite contacts : 27 20 31 71 82, servicecommercialsonamvie@sonam.ci. Sois empathique." Garder modèle `google/gemini-2.5-flash` (rapide). Vérifier non-2xx.

## 8. Espace admin "Rapports" — Export PDF mensuel

**`src/pages/admin/Reporting.tsx`** : nouveau bouton "Générer rapport mensuel PDF" :
- Sélecteur de mois.
- Fetch `contracts` actifs, `paiements` payés du mois (sum), `sinistres` traités du mois.
- Génère PDF jsPDF avec logo SONAM, tableau primes encaissées, tableau contrats actifs, tableau sinistres avec total versé. Header gradient, KPI tiles, tableaux avec autoTable.
- `doc.save('Rapport-AssurDignite-{YYYY-MM}.pdf')`.

## 9. SEO + accessibilité landing

**`index.html`** : 
- Title corrigé : "AssurDignité — Assurance obsèques SONAM VIE | Côte d'Ivoire & Zone CIMA".
- Description complète <160 chars sans saut de ligne.
- Ajouter `<meta name="keywords">`, `<link rel="canonical">`, JSON-LD `Organization` + `Product`.
- `lang="fr"`.

**Landing components** : 
- Hierarchy `<h1>` unique sur Hero, `<h2>` sections, `<h3>` cards.
- Tous boutons/liens avec `aria-label` explicite si icône seule.
- `alt` détaillés pour images (`family-six-members.jpg` → "Famille africaine multigénérationnelle protégée par AssurDignité").
- `tabIndex` cohérent + focus visible (`focus-visible:ring-2 focus-visible:ring-primary`).
- Contrastes vérifiés (texte sur images : ajout overlay si besoin).

## 10. Innovations dashboards

**Client** :
- Widget "Météo de votre couverture" : score santé du contrat (% à jour, bénéficiaires renseignés, KYC complets) avec gauge animée.
- Timeline "Événements importants" (souscription, paiements, anniversaire contrat, renouvellement à venir).
- "Smart suggestions" basées sur le profil (ex: "Ajoutez votre conjoint pour 30% de capital en plus").

**Admin** :
- "Pulse en temps réel" : compteur live des connexions clients (canal `presence` Supabase).
- Funnel adhésion (étape 1→14) avec taux d'abandon par étape.
- Carte de chaleur géographique (régions de souscription) — stub si data manquante.
- Alertes intelligentes : "3 sinistres > 7j sans traitement" carte rouge cliquable.

## 11. Fix erreurs / build

- TypeScript : vérifier types `KkiapayWidget` props après refactor.
- Vérifier import `react-markdown` à ajouter (`npm install react-markdown` via package.json).
- Lint Supabase final.
- Aucun `console.log` résiduel.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/KkiapayWidget.tsx` | Refonte programmatique (popup au lieu de custom element) |
| `src/pages/client/Adhesion.tsx` | onSuccess insert paiement + toast |
| `src/pages/client/Paiements.tsx` | Toast sur realtime + KkiaPay refacto |
| `src/pages/client/Dashboard.tsx` | Refonte cards horizontales + accordéons + smart widgets |
| `src/pages/client/Notifications.tsx` | Nouveau — historique notifs |
| `src/pages/admin/Dashboard.tsx` | Refonte premium + heatmap + funnel + RAZ fallbacks |
| `src/pages/admin/Reporting.tsx` | Bouton export PDF mensuel |
| `src/components/landing/FormulesSection.tsx` | Supprimer bloc "Transparence tarifaire" |
| `src/components/landing/SimulateurSection.tsx` | Tabs Résumé / Détails admin |
| `src/components/ChatBot.tsx` | Branding premium + Fast-Track + react-markdown |
| `src/components/FastTrackSinistreModal.tsx` | Nouveau modal multi-étapes |
| `src/pages/AdminLogin.tsx` | Retirer mention demo |
| `src/layouts/ClientLayout.tsx` | Cloche notifs + lien Notifications |
| `index.html` | SEO meta + JSON-LD + lang fr |
| `supabase/functions/chat-ai/index.ts` | System prompt enrichi |
| Migration SQL | TRUNCATE tables data + table `notifications` + RLS |

## Ordre d'exécution

1. Fix KkiaPay (bloquant pour le flow paiement)
2. Suppression bloc "Transparence tarifaire" + mention demo admin
3. RAZ data (TRUNCATE) + table notifications + retrait mock admin Dashboard
4. Refonte Dashboards client + admin (style Digisurance)
5. Simulateur Tabs Résumé/Admin
6. ChatBot premium + Fast-Track + react-markdown
7. Page Reporting PDF mensuel
8. SEO + accessibilité landing
9. Innovations widgets (smart suggestions, funnel, heatmap)
10. Build clean + lint final

