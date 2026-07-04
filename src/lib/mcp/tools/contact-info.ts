import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "contact_info",
  title: "Coordonnées AssurDignité",
  description:
    "Retourne les coordonnées commerciales SONAM Vie / AssurDignité (téléphones, email).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const contact = {
      marque: "AssurDignité",
      porteur_de_risque: "SONAM Vie",
      concepteur: "AIF SARL",
      telephones: ["+225 27 20 31 71 82", "+225 05 95 45 21 65"],
      email: "servicecommercialsonamvie@sonam.ci",
      site: "https://sonam-assurdignite-beta.lovable.app",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(contact, null, 2) }],
      structuredContent: contact,
    };
  },
});
