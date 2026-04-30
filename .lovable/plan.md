## Auto-remplissage des champs depuis la vérification Didit

Oui, c'est possible. Didit retourne dans le webhook (et dans le résultat `onComplete` du SDK) les données extraites du document : nom, prénom, date de naissance, numéro de pièce, adresse, etc. On va les pousser automatiquement dans les champs de l'étape « KYC Principal ».

### Flux fonctionnel

1. L'utilisateur lance la vérification Nirva/Didit.
2. Didit scanne sa CNI/passeport + selfie liveness.
3. Dès que le statut passe à `approved`, on récupère les champs extraits depuis `kyc_payload`.
4. Les champs **Nom, Prénom, Date de naissance, N° CNI/Passeport, Adresse** se remplissent automatiquement (animation douce).
5. Un petit bandeau « Champs renseignés automatiquement depuis votre pièce d'identité — vous pouvez les modifier si besoin » s'affiche.
6. L'utilisateur garde la main : il peut corriger un champ avant de passer à l'étape suivante.

Email et Téléphone restent saisis manuellement (Didit ne les capture pas de manière fiable).

### Modifications techniques

**1. `supabase/functions/didit-webhook/index.ts`**
- Extraire les données du document depuis le payload Didit (champs typiques : `decision.kyc.first_name`, `last_name`, `date_of_birth`, `document_number`, `address`, `nationality`, `gender`). Selon la version de l'API ils peuvent être sous `id_verification`, `vendor_data`, ou directement à la racine.
- Sauver le payload complet dans `profiles.kyc_payload` (déjà fait) — pas de migration nécessaire.

**2. `src/components/kyc/DiditVerification.tsx`**
- Ajouter un prop `onExtractedData?: (data: ExtractedKycData) => void`.
- Type :
  ```ts
  type ExtractedKycData = {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;  // ISO YYYY-MM-DD
    document_number?: string;
    address?: string;
  };
  ```
- Helper `parseDiditPayload(payload)` : navigue dans les chemins possibles du payload pour extraire ces champs (robuste aux variantes de format Didit v3).
- Deux endroits où on appelle `onExtractedData` :
  - Dans `sdkRef.current.onComplete` quand `result.session` contient les données (cas où l'utilisateur termine sans fermer la modale).
  - Dans le subscriber realtime sur `profiles` (cas webhook arrivé) : on relit `kyc_payload` et on parse.
- Dédoublonner avec un `useRef<boolean>` pour ne pas écraser deux fois si l'utilisateur a déjà édité un champ.

**3. `src/pages/client/Adhesion.tsx` (étape 2 KYC Principal)**
- Passer `onExtractedData` au `<DiditVerification />` :
  ```tsx
  onExtractedData={(d) => {
    setKyc(prev => ({
      ...prev,
      nom: prev.nom || d.last_name || '',
      prenom: prev.prenom || d.first_name || '',
      dob: prev.dob || d.date_of_birth || '',
      cni: prev.cni || d.document_number || '',
      adresse: prev.adresse || d.address || '',
    }));
    setAutoFilled(true);
  }}
  ```
  (On ne remplace que les champs vides pour ne pas écraser une saisie utilisateur en cours.)
- Ajouter un `useState` `autoFilled` et afficher un petit bandeau vert (icône `Sparkles` ou `ShieldCheck`) au-dessus du formulaire quand `true`.
- Animation `framer-motion` : highlight pulse sur les champs remplis pendant ~1.5s.

### Notes

- Les noms exacts des champs renvoyés par Didit dépendent du workflow configuré (Document + Liveness vs Document + AML, etc.). Le helper de parsing tentera plusieurs chemins (`decision.kyc.*`, `decision.id_verification.*`, racine) pour être robuste.
- Si un champ est introuvable dans le payload, on ne touche pas au champ correspondant — pas de régression.
- Pour le conjoint (étape 3), on n'active pas l'auto-fill par défaut (le payload concerne l'assuré principal). On peut l'ajouter plus tard si tu veux.

### Fichiers modifiés

- `supabase/functions/didit-webhook/index.ts` (s'assurer que tout le payload est bien stocké)
- `src/components/kyc/DiditVerification.tsx` (extraction + nouveau prop)
- `src/pages/client/Adhesion.tsx` (consommation + bandeau visuel)
