import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: "Qu'est-ce que AssurDignité ?", a: "AssurDignité est un produit d'assurance obsèques proposé par SONAM VIE. En cas de décès d'un membre assuré de la famille, il verse aux bénéficiaires désignés un capital à 100% en espèces, destiné à financer l'organisation des obsèques, sous 15 jours ouvrés après dépôt et analyse des pièces justificatives." },
  { q: "Quelles sont les formules disponibles ?", a: "4 formules : A – Dignité Simple (1 500 000 FCFA), B – Serein (2 000 000 FCFA), C – Prestige (3 000 000 FCFA), D – Excellence (5 000 000 FCFA). Chaque formule couvre l'assuré principal, conjoint, jusqu'à 10 enfants et 4 ascendants." },
  { q: "Comment souscrire ?", a: "Simulez votre prime en ligne, choisissez votre formule, complétez quelques étapes d'adhésion, payez via Mobile Money (Wave, Orange, Moov, MTN) ou virement bancaire, et recevez votre attestation immédiatement." },
  { q: "Qu'est-ce que la ristourne fidélité de 30% ?", a: "Si aucun sinistre n'est déclaré pendant les 3 premières années du contrat, 30% de la prime payée par l'assuré principal vous est restitué. C'est notre façon de récompenser votre fidélité !" },
  { q: "Comment déclarer un sinistre ?", a: "Via votre Espace Client, section Sinistre Fast-Track : remplissez le formulaire en moins de 5 minutes, uploadez les pièces justificatives. Une fois le dossier complet reçu, le capital est versé sous 15 jours ouvrés." },
  { q: "Qui peut être assuré ?", a: "Assuré principal et conjoint(e) : jusqu'à 64 ans à la souscription (âge + durée du contrat ≤ 65 ans). Enfants : jusqu'à 21 ans. Ascendants : jusqu'à 89 ans à la souscription (âge + durée du contrat ≤ 90 ans)." },
  { q: "Quels sont les modes de paiement acceptés ?", a: "Mobile Money : Wave, Orange Money, Moov Money, MTN Money. Virement bancaire avec RIB. La prime peut être payée annuellement, semestriellement, trimestriellement ou mensuellement." },
  { q: "Le contrat a-t-il une valeur de rachat ?", a: "Non. Conformément à l'article 77 du code des assurances CIMA, ce contrat de temporaire décès ne comporte ni valeur de rachat, ni réduction, ni avance." },
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
