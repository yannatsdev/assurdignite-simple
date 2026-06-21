## Priorité 1 — Fix bloquant paiement

**Cause racine identifiée** : la fonction `public.has_role(uuid, app_role)` n'a pas le droit `EXECUTE` pour les rôles `anon` et `authenticated`. Toutes les policies RLS de `paiements`, `contracts`, `beneficiaires`, etc. appellent `has_role(...)` ; dès qu'un utilisateur connecté tente d'insérer un paiement, PostgreSQL évalue la policy admin, échoue sur la fonction et renvoie `permission denied for function has_role`. C'est ce qui bloque la finalisation du paiement.

### Migration à appliquer

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
```

Aucun changement de schéma, aucune policy modifiée, aucun risque de privilège : la fonction est `SECURITY DEFINER` et ne fait que lire `user_roles`.

### Vérification après migration
- Re-tenter un paiement depuis `/client/adhesion` → checkout.
- Vérifier les logs auth/postgres : plus d'erreur `permission denied for function has_role`.

---

## Priorité 2 — Clarifications nécessaires avant d'aller plus loin

Tu demandes aussi « améliorer la landing, la plateforme, ajouter de l'innovation, la rendre plus smart, fixer toutes les autres erreurs ». C'est trop large pour partir tête baissée sans casser ce qui marche. Je propose de livrer d'abord le fix paiement ci-dessus, puis de cadrer le reste avec toi via 2-3 questions ciblées (sections de la landing à retravailler, fonctionnalités « smart » souhaitées : recommandation de formule par IA, pré-remplissage KYC, assistant sinistre, etc., et liste précise des autres erreurs que tu observes avec captures/messages).

### Hors scope de ce plan
- Refonte visuelle de la landing
- Nouvelles fonctionnalités IA
- Autres bugs non encore décrits

Valide ce plan pour que j'applique le fix paiement, ensuite je te pose les questions de cadrage pour la suite.