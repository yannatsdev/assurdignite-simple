

# Plan — Refonte premium AssurDignité (formules, KkiaPay, admin, design)

## 1. Fix admin login + nouveau code d'accès + admin pré-créé

**`supabase/functions/admin-signup/index.ts`** :
- Changer `ADMIN_ACCESS_CODE = "ADDWARRIORSONAMVIE777"` (au lieu de SONAM2026).
- Bug actuel : le trigger `handle_new_user` crée d'abord le rôle `client`, puis on fait `UPDATE` — mais la fonction édite avant que le trigger ait fini. Remplacer `UPDATE` par `UPSERT` (delete + insert role='admin') en bouclant jusqu'à ce que le rôle existe, ou utiliser `upsert({user_id, role:'admin'}, {onConflict:'user_id,role'})` après suppression du rôle client.
- Après création, vérifier explicitement que `user_roles` contient bien `admin` avant de retourner success.

**`src/pages/AdminLogin.tsx`** :
- Mettre à jour le texte demo : `adminyannsonam@gmail.com / Yannedge50$`.
- Indiquer que le code d'accès est `ADDWARRIORSONAMVIE777`.

**Migration SQL** : créer le compte admin `adminyannsonam@gmail.com / Yannedge50$` directement via une fonction PL/pgSQL appelée une fois (ou via edge function `admin-bootstrap` invoquée au déploiement) — l'utilisateur sera créé dans `auth.users` avec password hashé + rôle admin dans `user_roles`.

## 2. Nouveau moteur actuariel (Excel ASSUR_DIGNITE_v25032026)

**`src/lib/actuarial-engine.ts`** : remplacer entièrement la table CIMA H actuelle par les valeurs lues du fichier Excel (Page 4 — colonnes x, lx, dx, Dx, Nx, Cx, Mx, Rx pour ages 0-106).

**Paramètres** (Page 3) :
- Taux garanti i = 3.50%, v = 1/(1+i) = 0.966183575
- fc (chargement gestion) = 0.002
- fa (chargement acquisition) = 15%
- fi (incitation) = 1%
- Frais accessoire = 2 500 FCFA

**Formules** (basées sur l'Excel) :
```
PAP_personne = Capital × (M_x − M_(x+1)) / D_x       // prime pure annuelle viagère 1 an
PAP_total    = Σ PAP par personne (principal+conjoint+enfants+ascendants)
PAI          = PAP_total × (1 + fc)                    // ×1.002
PAC          = PAI / (1 − fa)                          // ÷0.85
Prime annuelle = PAC + 2 500
```
**Périodicité** (coefficients depuis Excel) :
- Annuel ×1, Semestriel ≈ ×0.5165 (somme exacte calculée), Trimestriel ≈ ×0.2616, Mensuel ≈ ×0.0876, Unique = valeur actualisée totale.
- Ajouter `simulatePrime(input, periodicity)` retournant le bon montant.

**Vérification** : avec principal 40 ans, conjoint 40 ans, 2 enfants 15 ans, 2 asc. 55 ans, formule A → résultat attendu **60 913 FCFA annuel** (PAP_total ≈ 39 629, PAI ≈ 39 708, PAC ≈ 46 715, +2500 ≈ 49 215… ajuster avec fi si nécessaire).

## 3. Cacher le simulateur publiquement

- **`src/pages/Index.tsx`** : retirer `<SimulateurSection />` de la landing.
- **`src/pages/client/Souscrire.tsx`** : remplacer le simulateur par un message "Démarrer mon adhésion" qui mène directement à l'`Adhesion` (le calcul se fait à l'étape 1).
- **`src/pages/client/Adhesion.tsx` Step 1** : conserver le calcul interne.
- **`src/pages/admin/Outils.tsx`** : garder `SimulateurSection` (admin only).

## 4. Intégration KkiaPay (remplace Mobile Money buttons)

**`index.html`** : ajouter `<script src="https://cdn.kkiapay.me/k.js"></script>` avant `</body>`.

**Composant `<KkiapayWidget>`** (`src/components/KkiapayWidget.tsx`) : enveloppe le custom element `<kkiapay-widget>` avec amount, key (publique demo `c0270ce321b4edc06e0127ac06829afd3c45f6c6`), callback URL, et écoute `success`/`failed` events.

**Edge function `kkiapay-webhook`** : reçoit la confirmation KkiaPay → met à jour `paiements.status='paid'` + `contracts.status='active'`. Retourne 200.

