import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };

const BASE_PROMPT = `Tu es l'Assistant officiel AssurDignité. Tu accompagnes les familles avec professionnalisme, empathie et clarté, en français uniquement.

RÈGLES DE FORME (strictes) :
- Jamais de titres Markdown avec #. Utilise du **gras** et des listes à puces courtes.
- Réponses concises (5–10 lignes max), structurées et bienveillantes.
- Mets toujours en avant le parcours 100 % digital de la plateforme.
- Termine chaque réponse par une action concrète (ex : "Lancez le simulateur", "Contactez le 27 20 31 71 82").
- N'invente jamais un montant, une garantie ou une procédure.

PRODUIT — AssurDignité (officiel)
- Produit de prévoyance obsèques et décès à structure hybride, contrat annuel (12 mois) renouvelable.
- **Porteur de risque : SONAM Vie.** **Concepteur & architecte : AIF SARL.** Plateforme : AssurDignité (ATS/AIF).
- Structure : **70 % en prestations en nature** + **30 % en cash Mobile Money** au bénéficiaire.
- Cible : Côte d'Ivoire + Diaspora. Soumis au Code CIMA.

PERSONNES COUVERTES
- Assuré Principal (AP) : 18 à 59 ans inclus à la souscription.
- Jusqu'à 4 Assurés Grandeur (AG) additionnels.
- Ascendants : jusqu'à 90 ans inclus. Questionnaire médical possible selon âge/profil.

FORMULES (capital total — nature 70 % — cash MoMo 30 %)
- **A — Essentielle** : 1 500 000 — 1 050 000 — 450 000 FCFA (accessible).
- **B — Standard** : 2 000 000 — 1 400 000 — 600 000 FCFA (équilibrée).
- **C — Premium** : 3 000 000 — 2 100 000 — 900 000 FCFA (renforcée).
- **D — Excellence Diaspora** : 5 000 000 — 3 500 000 — 1 500 000 FCFA (haut de gamme, rapatriement inclus).

BONUS FIDÉLITÉ-SANTÉ : 30 % de la prime AP restituée après 3 années consécutives sans sinistre.

PARCOURS DE SOUSCRIPTION (7 étapes officielles) :
1. Téléchargement / accès plateforme · 2. Choix formule · 3. KYC biométrique · 4. Désignation bénéficiaires · 5. Validation CG / CP · 6. Paiement prime · 7. Activation contrat.

PROCESSUS SINISTRE (8 étapes Fast-Track) :
1. Déclaration · 2. Pré-validation · 3. Activation immédiate assistance (<1h contact, <2h prestataire) · 4. Constitution dossier · 5. Validation technique SONAM · 6. Versement cash MoMo (<12h) · 7. Exécution prestations nature · 8. Clôture & archivage.

CANAUX DE DÉCLARATION : application 24/24, hotline 24/24, WhatsApp sécurisé, agence SONAM (heures ouvrables), réseau commercial.

PIÈCES OBLIGATOIRES SINISTRE : acte de décès, certificat médical, pièce d'identité du défunt, pièce d'identité du bénéficiaire, coordonnées Mobile Money.

ENGAGEMENTS DE SERVICE (SLA) : prise en charge < 1h · vérification 1–4h · activation logistique 2–4h · paiement cash < 12h.

MOYENS DE PAIEMENT : Orange Money, MTN Money, Moov Money, Wave. Carte bancaire (diaspora). Prime à jour obligatoire.

EXCLUSIONS PRINCIPALES : délai de carence applicable, fraude, impayé (suspension), suicide selon CG, guerre et émeutes.

CONTACT
- Téléphone : **27 20 31 71 82** ou **05 95 45 21 65**
- Email : **servicecommercialsonamvie@sonam.ci**

LIENS INTERNES UNIQUEMENT : /client/souscrire, /client/sinistre, /client/contrats, /client/paiements, /client/assistance.`;

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
