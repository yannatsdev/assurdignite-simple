import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Coins,
  HeartHandshake,
  Zap,
  LifeBuoy,
  Plane,
  Activity,
} from 'lucide-react';

const garanties = [
  { icon: ShieldCheck, title: 'Décès toutes causes', desc: 'Garantie principale couvrant les décès naturels, par maladie ou par accident, hors exclusions légales.' },
  { icon: Coins, title: 'Capital décès', desc: 'Capital versé selon la formule souscrite : 1,5M à 5M FCFA, réparti 70% nature et 30% cash MoMo.' },
  { icon: HeartHandshake, title: 'Assistance funéraire', desc: 'Organisation complète des obsèques par nos prestataires agréés : enlèvement, conservation, cercueil, transport, inhumation.' },
  { icon: Zap, title: 'Règlement rapide', desc: "Objectif interne : versement Mobile Money en quelques heures après dépôt et validation. Délai contractuel maximal : 15 jours ouvrés (Code CIMA)." },
  { icon: LifeBuoy, title: 'Assistance renforcée', desc: 'Accompagnement étendu selon la formule choisie : démarches administratives, support familial, coordination logistique.' },
  { icon: Plane, title: 'Rapatriement diaspora', desc: 'Option dédiée à la formule Excellence : rapatriement du corps vers la Côte d\'Ivoire pris en charge.' },
  { icon: Activity, title: 'Garantie accident', desc: 'Garantie optionnelle activable à la souscription pour renforcer la couverture en cas de décès accidentel.' },
];

export function GarantiesSection() {
  return (
    <section id="garanties" className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <span className="text-secondary font-semibold text-base uppercase tracking-wider">Les 7 garanties</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-3">Tout ce qui est couvert</h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-4">
            Une protection complète, conçue par SONAM Vie et opérée par AIF SARL, conforme au Code CIMA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {garanties.map((g, i) => {
            // 7 cards in 3-col grid: rows of 3, 3, 1 — center the orphan 7th card
            const isOrphanLast = i === garanties.length - 1 && garanties.length % 3 === 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all ${
                  isOrphanLast ? 'lg:col-start-2' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--sonam-blue))] flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                  <g.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold font-display text-lg mb-2">{g.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
