import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Profile {
  age: number;
  hasConjoint: boolean;
  nbEnfants: number;
  nbAscendants: number;
  budgetAnnuel?: number; // FCFA, optional
  situation?: string; // free text
}

const FORMULES = [
  { key: "A", nom: "Dignité Simple", capital: 1_500_000, idealPour: "budget maîtrisé, célibataire ou jeune couple" },
  { key: "B", nom: "Serein", capital: 2_000_000, idealPour: "famille avec enfants, sécurité équilibrée" },
  { key: "C", nom: "Prestige", capital: 3_000_000, idealPour: "famille élargie, ascendants à protéger" },
  { key: "D", nom: "Excellence", capital: 5_000_000, idealPour: "diaspora, rapatriement, capital maximal" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const profile: Profile = await req.json();
    if (typeof profile.age !== "number") {
      return new Response(JSON.stringify({ error: "age requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `Tu es un conseiller AssurDignité (SONAM VIE). Tu recommandes UNE formule (A/B/C/D) à partir du profil familial.

FORMULES OFFICIELLES :
${FORMULES.map(f => `- ${f.key} ${f.nom} : ${f.capital.toLocaleString("fr-FR")} FCFA capital principal — idéal pour ${f.idealPour}`).join("\n")}

RÈGLES :
- Renvoie STRICTEMENT un JSON valide, sans markdown ni texte hors JSON.
- Schéma : {"formule":"A|B|C|D","titre":"...","justification":"2-3 phrases empathiques, pro, en français","points":["3 bullets courts max 12 mots chacun"],"alternative":"A|B|C|D"}
- "alternative" = autre formule pertinente pour comparer.
- Tiens compte de : âge (jeune → plus long horizon), nombre d'enfants/ascendants (capital versé à 100% en espèces), budget annuel si fourni, situation (diaspora → privilégier D).
- Pas de prix dans la justification (calculs faits côté app).`;

    const userPrompt = `Profil :
- Âge : ${profile.age} ans
- Conjoint : ${profile.hasConjoint ? "oui" : "non"}
- Enfants : ${profile.nbEnfants}
- Ascendants à charge : ${profile.nbAscendants}
${profile.budgetAnnuel ? `- Budget annuel souhaité : ${profile.budgetAnnuel.toLocaleString("fr-FR")} FCFA` : ""}
${profile.situation ? `- Situation : ${profile.situation}` : ""}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(
        JSON.stringify({
          error: aiResp.status === 429 ? "Trop de requêtes" : aiResp.status === 402 ? "Crédits IA épuisés" : "Erreur IA",
        }),
        { status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await aiResp.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { formule: "B", titre: "Recommandation", justification: raw, points: [], alternative: "C" }; }

    if (!["A", "B", "C", "D"].includes(parsed.formule)) parsed.formule = "B";
    if (!["A", "B", "C", "D"].includes(parsed.alternative)) parsed.alternative = parsed.formule === "B" ? "C" : "B";

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-formula error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
