import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'assistant virtuel AssurDignité de SONAM VIE. Tu réponds en français, de manière professionnelle et chaleureuse.

PRODUIT : AssurDignité est une assurance obsèques par SONAM VIE (Côte d'Ivoire).
- 70% prestations en nature (cercueil, conservation corps, transport, inhumation) + 30% capital espèces versé en <12h.

FORMULES :
- Formule A "Dignité Simple" : Principal 1 500 000 FCFA, Conjoint 1 500 000, Enfant 150 000, Ascendant 750 000
- Formule B "Serein" : Principal 2 000 000 FCFA, Conjoint 2 000 000, Enfant 200 000, Ascendant 1 500 000
- Formule C "Prestige" : Principal 3 000 000 FCFA, Conjoint 3 000 000, Enfant 300 000, Ascendant 2 500 000
- Formule D "Excellence" : Principal 5 000 000 FCFA, Conjoint 5 000 000, Enfant 500 000, Ascendant 3 500 000

ÉLIGIBILITÉ :
- Principal : 18-64 ans
- Conjoint : jusqu'à 64 ans
- Enfants : jusqu'à 21 ans (max 4)
- Ascendants : jusqu'à 79 ans (père, mère, oncle, tante, max 2)

BONUS FIDÉLITÉ-SANTÉ : Aucun sinistre pendant 3 ans = 30% des primes nettes cumulées remboursées.

PAIEMENT : Annuel uniquement. Wave, Orange Money, Moov Money, MTN Money, virement bancaire.

CONTACT : 📞 27 20 31 71 82 / 05 95 45 21 65 | 📧 servicecommercialsonamvie@sonam.ci
Adresse : Immeuble SONAM, Plateau, Abidjan, Côte d'Ivoire

CALCUL : Basé sur la table de mortalité CIMA H. Prime = f(âge, formule, composition familiale).

SINISTRE : Déclaration via l'Espace Client, section Sinistre Fast-Track. Capital espèces versé en <12h.

DOCUMENTS NÉCESSAIRES : CNI/passeport, photo d'identité, acte de mariage (si conjoint), actes de naissance enfants. Pour sinistre : acte de décès, certificat médical, pièce d'identité bénéficiaire.

Réponds de manière concise et utile. Utilise des listes à puces quand c'est pertinent. Si tu ne connais pas la réponse, oriente vers le service commercial.`;

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
