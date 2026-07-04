import { defineMcp } from "@lovable.dev/mcp-js";
import listFormulesTool from "./tools/list-formules";
import contactInfoTool from "./tools/contact-info";
import simulerPrimeTool from "./tools/simuler-prime";

export default defineMcp({
  name: "assurdignite-mcp",
  title: "AssurDignité MCP",
  version: "0.1.0",
  instructions:
    "Outils publics AssurDignité (SONAM Vie): consulter les formules d'assurance obsèques, obtenir les coordonnées commerciales, et simuler une prime annuelle indicative.",
  tools: [listFormulesTool, contactInfoTool, simulerPrimeTool],
});
