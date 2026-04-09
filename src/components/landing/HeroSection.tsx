import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImg from '@/assets/hero-family.jpg';

const stats = [
  { value: 15000, suffix: '+', label: 'Familles protégées' },
  { value: 12, prefix: '< ', suffix: 'h', label: 'Délai de paiement' },
  { value: 30, suffix: '%', label: 'Bonus Fidélité' },
  { value: 25, suffix: '+', label: "Années d'expérience" },
];

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(value / 60));
        const timer = setInterval(() => {
          start += step;
          if (start >= value) { setCount(value); clearInterval(timer); }
          else setCount(start);
        }, 20);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <p ref={ref} className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-display">{prefix}{count.toLocaleString('fr-FR')}{suffix}</p>;
}

export function HeroSection() {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 8, ease: 'easeOut' }} className="w-full h-full">
          <img src={heroImg} alt="Famille africaine heureuse" className="w-full h-full object-cover" width={1920} height={1080} />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-16">
        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Assurance Obsèques par SONAM VIE
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 font-display">
            Protégez votre famille avec{' '}
            <motion.span
              className="text-sonam-green inline-block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8, type: 'spring', stiffness: 200 }}
            >
              AssurDignité
            </motion.span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-white/80 mb-8 max-w-2xl font-sans leading-relaxed">
            Choisissez votre niveau de protection. Chaque formule offre une répartition de 70 % en prestations en nature (Enlèvement, traitement et conservation du corps, Levée de corps, Allocation cercueil et transfert du corps au lieu d'inhumation) et 30 % en capital espèces, avec un paiement en moins de 12 heures.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white text-base sm:text-lg px-8 gap-2" asChild>
              <a href="#simulateur"><Calculator className="w-5 h-5" /> Simuler ma prime</a>
            </Button>
            <Button size="lg" className="bg-white/20 border-2 border-white text-white hover:bg-white/30 text-base sm:text-lg px-8 gap-2 backdrop-blur-sm" asChild>
              <a href="#contact"><ArrowRight className="w-5 h-5" /> Nous contacter</a>
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                <p className="text-white/70 text-xs sm:text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
