import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_formules",
  title: "Lister les formules AssurDignité",
  description:
    "Retourne les formules d'assurance obsèques AssurDignité (SONAM Vie): A Essentielle, B Standard, C Premium, D Excellence Diaspora.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const formules = [
      {
        code: "A",
        nom: "Essentielle",
        capital_fcfa: 1_500_000,
        cible: "Budget maîtrisé, couverture essentielle",
      },
      {
        code: "B",
        nom: "Standard",
        capital_fcfa: 2_000_000,
        cible: "Équilibre couverture / prime",
      },
      {
        code: "C",
        nom: "Premium",
        capital_fcfa: 3_000_000,
        cible: "Prestations élargies, famille",
      },
      {
        code: "D",
        nom: "Excellence Diaspora",
        capital_fcfa: 5_000_000,
        cible: "Diaspora — 70% prestations nature + 30% cash Mobile Money",
      },
    ];
    return {
      content: [{ type: "text", text: JSON.stringify(formules, null, 2) }],
      structuredContent: { formules },
    };
  },
});
