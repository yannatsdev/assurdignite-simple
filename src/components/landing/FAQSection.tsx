import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: "Qu'est-ce que AssurDignité ?", a: "AssurDignité est un produit d'assurance obsèques proposé par SONAM VIE. Il offre une couverture en cas de décès avec 70% en prestations nature (cercueil, transport, inhumation) et 30% en capital espèces, versés en moins de 12 heures." },
  { q: "Quelles sont les formules disponibles ?", a: "4 formules : A – Dignité Simple (1 500 000 FCFA), B – Serein (2 000 000 FCFA), C – Prestige (3 000 000 FCFA), D – Excellence (5 000 000 FCFA). Chaque formule couvre l'assuré principal, conjoint, jusqu'à 4 enfants et 2 ascendants." },
  { q: "Comment souscrire ?", a: "Simulez votre prime en ligne, choisissez votre formule, remplissez le formulaire d'adhésion en 14 étapes, payez via Mobile Money (Wave, Orange, Moov, MTN) ou virement bancaire, et recevez votre attestation immédiatement." },
  { q: "Qu'est-ce que le Bonus Fidélité-Santé 30% ?", a: "Si aucun sinistre n'est déclaré pendant 3 ans consécutifs, vous recevez un bonus de 30% de vos primes nettes cumulées. C'est notre façon de récompenser votre fidélité !" },
  { q: "Comment déclarer un sinistre ?", a: "Via votre Espace Client, section Sinistre Fast-Track : remplissez le formulaire en moins de 5 minutes, uploadez les pièces justificatives, et le capital espèces est versé en moins de 12 heures." },
  { q: "Qui peut être assuré ?", a: "Assuré principal : jusqu'à 64 ans. Conjoint(e) : jusqu'à 64 ans. Enfants : jusqu'à 21 ans (nés ou à naître). Ascendants : jusqu'à 79 ans (père, mère, oncle, tante)." },
  { q: "Quels sont les modes de paiement acceptés ?", a: "Mobile Money : Wave, Orange Money, Moov Money, MTN Money. Virement bancaire avec RIB. Le paiement est annuel." },
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
