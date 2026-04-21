import { motion } from 'framer-motion';
import { Check, Star, Crown, Shield, Heart, Truck, Flower2, Home, Users, Sparkles, Calculator, Percent, FileText, Plus } from 'lucide-react';
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
  { icon: Truck, title: 'Enlèvement & transport du corps', desc: 'Prise en charge immédiate depuis le lieu du décès, brancardage et transport sécurisé vers la morgue.' },
  { icon: Home, title: 'Conservation & traitement', desc: 'Conservation en chambre froide, soins de thanatopraxie et habillage du défunt dans le respect des traditions.' },
  { icon: Flower2, title: 'Cercueil & accessoires funéraires', desc: 'Fourniture du cercueil adapté à la formule, capiton, croix et ornements selon vos souhaits.' },
  { icon: Users, title: 'Levée du corps & cérémonie', desc: 'Organisation de la levée de corps, transport au lieu d\'inhumation et accompagnement de la famille jusqu\'à la sépulture.' },
];

// Public-friendly explanation (PAP/PAI/PAC labels are voluntarily hidden — admin-only).
const calcSteps = [
  { icon: Calculator, title: 'Coût actuariel par assuré', desc: 'Selon l\'âge de chaque membre couvert et le capital choisi, nous appliquons la table de mortalité officielle CIMA H pour calculer le juste coût de protection.' },
  { icon: Percent, title: 'Frais de gestion (0,2 %)', desc: 'Une légère majoration couvre la gestion administrative et le suivi de votre dossier tout au long de l\'année.' },
  { icon: Shield, title: 'Frais d\'acquisition (15 %)', desc: 'Inclut le travail de votre conseiller, la rédaction du contrat et l\'accès à votre espace digital sécurisé.' },
  { icon: FileText, title: 'Frais accessoires fixes', desc: 'Un montant forfaitaire couvre l\'émission, l\'envoi et l\'archivage de votre certificat d\'assurance.' },
];

export function FormulesSection() {
  return (
    <section id="formules" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Nos Formules</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 font-display">Choisissez votre niveau de protection</h2>
          <p className="text-muted-foreground mt-4 max-w-3xl mx-auto leading-relaxed">
            Chaque formule offre une répartition de <span className="font-semibold text-primary">70 % en prestations en nature</span> (Enlèvement, traitement et conservation du corps, Levée de corps, Allocation cercueil et transfert du corps au lieu d'inhumation) et <span className="font-semibold text-secondary">30 % en capital espèces</span>, avec un paiement en moins de 12 heures.
          </p>
        </motion.div>

        {/* Services en nature détaillés */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Prestations en nature incluses (70 %)
            </span>
            <h3 className="text-xl md:text-2xl font-display font-bold mt-2">Tout est pris en charge, vous n'avez rien à organiser</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {servicesNature.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-5 border-2 border-border hover:border-primary/40 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3 shadow-md">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-display font-bold text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6 italic">
            Les 30 % restants sont versés en <span className="font-semibold not-italic text-secondary">capital espèces aux bénéficiaires</span> en moins de 12 heures pour couvrir les frais imprévus.
          </p>
        </motion.div>

        {/* Comment est calculée votre prime — explication publique sans labels techniques */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
              <Calculator className="w-4 h-4" /> Transparence tarifaire
            </span>
            <h3 className="text-xl md:text-2xl font-display font-bold mt-2">Comment est calculée votre prime ?</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
              Une tarification 100 % transparente, basée sur des règles actuarielles officielles et validée par la zone CIMA.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {calcSteps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative bg-card rounded-2xl p-5 border-2 border-border hover:border-secondary/40 hover:shadow-lg transition-all">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold shadow-md">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center mb-3">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-display font-bold text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < calcSteps.length - 1 && (
                  <Plus className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary bg-background rounded-full p-0.5 border-2 border-secondary" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <div className="inline-block bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-xl shadow-lg">
              <span className="text-sm font-semibold">= Prime annuelle TTC à payer</span>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {formules.map((f, i) => (
            <motion.div key={f.key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }} className="transition-all duration-300">
              <Card className={`relative h-full border-2 ${f.color} hover:shadow-xl transition-shadow ${f.popular ? 'ring-2 ring-secondary' : ''}`}>
                {f.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Populaire
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Formule {f.key}</p>
                  <CardTitle className="text-xl font-display">{f.name}</CardTitle>
                  <p className="text-xs text-secondary font-medium mt-1">{f.tagline}</p>
                  <p className="text-2xl font-bold text-primary mt-2">{formatCFA(f.capital)}</p>
                  <p className="text-xs text-muted-foreground">Capital garanti</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3 italic">
                    {f.description}
                  </p>
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
