import { motion } from 'framer-motion';
import { Heart, Clock, Gift, Smartphone, Shield, Users } from 'lucide-react';
import familyImg from '@/assets/avantages-family.jpg';
import { SmartImage } from '@/components/SmartImage';

const avantages = [
  { icon: Gift, title: 'Ristourne Fidélité 30%', desc: 'Si aucun sinistre pendant les 3 premières années, 30% de la prime de l\'assuré principal vous est restitué.' },
  { icon: Users, title: 'Solidarité Famille', desc: 'Couvrez conjoint, enfants et ascendants dans un même contrat.' },
  { icon: Clock, title: 'Paiement sous 15 jours ouvrés', desc: 'Le capital est versé en espèces sous 15 jours ouvrés après réception du dossier complet.' },
  { icon: Smartphone, title: 'Simplicité Digitale', desc: 'Souscrivez, payez et déclarez en ligne via Mobile Money (Wave, Orange, MTN, Moov).' },
  { icon: Shield, title: 'Capital 100% en espèces', desc: 'Aucune répartition imposée : le capital est versé en totalité en espèces aux bénéficiaires désignés.' },
  { icon: Heart, title: 'Accompagnement Total', desc: 'Assistance funéraire complète et rapatriement inclus selon la formule choisie.' },
];

export function AvantagesSection() {
  return (
    <section id="avantages" className="py-20 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/15 text-secondary font-bold text-sm sm:text-base uppercase tracking-wider">
            Pourquoi AssurDignité
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-4 text-foreground leading-tight">
            Des avantages uniques pour votre <span className="text-primary">sérénité</span>
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 mt-4 max-w-2xl mx-auto leading-relaxed">
            Six bonnes raisons de confier la protection de vos proches à AssurDignité.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-muted">
              <SmartImage
                src={familyImg}
                alt="Famille multigénérationnelle africaine protégée par AssurDignité"
                width={1920}
                height={1080}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-white rounded-2xl p-6 shadow-xl hidden sm:block">
              <p className="text-3xl font-bold font-display">30%</p>
              <p className="text-sm text-white/90 font-medium">Ristourne Fidélité</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {avantages.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl p-5 sm:p-6 border-2 border-border hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-md">
                  <a.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl font-display mb-2 leading-snug text-foreground">{a.title}</h3>
                <p className="text-base text-foreground/75 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
