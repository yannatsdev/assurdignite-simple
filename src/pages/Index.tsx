import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { FormulesSection } from '@/components/landing/FormulesSection';
import { AvantagesSection } from '@/components/landing/AvantagesSection';
import { SimulateurSection } from '@/components/landing/SimulateurSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ConditionsSection } from '@/components/landing/ConditionsSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { ChatBot } from '@/components/ChatBot';
import { motion } from 'framer-motion';
import { Shield, Clock, Users, Award, CheckCircle2, Star } from 'lucide-react';

const processSteps = [
  { icon: Shield, title: 'Choisissez votre formule', desc: 'Sélectionnez parmi nos 4 formules adaptées à vos besoins.' },
  { icon: CheckCircle2, title: 'Remplissez le formulaire', desc: 'Complétez votre dossier en ligne en quelques minutes.' },
  { icon: Clock, title: 'Payez en toute sécurité', desc: 'Paiement mobile ou virement bancaire, simple et rapide.' },
  { icon: Award, title: 'Vous êtes protégé', desc: 'Votre couverture est active immédiatement.' },
];

const testimonials = [
  { name: 'Mamadou K.', role: 'Entrepreneur, Abidjan', text: 'AssurDignité m\'a permis de protéger ma famille en toute sérénité. Le processus est simple et le paiement rapide.', rating: 5 },
  { name: 'Aminata D.', role: 'Enseignante, Bouaké', text: 'J\'ai souscrit à la formule Serein et je suis rassurée de savoir que mes proches sont couverts. Service excellent !', rating: 5 },
  { name: 'Kouamé F.', role: 'Fonctionnaire, Yamoussoukro', text: 'Le bonus fidélité est un vrai plus. Après 3 ans, j\'ai reçu 30% de mes primes. Je recommande vivement.', rating: 5 },
];

const statsItems = [
  { value: '15 000+', label: 'Familles protégées' },
  { value: '< 12h', label: 'Délai de paiement' },
  { value: '25+', label: 'Années d\'expérience' },
  { value: '98%', label: 'Taux de satisfaction' },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-sm text-secondary font-semibold uppercase tracking-wider">Comment ça marche</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display mt-2">Souscrivez en 4 étapes simples</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute top-8 left-[60%] w-[calc(100%-20px)] h-0.5 bg-primary/20 hidden lg:block" style={{ display: i === 3 ? 'none' : undefined }} />
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold mb-2">{i + 1}</span>
                <h3 className="font-bold font-display text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FormulesSection />
      <AvantagesSection />
      <SimulateurSection />

      {/* Stats */}
      <section className="py-16 bg-gradient-sonam text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsItems.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center">
                <p className="text-3xl sm:text-4xl font-bold font-display">{stat.value}</p>
                <p className="text-sm text-white/70 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-sm text-secondary font-semibold uppercase tracking-wider">Témoignages</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display mt-2">Ce que disent nos assurés</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-md border hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />
      <ConditionsSection />
      <ContactSection />
      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
