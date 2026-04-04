import { motion } from 'framer-motion';
import { Heart, Clock, Shield, Smartphone, Users, Gift } from 'lucide-react';
import familyImg from '@/assets/family-happy.jpg';

const advantages = [
  { icon: Gift, title: 'Bonus Fidélité-Santé 30%', desc: '3 ans sans sinistre = 30% de vos primes remboursées' },
  { icon: Clock, title: 'Paiement en < 12 heures', desc: 'Capital espèces versé en moins de 12h après déclaration' },
  { icon: Heart, title: '70% Prestations Nature', desc: 'Cercueil, conservation, transport, inhumation tout inclus' },
  { icon: Users, title: 'Solidarité Famille', desc: 'Couvrez conjoint, enfants et ascendants sous un seul contrat' },
  { icon: Smartphone, title: '100% Digital', desc: 'Souscription, paiement et suivi via Mobile Money' },
  { icon: Shield, title: 'Sinistre Fast-Track', desc: 'Déclaration en moins de 5 minutes depuis votre espace' },
];

export function AvantagesSection() {
  return (
    <section id="avantages" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Pourquoi AssurDignité</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-8 font-display">Des avantages uniques pour votre sérénité</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {advantages.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <a.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{a.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <img src={familyImg} alt="Famille heureuse et protégée" className="rounded-2xl shadow-2xl w-full" loading="lazy" width={1280} height={720} />
            <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground rounded-xl p-6 shadow-xl">
              <p className="text-3xl font-bold font-display">30%</p>
              <p className="text-sm opacity-90">Bonus Fidélité-Santé</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
