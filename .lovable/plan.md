Objectif : stabiliser l’OCR sur web/mobile, garantir que les signatures et le stamp SONAM VIE apparaissent dans tous les PDF, et corriger les incohérences principales entre souscription, paiement et documents.

Plan d’implémentation :

1. Corriger l’OCR caméra et upload mobile
- Séparer clairement deux actions : “Prendre une photo” et “Choisir depuis galerie/fichiers”.
- Retirer `capture="environment"` du bouton upload pour éviter que le mobile force la caméra au lieu de la galerie.
- Ajouter un second input dédié caméra avec `capture="environment"`, déclenché uniquement par le bouton caméra si besoin.
- Rendre la vidéo visible et fiable : `autoPlay`, `playsInline`, `muted`, fond clair d’erreur si la caméra ne démarre pas, message permissions navigateur, et appel caméra directement depuis le clic utilisateur.
- Ajouter un fallback mobile propre si `getUserMedia` échoue : proposer immédiatement galerie/fichier.
- Réinitialiser la valeur de l’input après sélection pour permettre de re-sélectionner la même image.

2. Corriger la logique d’OCR dans le formulaire
- Garder le scanner sur l’étape KYC principal et l’ajouter aussi à l’étape conjoint si demandé, pour pré-remplir nom/prénom/date de naissance du conjoint.
- Mapper les champs extraits de façon plus tolérante (`first_name`, `prenom`, `last_name`, `nom`, `date_naissance`, etc.) afin que l’auto-remplissage fonctionne même si l’IA renvoie des clés légèrement différentes.
- Afficher clairement les aperçus recto/verso et permettre “Analyser maintenant” dès le recto chargé.

3. Persister la signature utilisateur dans le contrat
- Dans `Adhesion.tsx`, convertir la signature canvas en `data:image/png` au moment de finaliser.
- Enregistrer cette valeur dans `contracts.signature_data_url` lors de la création du contrat.
- Corriger le paiement créé avant contrat : l’étape paiement de l’adhésion crée actuellement un paiement sans `contract_id`, puis un second paiement signé peut être créé comme payé. Je vais éviter les doublons en gardant la référence paiement déclarée et en la rattachant/validant au contrat final quand possible.

4. Corriger les PDF générés à la fin de l’adhésion
- Utiliser les helpers partagés `pdfSignatureBlock` et `pdfSonamStamp` dans les PDF de souscription immédiats : police, attestation et reçu.
- Ajouter le stamp SONAM VIE visible dans la police PDF, le reçu PDF et l’attestation PDF.
- Ajouter la signature du souscripteur dans la police PDF et le reçu PDF; dans l’attestation, ajouter un bloc souscripteur plus propre si pertinent.
- Ajuster les positions pour éviter que stamp/signature soient trop bas, hors page ou recouverts.

5. Améliorer les PDF dans la page Documents
- Renforcer le stamp vectoriel : couleur plus visible, label central plus lisible, pas de texte courbe fragile si cela rend mal dans jsPDF.
- Agrandir/équilibrer les logos dans l’en-tête et ajouter des protections contre débordement du texte contact.
- Uniformiser police, attestation, reçu et conditions particulières avec le même header/footer, blocs signature, cachet et espacement.
- Prévoir un saut de page automatique avant les signatures/stamps quand le contenu est trop long.

6. Corriger les incohérences web/mobile principales liées au paiement et aux documents
- Faire en sorte que les documents actifs utilisent le contrat le plus récent/pertinent et non un ancien contrat actif arbitraire.
- Après finalisation de signature, créer/mettre à jour les paiements avec `contract_id` et statut cohérent.
- Harmoniser les messages : paiement déclaré/en attente vs paiement simulé/payé afin que le reçu ne soit disponible que lorsque le paiement est marqué payé.
- Vérifier les inputs fichiers/selfie existants pour retirer les `capture` forcés là où l’utilisateur doit pouvoir choisir galerie/fichier.

7. Vérification
- Tester dans le navigateur local les chemins principaux : OCR upload, caméra fallback, signature, finalisation, génération PDF.
- Inspecter visuellement les PDF générés en les convertissant en images pour confirmer : logos visibles, signature visible, stamp SONAM VIE visible, aucun chevauchement majeur.