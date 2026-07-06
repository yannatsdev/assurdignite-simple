import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

// Formules officielles AssurDignité (voir memory: actuarial)
const CAPITAUX: Record<string, number> = {
  A: 1_500_000,
  B: 2_000_000,
  C: 3_000_000,
  D: 5_000_000,
};

export default defineTool({
  name: "simuler_prime",
  title: "Simuler une prime annuelle",
  description:
    "Estimation indicative de la prime annuelle AssurDignité selon la formule (A/B/C/D) et l'âge de l'assuré principal (18-64 ans). Paiement annuel. Une ristourne de 30% de la prime de l'assuré principal est restituée si aucun sinistre n'est survenu sur les 3 premières années. Résultat non contractuel.",
  inputSchema: {
    formule: z.enum(["A", "B", "C", "D"]).describe("Code formule: A, B, C ou D"),
    age: z.number().int().min(18).max(64).describe("Âge de l'assuré principal (18-64 ans)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ formule, age }) => {
    const capital = CAPITAUX[formule];
    const tauxBase = 0.008 + Math.max(0, age - 30) * 0.0004;
    const primeAnnuelle = Math.round((capital * tauxBase) / 100) * 100;
    // Périodicités — Note Technique 26/05/2026 (PAC' = PAC+2500, PSC = 0.51·PAC+1500, PTC = 0.26·PAC+1000, PMC = 0.09·PAC+500)
    const periodicites = {
      annuelle:     primeAnnuelle,
      annuelle_prime: primeAnnuelle + 2500,
      semestrielle: Math.round(primeAnnuelle * 0.51 + 1500),
      trimestrielle: Math.round(primeAnnuelle * 0.26 + 1000),
      mensuelle:    Math.round(primeAnnuelle * 0.09 + 500),
    };
    const result = {
      formule,
      capital_fcfa: capital,
      couverture: "70% prestations en nature + 30% capital espèces",
      age,
      prime_annuelle_indicative_fcfa: primeAnnuelle,
      periodicites_fcfa: periodicites,
      ristourne: "30% de la prime de l'assuré principal restituée si aucun sinistre sur 3 ans",
      limites_age: { principal: "18-64", conjoint: "18-64", enfants: "0-21", ascendants: "0-89" },
      note: "Estimation non contractuelle. Tarification définitive après KYC et adhésion.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
