import { motion } from 'framer-motion';
import { Check, Star, Crown, Shield, Heart, Truck, Flower2, Home, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCFA } from '@/lib/actuarial-engine';

const formules = [
  {
    key: 'A',
    name: 'Dignité Simple',
    capital: 1500000,
    tagline: 'L\'essentiel pour une cérémonie digne',
    description: 'Idéale pour ceux qui souhaitent une couverture de base abordable, garantissant une cérémonie respectueuse sans charge financière pour les proches.',
    color: 'border-sonam-blue',
    icon: Shield,
    features: ['Capital principal : 1 500 000 FCFA', 'Capital conjoint : 1 500 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 1 050 000 FCFA'],
  },
  {
    key: 'B',
    name: 'Serein',
    capital: 2000000,
    tagline: 'L\'équilibre parfait protection / budget',
    description: 'Une protection élargie qui couvre les frais d\'obsèques tout en laissant un capital substantiel à la famille pour faire face aux imprévus.',
    color: 'border-sonam-green',
    icon: Heart,
    features: ['Capital principal : 2 000 000 FCFA', 'Capital conjoint : 2 000 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 1 400 000 FCFA'],
  },
  {
    key: 'C',
    name: 'Prestige',
    capital: 3000000,
    tagline: 'Une cérémonie haut-de-gamme et un capital généreux',
    description: 'Pour ceux qui veulent une prestation premium avec cercueil de qualité supérieure, transport longue distance et un capital espèces important.',
    color: 'border-primary',
    icon: Star,
    features: ['Capital principal : 3 000 000 FCFA', 'Capital conjoint : 3 000 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 2 100 000 FCFA'],
  },
  {
    key: 'D',
    name: 'Excellence',
    capital: 5000000,
    tagline: 'La couverture ultime, idéale pour la diaspora',
    description: 'Notre formule la plus complète avec rapatriement international, prestations VIP et capital maximum pour préserver l\'avenir financier de votre famille.',
    color: 'border-sonam-gold',
    icon: Crown,
    popular: true,
    features: ['Capital principal : 5 000 000 FCFA', 'Capital conjoint : 5 000 000 FCFA', 'Capital enfant : 500 000 FCFA', 'Capital ascendant : 3 500 000 FCFA'],
  },
];

const servicesNature = [
  { icon: Truck, title: 'Enlèvement & transport du corps', desc: 'Le capital versé permet de financer la prise en charge depuis le lieu du décès et le transport vers la morgue.' },
  { icon: Home, title: 'Conservation & traitement', desc: 'Le capital versé permet de financer la conservation en chambre froide et les soins de thanatopraxie.' },
  { icon: Flower2, title: 'Cercueil & accessoires funéraires', desc: 'Le capital versé permet de financer le cercueil et les accessoires funéraires de votre choix.' },
  { icon: Users, title: 'Levée du corps & cérémonie', desc: 'Le capital versé permet de financer la levée de corps, le transport au lieu d\'inhumation et la cérémonie.' },
];

export function FormulesSection() {
  return (
    <section id="formules" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-primary text-base font-semibold uppercase tracking-wider">Nos Formules</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 font-display">Trouver nos prestations</h2>
          <p className="text-foreground/80 text-lg md:text-xl font-medium mt-4 max-w-3xl mx-auto leading-relaxed">
            Tout est pris en charge par <span className="font-bold text-primary">Sonam Vie</span>.
          </p>
          <p className="text-muted-foreground text-base mt-3 max-w-3xl mx-auto leading-relaxed">
            Chaque formule verse <span className="font-semibold text-primary">un capital à 100 % en espèces</span> aux bénéficiaires désignés, sous <span className="font-semibold text-secondary">15 jours ouvrés</span> après réception du dossier complet, pour organiser librement les obsèques.
          </p>
        </motion.div>

        {/* Section title: Ce que votre capital vous permet de financer */}
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">Ce que votre capital vous permet de financer</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {formules.map((f, i) => (
            <motion.div key={f.key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }} className="transition-all duration-300 h-full">
              <Card className={`relative h-full flex flex-col border-2 ${f.color} hover:shadow-xl transition-shadow ${f.popular ? 'ring-2 ring-secondary' : ''}`}>
                {f.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Populaire
                  </div>
                )}
                <CardHeader className="text-center pb-4 min-h-[280px] flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-base font-semibold text-muted-foreground">Formule {f.key}</p>
                  <CardTitle className="text-xl font-display">{f.name}</CardTitle>
                  <p className="text-sm text-secondary font-medium mt-1 min-h-[40px] flex items-center">{f.tagline}</p>
                  <p className="text-2xl font-bold text-primary mt-2">{formatCFA(f.capital)}</p>
                  <p className="text-sm text-muted-foreground">Capital garanti</p>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic min-h-[110px]">
                    {f.description}
                  </p>
                  <div className="space-y-3 flex-1">
                    {f.features.map((feat, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 mt-auto">
                    <Button className="w-full" asChild>
                      <a href="#simulateur">Simuler ma prime</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Ce que votre capital vous permet de financer — moved BELOW formules per user request */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-secondary font-bold text-base uppercase tracking-wider">
              <Sparkles className="w-5 h-5" /> Capital versé à 100 % en espèces
            </span>
            <h3 className="text-2xl md:text-3xl font-display font-bold mt-3 text-foreground">Vous décidez librement de l'organisation des obsèques</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {servicesNature.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 border-2 border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-md">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-display font-bold text-lg mb-2 min-h-[56px]">{s.title}</h4>
                <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8 italic max-w-3xl mx-auto">
            Le capital est versé en <span className="font-semibold not-italic text-secondary">espèces, en totalité, aux bénéficiaires désignés</span>, sous 15 jours ouvrés, pour couvrir tous les frais liés aux obsèques.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
