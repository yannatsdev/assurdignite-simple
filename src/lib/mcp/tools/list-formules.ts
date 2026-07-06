import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_formules",
  title: "Lister les formules AssurDignité",
  description:
    "Retourne les formules d'assurance obsèques AssurDignité (SONAM Vie): A Dignité Simple, B Serein, C Prestige, D Excellence.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const formules = [
      {
        code: "A",
        nom: "Dignité Simple",
        capital_fcfa: 1_500_000,
        cible: "Budget maîtrisé, couverture essentielle",
      },
      {
        code: "B",
        nom: "Serein",
        capital_fcfa: 2_000_000,
        cible: "Équilibre couverture / prime",
      },
      {
        code: "C",
        nom: "Prestige",
        capital_fcfa: 3_000_000,
        cible: "Prestations élargies, famille",
      },
      {
        code: "D",
        nom: "Excellence",
        capital_fcfa: 5_000_000,
        cible: "Couverture maximale — diaspora, prestations premium, rapatriement",
      },
    ];
    return {
      content: [{ type: "text", text: JSON.stringify(formules, null, 2) }],
      structuredContent: { formules },
    };
  },
});