**Pages mises à jour** :
- `src/pages/client/Adhesion.tsx` Step 12 (Paiement) : remplace les 4 boutons mobile money par `<KkiapayWidget amount={prime}>`.
- `src/pages/client/Paiements.tsx` : remplace les 4 boutons par KkiaPay.

**Note clés** : démarrage avec la clé publique du brief. Pour live, l'utilisateur fournira plus tard PUBLIC/PRIVATE/SECRET via add_secret.

## 5. Logos PDF base64 (SONAM, AssurDignité, KkiaPay)

**`src/lib/pdf-logos.ts`** : convertir les vrais PNG `logo-sonamvie.png`, `logo-assurdignite.png` + un nouveau `logo-kkiapay.png` (téléchargé) en base64 avec script Node + `sharp` pour optimiser à 200×80 px max. Les 3 logos exportés comme constantes `SONAM_LOGO_B64`, `ASSURDIGNITE_LOGO_B64`, `KKIAPAY_LOGO_B64`.

**`src/pages/client/Documents.tsx` + Adhesion.tsx** : `addPDFHeader(doc)` utilise `doc.addImage()` avec dimensions correctes (logo SONAM 35×14mm gauche, AssurDignité 30×12mm droite). Pied de page reçu : ajout "Paiement sécurisé via KkiaPay" + logo KkiaPay.

**Refonte design PDF** : header bleu SONAM avec gradient, typographie Helvetica bold, encadré bleu pour montants, watermark transparent "AssurDignité", QR code avec ID police, signature client image, table prestations (jspdf-autotable).

## 6. Refonte landing — explication formules + image famille africaine

**`src/components/landing/AvantagesSection.tsx`** : remplacer `family-multigenerational.jpg` par une nouvelle image (générée via AI Lovable nano-banana) montrant **mère, fille, fils, père, grand-mère, grand-père** ensemble dans un cadre africain.

**`src/components/landing/FormulesSection.tsx`** — nouveau bloc "Comment est calculée votre prime ?" sous le titre :
```
1. PAP Total — Prime pure actuarielle (somme par âge de chaque assuré × capital, table CIMA H)
2. PAI = PAP × 1.002 — Ajout des frais de gestion (0.2 %)
3. PAC = PAI ÷ 0.85 — Couverture des frais d'acquisition (15 %)
4. Frais fixes — 2 500 FCFA accessoire administratif
= Prime annuelle TTC
```
Cards animées avec icône, formule visible, explication courte.

**Texte hero** : conserver "Choisissez votre niveau de protection. Chaque formule offre une répartition de 70 % en prestations en nature (Enlèvement, traitement et conservation du corps, Levée de corps, Allocation cercueil et transfert du corps au lieu d'inhumation) et 30 % en capital espèces, avec un paiement en moins de 12 heures."

**Animations** : framer-motion `whileInView` + parallax léger sur hero, marquee logos partenaires, compteurs animés sur stats.

## 7. Footer — vrais liens de partage

**`src/components/landing/Footer.tsx`** : Facebook/LinkedIn/Twitter/WhatsApp deviennent des liens de partage du site :
```
https://www.facebook.com/sharer/sharer.php?u={SITE_URL}
https://www.linkedin.com/sharing/share-offsite/?url={SITE_URL}
https://twitter.com/intent/tweet?url={SITE_URL}&text=AssurDignité
https://wa.me/?text=Découvrez%20AssurDignité%20{SITE_URL}
```
Ajouter aussi WhatsApp et bouton "Copier le lien".

## 8. Refonte UI premium (inspiration screenshot 1)

**Client Dashboard** (`src/pages/client/Dashboard.tsx`) :
- Hero "Hello {prénom} 👋 Complete your profile easily" avec ring de progression % autour de l'avatar.
- Card violette gradient "Police {numéro}" avec champ Policy holder, validity, bouton "Renew now".
- Carrousel "Health & Wellness" avec icônes circulaires colorées (Santé, Famille, Maison, Voyage).
- Section "Quick Actions" avec icône + montant (Sinistre, Bénéficiaires, Documents).
- "Chat with expert" card.
- Bottom navigation mobile (Home, Policies, Benefits, Buy) avec FAB violet central.

**Admin Dashboard** : KPI cards avec mini-graphes sparkline, charts area Recharts responsive, cartes "À traiter aujourd'hui" (sinistres, paiements en attente).

