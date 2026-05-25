import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: "Qu'est-ce que AssurDignité ?", a: "AssurDignité est un produit de prévoyance obsèques et décès à structure hybride, porté par SONAM Vie et conçu par AIF SARL. Il combine 70 % de prestations en nature (organisation funéraire complète) et 30 % en capital espèces versé via Mobile Money, avec un objectif de paiement en moins de 12 heures après validation du dossier." },
  { q: "Quelles sont les 4 formules disponibles ?", a: "A – Essentielle (1 500 000 FCFA), B – Standard (2 000 000), C – Premium (3 000 000), D – Excellence Diaspora (5 000 000). Chaque formule couvre l'Assuré Principal, jusqu'à 4 Assurés Grandeur (AG) et 2 ascendants (jusqu'à 90 ans)." },
  { q: "Qui peut être couvert ?", a: "Assuré Principal : personne physique âgée de 18 à 59 ans inclus à la souscription. AG : jusqu'à 4 personnes additionnelles. Ascendants : couverture possible jusqu'à 90 ans inclus. Un questionnaire médical peut être requis selon l'âge et le profil." },
  { q: "Quel est le parcours de souscription ?", a: "7 étapes officielles : téléchargement de l'application → choix de la formule → identification biométrique (KYC) → désignation des bénéficiaires → validation des conditions générales et particulières → paiement de la prime → activation du contrat." },
  { q: "Comment fonctionne le Bonus Fidélité-Santé 30 % ?", a: "Si aucun sinistre n'est déclaré pendant 3 années consécutives sur l'ensemble du contrat (AP + famille), 30 % de la prime de l'Assuré Principal est restituée. C'est le levier de fidélisation et de persistance du produit." },
  { q: "Comment déclarer un sinistre ?", a: "Canaux disponibles 24h/24 : application, hotline dédiée, WhatsApp sécurisé. Heures ouvrables : agence SONAM ou réseau commercial. Informations minimales requises : nom du défunt, n° de contrat, date et lieu du décès, contact déclarant." },
  { q: "Quels sont les engagements de service (SLA) ?", a: "Prise en charge initiale : < 1h. Vérification dossier : 1–4h. Activation logistique prestataire : 2–4h. Paiement cash Mobile Money : < 12h après validation finale." },
  { q: "Quelles pièces fournir pour un sinistre ?", a: "Acte de décès, certificat médical, pièce d'identité du défunt, pièce d'identité du bénéficiaire, coordonnées Mobile Money. Transmission via upload IMPACT.02, WhatsApp sécurisé ou dépôt physique." },
  { q: "Quels moyens de paiement sont acceptés ?", a: "Orange Money, MTN Money, Moov Money, Wave (Côte d'Ivoire). Carte bancaire pour la diaspora. Contrat annuel (12 mois) renouvelable, prime à jour obligatoire." },
  { q: "Quelles sont les exclusions principales ?", a: "Délai de carence applicable selon causes, fraude (exclusion totale), impayé (suspension des garanties), suicide selon Conditions Générales, guerre et émeutes (exclusions standard CIMA)." },
  { q: "Quelle est la réglementation applicable ?", a: "Produit soumis au Code CIMA. Porteur de risque : SONAM Vie. Concepteur et architecte : AIF SARL. Plateforme technologique : AssurDignité (ATS/AIF). Données protégées et confidentialité garanties." },
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
