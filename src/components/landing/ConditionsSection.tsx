import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const sections = [
  { title: "Article 1 – Objet du contrat", content: "Le présent contrat a pour objet la garantie par SONAM VIE du versement d'un capital décès en cas de décès de l'assuré principal ou de l'un des assurés complémentaires désignés au bulletin d'adhésion. La garantie se décompose en 70% de prestations en nature et 30% en capital espèces." },
  { title: "Article 2 – Conditions d'adhésion", content: "L'adhésion est ouverte à toute personne physique résidant en Côte d'Ivoire ou dans la zone CIMA. Assuré Principal : 18 à 59 ans inclus à la souscription. Assurés complémentaires (conjoint, enfants) : 0 à 90 ans inclus. Ascendants : jusqu'à 90 ans inclus. Un questionnaire médical peut être requis selon l'âge et le profil. L'adhésion est subordonnée au paiement intégral de la prime annuelle et à la validation du KYC." },
  { title: "Article 3 – Prestations garanties", content: "En cas de décès de l'assuré, SONAM VIE s'engage à fournir : cercueil extérieur, conservation du corps, transport funéraire, cérémonie d'inhumation (70% du capital en nature), et le versement de 30% du capital en espèces au(x) bénéficiaire(s) désigné(s), dans un délai maximum de 12 heures après réception du dossier complet." },
  { title: "Article 4 – Exclusions", content: "Sont exclus de la garantie : le suicide dans les deux premières années du contrat, le décès résultant de faits de guerre ou d'actes terroristes, le décès consécutif à la participation volontaire à des actes criminels, et les fausses déclarations établies lors de l'adhésion." },
  { title: "Article 5 – Obligations de l'adhérent", content: "L'adhérent s'engage à : payer la prime annuelle à la date d'échéance, déclarer tout changement de situation familiale, fournir des informations exactes lors de l'adhésion et de la déclaration de sinistre. Toute fausse déclaration peut entraîner la nullité du contrat." },
  { title: "Article 6 – Bonus Fidélité-Santé", content: "Si aucun sinistre n'est déclaré pendant 3 années consécutives de cotisation, l'adhérent bénéficie d'un bonus de 30% du cumul des primes nettes versées. Ce bonus est versé directement sur le compte Mobile Money ou bancaire de l'adhérent." },
  { title: "Article 7 – Résiliation", content: "Le contrat peut être résilié par l'adhérent à tout moment par lettre recommandée. En cas de non-paiement de la prime dans les 30 jours suivant l'échéance, le contrat est suspendu puis résilié après 90 jours. Aucun remboursement des primes acquises n'est dû." },
  { title: "Article 8 – Juridiction compétente", content: "Tout litige relatif au présent contrat sera soumis aux tribunaux compétents d'Abidjan, Côte d'Ivoire. Le contrat est régi par le Code des Assurances de la zone CIMA." },
];

export function ConditionsSection() {
  return (
    <section id="conditions" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Informations légales</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 font-display">Conditions Générales</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Consultez les conditions générales du contrat AssurDignité.</p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {sections.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <AccordionItem value={`cg-${i}`} className="bg-card border border-border rounded-xl px-6 shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-sm sm:text-base py-4 hover:no-underline">
                    <span className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      {s.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 pl-8">
                    {s.content}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
