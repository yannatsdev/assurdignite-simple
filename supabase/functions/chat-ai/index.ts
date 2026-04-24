import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };

const BASE_PROMPT = `Tu es l'Assistant officiel AssurDignité de SONAM VIE. Tu accompagnes les familles avec professionnalisme, empathie et clarté, en français uniquement.
- N'utilise jamais de titres Markdown avec #. Utilise du gras et des listes courtes.
- Réponses courtes, concrètes et bienveillantes.
- Termine par une action concrète.
- Ne jamais inventer un montant, une garantie ou une procédure.
Produit : assurance obsèques AssurDignité par SONAM VIE. Couverture 70% prestations en nature + 30% capital espèces. Paiement annuel via KkiaPay. Contact : 27 20 31 71 82 / 05 95 45 21 65, servicecommercialsonamvie@sonam.ci. Adresse : Plateau, Immeuble Trade Center, 3ème étage, Avenue NOGUES, Abidjan.`;

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
