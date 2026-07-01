// OCR extraction for ID documents — fast path (Gemini 2.5 Flash, low tokens, warmup support)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    // Warmup ping — wakes the function without invoking the model.
    if (body?.ping) {
      return new Response(JSON.stringify({ ok: true, warm: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image, image2 } = body;
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
        text: "Extrait les champs de cette pièce d'identité. Dates au format YYYY-MM-DD. null si illisible. N'invente rien. Appelle extract_id_data.",
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
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            date_of_birth: { type: 'string' },
            document_number: { type: 'string' },
            document_type: { type: 'string', enum: ['cni', 'passport', 'driving_license', 'other'] },
            address: { type: 'string' },
            nationality: { type: 'string' },
            gender: { type: 'string', enum: ['M', 'F', 'X'] },
            place_of_birth: { type: 'string' },
            issue_date: { type: 'string' },
            expiry_date: { type: 'string' },
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
        temperature: 0,
        max_tokens: 250,
        messages: [
          { role: 'system', content: 'OCR expert. Appelle extract_id_data.' },
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
        return new Response(JSON.stringify({ error: 'Trop de requêtes. Réessayez dans quelques secondes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits AI épuisés. Veuillez recharger votre espace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error ${resp.status}`);
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: 'Aucune information détectée. Réessayez avec une photo plus nette.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let extracted: any;
    try {
      extracted = JSON.parse(call.function.arguments);
    } catch {
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
