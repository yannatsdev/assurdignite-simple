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
import { Shield, Users, Award, CheckCircle2, Star, Calculator, ScanLine, FileCheck2, CreditCard, FileSignature, ArrowRight, Phone } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import videoCover from '@/assets/video-cover.jpg';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const processSteps = [
  { icon: Shield, title: 'Choisir la formule', desc: 'Sélectionnez la formule AssurDignité adaptée à vos besoins et à votre budget.' },
  { icon: Calculator, title: 'Simulation & validation', desc: "Faites la simulation de votre prime et validez votre choix en quelques secondes." },
  { icon: ScanLine, title: 'Scan CNI & biométrie', desc: 'Scannez votre Carte Nationale d\'Identité et effectuez l\'enregistrement biométrique.' },
  { icon: FileCheck2, title: 'Conditions générales', desc: 'Consultez et acceptez les conditions générales du contrat.' },
  { icon: CreditCard, title: 'Payer', desc: 'Réglez votre prime annuelle en toute sécurité via Mobile Money ou carte.' },
  { icon: FileSignature, title: 'Police & reçu', desc: "Recevez immédiatement votre police d'assurance et votre reçu de paiement." },
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
            <span className="text-base text-secondary font-semibold uppercase tracking-wider">Comment ça marche</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-2">Comment souscrire</h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">Souscrivez en 6 étapes simples, 100% en ligne.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {processSteps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center bg-card rounded-2xl p-5 border-2 border-border hover:border-primary/40 hover:shadow-lg transition-all">
                <div className="relative inline-block mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto shadow-lg">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary text-white text-sm font-bold flex items-center justify-center shadow-md">{i + 1}</span>
                </div>
                <h3 className="font-bold font-display text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
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
                <p className="text-4xl sm:text-5xl font-bold font-display">{stat.value}</p>
                <p className="text-base text-white/80 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-base text-secondary font-semibold uppercase tracking-wider">Témoignages</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-2">Ce que disent nos assurés</h2>
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
                <p className="text-base text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video story section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-muted/40 via-background to-accent/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10 max-w-3xl mx-auto"
          >
            <span className="text-base text-secondary font-semibold uppercase tracking-wider">Notre histoire</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-2">
              Une protection qui prend tout son sens
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
              Découvrez en images pourquoi des milliers de familles ivoiriennes choisissent AssurDignité pour préserver leur sérénité.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
          >
            <video
              src="/videos/family-story.mp4"
              poster="/placeholder.svg"
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto block aspect-video object-cover bg-black"
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg">
              <PlayCircle className="w-4 h-4" /> AssurDignité
            </div>
          </motion.div>
        </div>
      </section>

      <FAQSection />
      <ConditionsSection />
      <ContactSection />

      {/* Final CTA — Parlons de votre protection */}
      <section className="relative py-20 sm:py-24 bg-gradient-to-br from-primary via-primary to-[hsl(var(--sonam-blue))] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold">
              <Shield className="w-4 h-4" /> Appel à l'action
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display">Parlons de votre protection</h2>
            <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              Notre équipe SONAM VIE est à votre écoute pour vous accompagner dans le choix de la formule AssurDignité adaptée à votre famille.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" asChild className="bg-secondary hover:bg-secondary/90 text-white text-base sm:text-lg px-8 gap-2 font-semibold shadow-xl">
                <Link to="/login"><ArrowRight className="w-5 h-5" /> Souscrire maintenant</Link>
              </Button>
              <Button size="lg" asChild className="bg-white/20 border-2 border-white text-white hover:bg-white/30 text-base sm:text-lg px-8 gap-2 backdrop-blur-sm font-semibold">
                <a href="#contact"><Phone className="w-5 h-5" /> Nous contacter</a>
              </Button>
            </div>
            <p className="text-sm text-white/70 pt-2">📞 +225 27 20 31 71 82 • 📧 servicecommercialsonamvie@sonam.ci</p>
          </motion.div>
        </div>
      </section>

      <Footer />
      <ChatBot />
    </div>
  );
};

export default Index;
