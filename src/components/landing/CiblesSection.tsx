import { motion } from 'framer-motion';
import { User, Store, Plane, Building2 } from 'lucide-react';

const cibles = [
  {
    icon: User,
    title: 'Particuliers',
    desc: 'Salariés, indépendants et chefs de famille qui souhaitent organiser leur prévoyance obsèques et protéger leurs proches.',
    accent: 'from-primary to-[hsl(var(--sonam-blue))]',
  },
  {
    icon: Store,
    title: 'Secteur informel',
    desc: 'Commerçants, artisans, transporteurs : une assurance accessible, payable annuellement via Mobile Money.',
    accent: 'from-[hsl(var(--sonam-emerald))] to-secondary',
  },
  {
    icon: Plane,
    title: 'Diaspora',
    desc: "Ivoiriens à l'étranger souhaitant protéger leurs proches restés au pays, avec rapatriement inclus dans la formule Excellence.",
    accent: 'from-[hsl(var(--sonam-blue))] to-primary',
  },
  {
    icon: Building2,
    title: 'Groupes & Entreprises',
    desc: 'Entreprises, mutuelles, associations : couverture collective avec tarification dégressive et portail dédié.',
    accent: 'from-[hsl(var(--sonam-gold))] to-secondary',
  },
];

export function CiblesSection() {
  return (
    <section id="cibles" className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <span className="text-secondary font-semibold text-base uppercase tracking-wider">Pour qui ?</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-3">AssurDignité s'adresse à</h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-4">
            Un produit inclusif pensé pour la Côte d'Ivoire et la diaspora.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {cibles.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative overflow-hidden bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all"
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${c.accent} opacity-10 blur-2xl`} />
              <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${c.accent} flex items-center justify-center mb-4 shadow-lg`}>
                <c.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold font-display text-lg mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
