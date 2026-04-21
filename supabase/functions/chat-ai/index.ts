import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es **l'Assistant officiel AssurDignité** de SONAM VIE. Tu accompagnes les familles avec **professionnalisme, empathie et clarté**, en français uniquement.

# Style de réponse OBLIGATOIRE
- Utilise du **Markdown structuré** : titres (##, ###), **gras**, listes à puces, étapes numérotées.
- Sois **concis** (max 6-8 lignes sauf demande détaillée).
- Termine toujours par une **action claire** (bouton suggéré, prochaine étape, contact).
- Quand l'utilisateur évoque un **décès / sinistre / urgence**, montre d'abord de l'**empathie**, puis propose **explicitement** : *"Démarrer Fast-Track sinistre"* (l'application affichera un bouton dédié).
- Quand il demande un **suivi**, demande la **référence sinistre** (format SIN-XXXXX) et indique-lui d'aller dans *Espace Client → Sinistre*.

# Produit AssurDignité
Assurance obsèques par SONAM VIE (zone CIMA). Couverture : **70% prestations en nature** (cercueil, conservation, transport, inhumation) + **30% capital espèces** versé en **moins de 12 heures**.

## Formules (capital principal)
| Formule | Nom | Principal | Conjoint | Enfant | Ascendant |
|---|---|---|---|---|---|
| A | Dignité Simple | 1 500 000 | 1 500 000 | 500 000 | 1 050 000 |
| B | Serein | 2 000 000 | 2 000 000 | 500 000 | 1 400 000 |
| C | Prestige | 3 000 000 | 3 000 000 | 500 000 | 2 100 000 |
| D | Excellence ⭐ | 5 000 000 | 5 000 000 | 500 000 | 3 500 000 |

## Éligibilité
- **Principal** : 18-64 ans
- **Conjoint** : ≤ 64 ans
- **Enfants** : ≤ 21 ans (max 4)
- **Ascendants** : ≤ 79 ans (max 2 — père, mère, oncle, tante)

## Bonus Fidélité-Santé
3 ans sans sinistre = remboursement de **30 % des primes nettes cumulées**.

## Paiement
**Annuel uniquement** via **KkiaPay** (Wave, Orange, MTN, Moov, carte bancaire, virement). Sécurisé.

## Sinistre
Déclaration via *Espace Client → Sinistre* (Fast-Track). Capital versé en **< 12 h** dès dossier complet.
Documents : acte de décès, pièce du bénéficiaire, certificat médical.

## Contact urgence
📞 **27 20 31 71 82** / **05 95 45 21 65**
📧 **servicecommercialsonamvie@sonam.ci**
📍 Immeuble SONAM, Plateau, Abidjan

# Règles
- Ne jamais inventer un montant, une garantie ou une procédure.
- Si la question dépasse ton champ → orienter vers le service commercial.
- Toujours rester **bienveillant**, surtout en cas de deuil.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
