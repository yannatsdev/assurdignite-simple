import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCFA } from '@/lib/actuarial-engine';

const formules = [
  {
    key: 'A',
    name: 'Dignité Simple',
    capital: 1500000,
    color: 'border-sonam-blue',
    features: ['Capital principal : 1 500 000 FCFA', 'Capital conjoint : 1 500 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 1 050 000 FCFA'],
  },
  {
    key: 'B',
    name: 'Serein',
    capital: 2000000,
    color: 'border-sonam-green',
    popular: true,
    features: ['Capital principal : 2 000 000 FCFA', 'Capital conjoint : 2 000 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 1 400 000 FCFA'],
  },
  {
    key: 'C',
    name: 'Prestige',
    capital: 3000000,
    color: 'border-primary',
    features: ['Capital principal : 3 000 000 FCFA', 'Capital conjoint : 3 000 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 2 100 000 FCFA'],
  },
  {
    key: 'D',
    name: 'Excellence',
    capital: 5000000,
    color: 'border-sonam-gold',
    features: ['Capital principal : 5 000 000 FCFA', 'Capital conjoint : 5 000 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 3 500 000 FCFA'],
  },
];

export function FormulesSection() {
  return (
    <section id="formules" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Nos Formules</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 font-display">Choisissez votre niveau de protection</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Chaque formule offre une répartition 70% en prestations nature et 30% en capital espèces, avec un paiement en moins de 12 heures.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {formules.map((f, i) => (
            <motion.div key={f.key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className={`relative h-full border-2 ${f.color} hover:shadow-xl transition-shadow ${f.popular ? 'ring-2 ring-secondary' : ''}`}>
                {f.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Populaire
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <p className="text-sm font-semibold text-muted-foreground">Formule {f.key}</p>
                  <CardTitle className="text-xl font-display">{f.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary mt-2">{formatCFA(f.capital)}</p>
                  <p className="text-xs text-muted-foreground">Capital garanti</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {f.features.map((feat, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button className="w-full" asChild>
                      <a href="#simulateur">Simuler ma prime</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
