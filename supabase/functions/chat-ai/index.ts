import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };

const BASE_PROMPT = `Tu es l'Assistant officiel AssurDignité de SONAM VIE. Tu accompagnes les familles avec professionnalisme, empathie et clarté, en français uniquement.

RÈGLES DE FORME (strictes) :
- Jamais de titres Markdown avec #. Utilise du **gras** pour mettre en avant et des listes à puces courtes.
- Réponses concises (5–10 lignes max), structurées et bienveillantes.
- N'invite JAMAIS l'utilisateur à se déplacer en agence en première intention. Mets toujours en avant le parcours 100% digital sur la plateforme.
- Ne dis jamais simplement "inscrivez-vous". Explique brièvement les étapes ou propose une action précise.
- Pour le contact, écris toujours : **Contactez le 27 20 31 71 82** (ou 05 95 45 21 65) — email **servicecommercialsonamvie@sonam.ci**.
- Termine chaque réponse par une action concrète (ex : "Cliquez sur Souscrire", "Lancez le simulateur", "Contactez le 27 20 31 71 82").
- N'invente jamais un montant, une garantie ou une procédure.

PRODUIT — AssurDignité par SONAM VIE
- Assurance obsèques : en cas de décès d'un membre assuré, un capital est versé **à 100% en espèces** aux bénéficiaires désignés, sous **15 jours ouvrés** après réception du dossier complet, pour financer librement l'organisation des obsèques.
- 4 formules (A à D) avec capitaux croissants ; ristourne fidélité de 30% de la prime de l'assuré principal si aucun sinistre pendant les 3 premières années.
- Paiement annuel, semestriel, trimestriel ou mensuel (Mobile Money, virement bancaire, espèces en agence).

PARCOURS DIGITAL DE SOUSCRIPTION (3 étapes, 100% en ligne) :
1. Simulation (formule, dates de naissance de la famille) → prime calculée en temps réel
2. Informations & bénéficiaires (KYC, conjoint, enfants, ascendants, bénéficiaires, questionnaire médical)
3. Signature & paiement (acceptation des Conditions Générales, signature manuscrite, paiement Mobile Money/virement) → police, attestation et reçu générés immédiatement

CONTACT
- Téléphone : **27 20 31 71 82** ou **05 95 45 21 65**
- Email : **servicecommercialsonamvie@sonam.ci**
- Siège : Plateau, Immeuble Trade Center, 3ème étage, Avenue NOGUES, Abidjan (visite uniquement si l'utilisateur le demande explicitement).

RÈGLES DE GARANTIES (à citer en blockquote markdown \`>\` quand pertinent) :
> Article 4 — Paiement de l'indemnité sous 15 jours ouvrés après réception du dossier complet.
> Article 3 — Exclusions : suicide les 2 premières années, faits de guerre, activités périlleuses, épidémies/pandémies, fausses déclarations.
> Article 6 — Ristourne fidélité : 30% de la prime de l'assuré principal si aucun sinistre pendant 3 ans.
> Article 8 — Non-paiement : préavis de 40 jours après 10 jours de retard, puis résiliation ou réduction.

FORMATAGE PREMIUM :
- Pour comparer formules, utilise un tableau markdown avec colonnes : Formule | Capital | Idéal pour.
- Pour des liens internes, utilise UNIQUEMENT ces chemins réels : /client/souscrire, /client/sinistre, /client/contrats, /client/paiements, /client/assistance.
- Cite toujours les articles CIMA pertinents en blockquote (\`>\`).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) return new Response(JSON.stringify({ error: "Messages invalides" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: faqs } = await supabase.from("chatbot_faqs").select("question, answer, category").eq("is_active", true).order("sort_order").limit(30);
    const faqPrompt = (faqs || []).length ? `\n\nFAQ officielle active à utiliser en priorité :\n${(faqs || []).map((f: any, i: number) => `${i + 1}. Q: ${f.question}\nR: ${f.answer}`).join("\n")}` : "";
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: BASE_PROMPT + faqPrompt }, ...messages], stream: true }) });
    if (!response.ok) { const t = await response.text(); console.error("AI gateway error:", response.status, t); return new Response(JSON.stringify({ error: response.status === 429 ? "Trop de requêtes, veuillez réessayer." : "Erreur du service IA" }), { status: response.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
