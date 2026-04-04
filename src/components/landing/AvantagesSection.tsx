import { motion } from 'framer-motion';
import { Heart, Clock, Gift, Smartphone, Shield, Users } from 'lucide-react';
import familyImg from '@/assets/family-multigenerational.jpg';

const avantages = [
  { icon: Gift, title: 'Bonus Fidélité-Santé 30%', desc: 'Si aucun sinistre après 3 ans, 30% du cumul des primes nettes versé en bonus.' },
  { icon: Users, title: 'Solidarité Famille', desc: 'Couvrez conjoint, enfants et ascendants dans un même contrat.' },
  { icon: Clock, title: 'Paiement < 12h', desc: 'Le capital espèces (30%) versé en moins de 12 heures après déclaration.' },
  { icon: Smartphone, title: 'Simplicité Digitale', desc: 'Souscrivez, payez et déclarez en ligne via Mobile Money (Wave, Orange, MTN, Moov).' },
  { icon: Shield, title: 'Double Couverture', desc: '70% en prestations nature (cercueil, transport, inhumation) + 30% en espèces.' },
  { icon: Heart, title: 'Accompagnement Total', desc: 'Assistance funéraire complète et rapatriement inclus selon la formule choisie.' },
];

export function AvantagesSection() {
  return (
    <section id="avantages" className="py-20 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Pourquoi AssurDignité</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mt-2">Des avantages uniques pour votre sérénité</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={familyImg} alt="Famille multigénérationnelle africaine" className="w-full h-auto object-cover" width={1920} height={1080} loading="lazy" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-white rounded-2xl p-6 shadow-xl hidden sm:block">
              <p className="text-3xl font-bold font-display">30%</p>
              <p className="text-sm text-white/80">Bonus Fidélité</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {avantages.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm font-display mb-1">{a.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
