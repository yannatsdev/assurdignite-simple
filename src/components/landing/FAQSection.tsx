import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: "Qu'est-ce que AssurDignité ?", a: "AssurDignité est un produit d'assurance obsèques proposé par SONAM VIE. Il offre une couverture en cas de décès avec 70% en prestations en nature (cercueil, transport, inhumation) et 30% en capital espèces. Délai contractuel maximal de règlement : 15 jours ouvrés après réception des pièces justificatives complètes (Code CIMA). Notre objectif interne — non contractuel — est un versement en quelques heures une fois le dossier vérifié." },
  { q: "Quelles sont les formules disponibles ?", a: "4 formules : A – Dignité Simple (1 500 000 FCFA), B – Serein (2 000 000 FCFA), C – Prestige (3 000 000 FCFA), D – Excellence (5 000 000 FCFA). Chaque formule couvre l'assuré principal, conjoint, jusqu'à 10 enfants et 4 ascendants." },
  { q: "Comment souscrire ?", a: "Simulez votre prime en ligne, choisissez votre formule, complétez 3 étapes d'adhésion (Simulation → Informations & bénéficiaires → Signature & paiement), payez via Mobile Money (Wave, Orange, Moov, MTN) ou virement bancaire, et recevez votre attestation immédiatement." },
  { q: "Qu'est-ce que le Bonus Fidélité-Santé 30% ?", a: "Si aucun sinistre n'est déclaré dans votre groupe familial assuré pendant 3 années consécutives, vous recevez 30% de la prime annuelle de l'Assuré Principal (et non de la prime familiale totale), versés par Mobile Money." },
  { q: "Comment déclarer un sinistre ?", a: "Via votre Espace Client, section Sinistre Fast-Track : remplissez le formulaire en moins de 5 minutes, uploadez les pièces justificatives (acte de décès, pièces bénéficiaires). Une fois le dossier complet et validé, le règlement intervient dans un délai contractuel maximal de 15 jours ouvrés — souvent bien plus vite grâce à notre objectif interne de traitement rapide. En cas d'impossibilité de prestation en nature (décès à l'étranger ou inhumation déjà réalisée selon certains rites), l'intégralité (100%) du capital garanti est versée en espèces." },
  { q: "Qui peut être assuré ?", a: "Assuré principal & conjoint : 18 à 64 ans à la souscription (âge + durée du contrat ≤ 65 ans). Enfants : 0 à 21 ans. Ascendants : jusqu'à 89 ans à la souscription et 90 ans en couverture — une limite nettement plus large que le marché (55 à 75 ans en général)." },
  { q: "Quels sont les modes de paiement acceptés ?", a: "Mobile Money : Wave, Orange Money, Moov Money, MTN Money. Virement bancaire avec RIB. Périodicités : annuelle (défaut), semestrielle, trimestrielle, mensuelle ou unique." },
  { q: "Que couvrent les prestations en nature (70%) ?", a: "Cercueil extérieur, conservation du corps, transport funéraire, cérémonie d'inhumation, et selon la formule : rapatriement et accompagnement funéraire complet." },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 font-display">Questions fréquentes</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Trouvez rapidement les réponses à vos questions sur AssurDignité.</p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <AccordionItem value={`faq-${i}`} className="bg-card border border-border rounded-xl px-6 shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-sm sm:text-base py-4 hover:no-underline">
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                      {faq.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 pl-8">
                    {faq.a}
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
