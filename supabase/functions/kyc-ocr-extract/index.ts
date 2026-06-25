// OCR extraction for ID documents using Lovable AI Vision (Gemini 2.5 Pro)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { image, image2 } = await req.json();
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'image (base64 data URL) is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const userContent: any[] = [
      {
        type: 'text',
        text: `Tu es un expert en lecture optique de documents d'identité (CNI, passeport, permis) ouest-africains et internationaux.
Analyse l'image (recto et éventuellement verso) et extrais les informations clés avec PRECISION.
- Pour la date de naissance, retourne TOUJOURS le format ISO YYYY-MM-DD.
- Si une information est illisible, retourne null pour ce champ.
- N'invente AUCUNE valeur. Ne devine pas.
- Le numéro de document est exactement tel qu'imprimé (sans espaces).
Appelle obligatoirement la fonction extract_id_data avec les valeurs trouvées.`,
      },
      { type: 'image_url', image_url: { url: image } },
    ];
    if (image2 && typeof image2 === 'string') {
      userContent.push({ type: 'image_url', image_url: { url: image2 } });
    }

    const tool = {
      type: 'function',
      function: {
        name: 'extract_id_data',
        description: "Retourne les informations extraites du document d'identité.",
        parameters: {
          type: 'object',
          properties: {
            first_name: { type: 'string', description: 'Prénom(s)' },
            last_name: { type: 'string', description: 'Nom de famille' },
            date_of_birth: { type: 'string', description: 'Date de naissance au format YYYY-MM-DD' },
            document_number: { type: 'string', description: 'Numéro CNI ou passeport' },
            document_type: { type: 'string', enum: ['cni', 'passport', 'driving_license', 'other'] },
            address: { type: 'string', description: 'Adresse complète si présente' },
            nationality: { type: 'string' },
            gender: { type: 'string', enum: ['M', 'F', 'X'] },
            place_of_birth: { type: 'string' },
            issue_date: { type: 'string', description: 'YYYY-MM-DD' },
            expiry_date: { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['first_name', 'last_name', 'document_type'],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es un OCR expert. Tu DOIS appeler la fonction extract_id_data.' },
          { role: 'user', content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: 'function', function: { name: 'extract_id_data' } },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('AI gateway error', resp.status, txt);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits AI épuisés. Veuillez recharger votre espace." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error ${resp.status}`);
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "Aucune information détectée. Réessayez avec une photo plus nette." }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let extracted: any;
    try {
      extracted = JSON.parse(call.function.arguments);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Réponse OCR invalide' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: extracted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('kyc-ocr-extract error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur inconnue' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
