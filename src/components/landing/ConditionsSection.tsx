import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const sections = [
  { title: "Article 1 – Objet du contrat", content: "SONAM VIE s'engage, moyennant paiement des primes, à verser en cas de décès d'un membre de la famille déclarée une indemnité, préalablement définie, pour l'organisation des obsèques aux bénéficiaires désignés. En cas de vie de l'assuré au terme du contrat, l'assureur ne verse rien. Le capital est versé à l'assuré lui-même en cas d'invalidité totale et permanente." },
  { title: "Article 2 – Conditions d'adhésion", content: "Assuré principal et conjoint(e) : 18 à 64 ans inclus à la souscription (âge + durée du contrat ≤ 65 ans). Enfants : 0 à 21 ans. Ascendants : jusqu'à 89 ans à la souscription (âge + durée du contrat ≤ 90 ans). L'adhésion est subordonnée au paiement de la première prime et à la validation du KYC." },
  { title: "Article 3 – Exclusions", content: "Sont exclus : le suicide au cours des deux premières années du contrat, les faits de guerre étrangère (sauf conditions fixées par l'État après cessation des hostilités), certains risques de navigation aérienne hors cadre réglementaire, les paris/défis/acrobaties/sauts en parachute de démonstration, les épidémies, pandémies et catastrophes naturelles reconnues comme telles, et le meurtre de l'assuré par le bénéficiaire." },
  { title: "Article 4 – Paiement des prestations", content: "Dès transmission des pièces justificatives (acte de décès, certificat du genre de mort, pièces d'identité, formulaire de déclaration de sinistre, etc.), l'indemnité est versée sous 15 jours ouvrés. Ce contrat ne comporte pas de participation aux bénéfices techniques et financiers." },
  { title: "Article 5 – Rachat, réduction et avance", content: "Conformément à l'article 77 du code CIMA, ce contrat d'assurance temporaire décès ne comporte ni valeur de rachat, ni réduction, et ne peut donner lieu à l'octroi d'une avance." },
  { title: "Article 6 – Ristourne fidélité", content: "30% de la prime payée par l'assuré principal est restitué si aucun sinistre n'est survenu pendant les 3 premières années de souscription." },
  { title: "Article 7 – Frais", content: "Frais de gestion : 0,15% du capital assuré. Frais d'acquisition : 18% de la prime commerciale. Frais d'encaissement : 2 500 FCFA (prime annuelle), 1 500 FCFA (semestrielle), 1 000 FCFA (trimestrielle), 500 FCFA (mensuelle)." },
  { title: "Article 8 – Non-paiement des primes", content: "À défaut de paiement d'une prime dans les 10 jours de son échéance, un préavis de 40 jours est adressé à l'adhérent, au terme duquel le contrat peut être résilié ou réduit, faute de régularisation." },
  { title: "Article 9 – Prescription", content: "Toute action dérivant du présent contrat se prescrit par dix ans à compter de l'événement qui y donne naissance, conformément à l'article 28 du code des assurances CIMA." },
  { title: "Article 10 – Juridiction compétente", content: "Le contrat est régi par le Code des Assurances de la Conférence Interafricaine des Marchés d'Assurances (CIMA). Tout litige est soumis, à défaut d'accord amiable ou d'arbitrage, aux tribunaux compétents de Côte d'Ivoire." },
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
