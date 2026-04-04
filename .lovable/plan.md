

# Plan complet — Application AssurDignité by SONAM VIE

## Charte graphique
- Couleurs SONAM VIE : violet foncé (#4A0E78), vert (#6AB04C), blanc, avec accents du logo AssurDignité (bleu #1B3A6B, vert #2E8B57)
- Les deux logos (SONAM VIE + AssurDignité) affichés côte à côte dans le header
- Design premium, inspiré de yakoafricassur.com avec animations fluides (fade-in, slide-up, parallax)
- Mode sombre/clair disponible partout

---

## PARTIE 1 — Landing Page Premium

### Header
- Double logo (SONAM VIE + AssurDignité)
- Navigation : Accueil, Nos Formules, Simulateur, À Propos, Contact
- Boutons : « Espace Client », « Espace Admin »
- Sticky header avec effet blur au scroll

### Hero Section
- Titre accrocheur sur AssurDignité avec animation de texte
- Image de famille africaine générée (placeholder artistique)
- CTA : « Simuler ma prime » + « Nous contacter »
- Statistiques animées (nombre de clients, années d'expérience, etc.)

### Section Formules (A/B/C/D)
- 4 cartes visuelles : Dignité Simple, Serein, Prestige, Excellence
- Répartition 70% Nature / 30% Espèces pour chaque formule
- Capitaux affichés, bouton « Souscrire »

### Section « Nos Avantages »
- Bonus Fidélité-Santé 30%, Solidarité Famille, Paiement <12h, Simplicité digitale
- Icônes animées et illustrations

### Section Notre ADN (Vision, Mission, Valeurs)

### Témoignages clients (carousel)

### Partenaires (logos défilants)

### Section Contact
- Tél : 27 20 31 71 82 / 05 95 45 21 65
- Email : servicecommercialsonamvie@sonam.ci
- Formulaire de contact

### Newsletter + Footer complet

---

## PARTIE 2 — Simulateur de Prime (Moteur actuariel complet)

Implémentation exacte du moteur de tarification basé sur les fichiers fournis :

- **Entrées** : Date de souscription, option (A/B/C/D), DOB de chaque assuré
- **Périodicité** : Annuel uniquement (comme demandé)
- **Assurés** : Principal, conjoint (optionnel), enfants 0-4, ascendants 0-2 (oncle, tante, etc.)
- **Table CIMA H** : Intégrée complètement (D, N, M pour âges 0 à 106)
- **Formule** : PAP = Capital × (M[a] - M[a+1]) / (N[a] - N[a+1])
- **Calcul** : PAP_total → PAI (×1.002) → PAC (÷0.85) → Prime due (PAC + 2500 FCFA)
- **Contrôles** : Principal ≤64 ans, enfants ≤21, ascendants ≤79
- **Affichage** : Ventilation détaillée par personne, âges, capitaux, éligibilité

---

## PARTIE 3 — Formulaire d'Adhésion (parcours complet)

Étapes dans l'ordre exact :
1. **Simulation** → Le client simule d'abord sa prime
2. **Choix de formule** (A/B/C/D) basé sur les résultats de simulation
3. **Informations personnelles** (KYC) de l'assuré principal et son épouse
4. **Assurés complémentaires** : nom, DOB, lien de parenté + 1 prestation en nature chacun
5. **Bénéficiaires** : nom de l'aîné, lien de parenté (pas de pourcentage), option choisie
6. **Prestations en nature** (liste déroulante : cercueil, conservation du corps, transport, inhumation…)
7. **Ayants-droits non assurés** : enfants nés ou à naître, autres noms/numéros
8. **Questionnaire médical** avec mention légale obligatoire sur la véracité des déclarations
9. **Appartenance de groupe** (association, groupe fictif…)
10. **Conditions générales** : lecture obligatoire complète + validation en bas
11. **Paiement** : Mobile Money (Wave, Orange, Moov, MTN) avec logos + virement bancaire (joindre RIB) + cash
12. **Conditions particulières** : affichées après paiement réussi
13. **Signature électronique** (OTP)
14. **Reçu PDF** téléchargeable brandé SONAM VIE avec logo

---

## PARTIE 4 — Espace Client Particulier (sidebar + 9 sections)

- **Tableau de bord** : statut contrat, échéance, bonus fidélité 30%, carte récap, raccourcis
- **Souscrire** : accès au simulateur + formulaire d'adhésion
- **Mes Contrats** : liste, détails, historique, téléchargement attestation/police PDF
- **Paiements** : payer (annuel), historique, reçus, paiement automatique
- **Mes Bénéficiaires** : CRUD, historique, téléchargement fiche
- **Sinistre Fast-Track** : déclaration <5min, checklist, upload docs, suivi temps réel, coordonnées paiement
- **Assistance** : hotlines SONAM VIE, assistance funéraire/rapatriement, FAQ
- **Documents** : police, CG, CP, reçus, guides
- **Profil** : KYC, notifications, sécurité OTP/PIN

## PARTIE 5 — Espace Groupe (Entreprise/Association/Mutuelle)

- **Tableau de bord groupe** : effectif, primes dues, alertes
- **Créer/Gérer Groupe** : formulaire complet, formules, paramétrage paiement
- **Personnel & Membres** : tableau filtrable, import CSV/Excel, mouvements
- **Tarifs & Primes** : grille, calcul automatique, répartition employeur/salarié
- **Paiements Groupe** : paiement global, factures, historique
- **Sinistres Groupe** : déclaration pour tout membre, suivi
- **Rapports** : effectif, persistance, sinistralité, export Excel/PDF
- **Documents Groupe** : convention, attestations individuelles

---

## PARTIE 6 — Espace Admin / Back-office SONAM VIE

Design sombre et professionnel, même charte. Accès par rôles (Super Admin, Gestionnaire Sinistres, Comptable, Commercial, Actuaire, Compliance).

### Modules :
1. **Tableau de bord** : KPIs temps réel, graphiques Chart.js (portefeuille, sinistralité, répartition formules), alertes prioritaires
2. **Paramétrage Produit** : formules, capitaux, prestations nature, options avancées, table CIMA H, chargements, bonus fidélité, carences/exclusions
3. **Gestion Contrats** : recherche avancée, émission police, renouvellement, suspension, résiliation, endossements, export
4. **Encaissements & Finances** : réconciliation Mobile Money, relances auto, quittances/factures, tableau financier, commissions
5. **Gestion Sinistres** : workflow complet (déclaration → contrôle → validation → paiement), checklist pièces, suivi délais, paiement bénéficiaire, statistiques
6. **Anti-fraude & Conformité** : détection anomalies questionnaires, alertes mentions médicales suspectes, KYC/AML, journal audit, liste noire
7. **Reporting** : dashboards dynamiques filtables, export PDF/Excel
8. **Utilisateurs & Rôles** : gestion comptes, permissions fines, journal connexions
9. **Contenus & Communication** : FAQ, documents légaux, modèles notifications
10. **Outils Avancés** : simulateur interne, import massif CSV, recherche globale

---

## PARTIE 7 — Chatbot FAQ Intelligent

- Widget flottant en bas à droite, design premium aux couleurs SONAM
- Base de connaissances complète sur AssurDignité (formules, tarifs, souscription, sinistres, FAQ)
- Réponses formatées en markdown avec typographie soignée
- Suggestions de questions fréquentes
- Historique de conversation
- Escalade vers contact humain si besoin

---

## Fonctionnalités transversales
- Notifications en temps réel (bell icon)
- Mode sombre / clair
- Recherche rapide globale
- 100% responsive (mobile first)
- Animations premium (framer-motion)
- Images de familles africaines générées (placeholders SVG artistiques)

## Stack technique
- React + TypeScript + Tailwind CSS + shadcn/ui
- Lovable Cloud (auth, DB, storage, edge functions)
- Framer Motion pour animations
- Recharts pour graphiques admin
- react-markdown pour chatbot
- Génération PDF côté client