**Layouts** : 
- `ClientLayout` : sidebar collapse mobile + bottom nav.
- `AdminLayout` : header sticky avec recherche globale + cloche notifications.

## 9. KYC avancé + sync backend

**`Adhesion.tsx`** :
- Validation côté client de chaque champ avec zod (CNI obligatoire, photo selfie obligatoire, date de naissance ≥ 18 ans pour principal).
- Upload réel à `kyc-documents/{userId}/{timestamp}_{type}.{ext}` avec progress bar par fichier.
- Sauvegarde des URLs signées dans `contracts.kyc_documents` (jsonb existant) + nouveau row dans `assures_complementaires` pour conjoint/enfants avec leurs propres fichiers.
- Edge function `submit-adhesion` : valide, crée contract + paiement pending + retourne `payment_id` pour KkiaPay.

**Admin Contrats** : visualisation des KYC avec liens signedUrl 1h, badge vert si tous les docs sont uploadés.

## 10. Données live partout

- Dashboard client : real-time subscription sur `paiements`, `sinistres`, `contracts` (canal Supabase).
- Dashboard admin : query agrégée live (count contracts par status, sum paiements par mois).
- Compteurs landing : agrégats publics via fonction RPC `get_public_stats()` (nb contrats actifs, montant total versé sinistres).

## 11. Améliorations responsive globales

- Tous les `Card`, `Table`, `Dialog` avec `overflow-x-auto`.
- Sidebar `Sheet` mobile avec swipe.
- Typographie fluide `text-2xl sm:text-3xl lg:text-4xl`.
- Boutons CTA full-width sur mobile.
- Tests viewport 375×812, 768×1024, 1280×800.

## 12. Nettoyage erreurs

- Vérifier types TypeScript après refonte actuariel.
- Supprimer imports inutilisés (wave/orange/mtn/moov si remplacés par KkiaPay).
- Console logs propres.
- Lint Supabase final.

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/lib/actuarial-engine.ts` | Réécriture complète table + formules Excel |
| `src/lib/pdf-logos.ts` | 3 logos base64 réels |
| `supabase/functions/admin-signup/index.ts` | Code ADDWARRIORSONAMVIE777 + fix UPSERT role |
| `supabase/functions/kkiapay-webhook/index.ts` | Nouveau — confirme paiement |
| `supabase/functions/submit-adhesion/index.ts` | Nouveau — création contrat + KYC |
| `supabase/functions/admin-bootstrap/index.ts` | Nouveau — crée adminyannsonam@gmail.com |
| Migration SQL | Fonction RPC `get_public_stats`, trigger paiements→contracts |
| `index.html` | Script KkiaPay |
| `src/components/KkiapayWidget.tsx` | Nouveau widget |
| `src/pages/AdminLogin.tsx` | Texte demo + code |
| `src/pages/Index.tsx` | Retire SimulateurSection |
| `src/pages/client/Souscrire.tsx` | CTA → Adhesion |
| `src/pages/client/Adhesion.tsx` | KkiaPay + KYC zod + submit-adhesion |
| `src/pages/client/Paiements.tsx` | KkiaPay |
| `src/pages/client/Dashboard.tsx` | Refonte premium screenshot 1 |
| `src/pages/client/Documents.tsx` | PDFs avec vrais logos + design |
| `src/pages/admin/Dashboard.tsx` | KPI premium + sparklines |
| `src/components/landing/FormulesSection.tsx` | Bloc explication formule |
| `src/components/landing/AvantagesSection.tsx` | Nouvelle image famille africaine |
| `src/components/landing/Footer.tsx` | Liens de partage réels |
| `src/components/client/ClientSidebar.tsx` | Bottom nav mobile + FAB |
| `src/layouts/ClientLayout.tsx` + `AdminLayout.tsx` | Responsive headers |
| `src/assets/family-six-members.jpg` | Nouvelle image AI |
| `src/assets/logo-kkiapay.png` | Logo KkiaPay |

## Ordre d'exécution

1. Fix admin (code + UPSERT role + bootstrap user adminyannsonam)
2. Nouveau moteur actuariel + tests
3. Cacher simulateur public
4. KkiaPay (script + widget + edge functions + remplacer mobile money)
5. Logos base64 + redesign PDFs
6. Refonte landing (image famille, explication formules, animations, footer share)
7. Refonte client dashboard (style screenshot 1)
8. Refonte admin dashboard
9. KYC avancé + edge submit-adhesion + données live
10. Responsive global + nettoyage erreurs

