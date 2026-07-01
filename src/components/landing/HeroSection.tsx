import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calculator, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Typewriter } from '@/components/ui/typewriter';
import heroImg from '@/assets/hero-family.jpg';
import heroImg2 from '@/assets/hero-family-2.jpg';
import heroImg3 from '@/assets/hero-family-3.jpg';
import heroImg4 from '@/assets/hero-family-4.jpg';

const slides = [
  {
    img: heroImg,
    badge: "Assurance Obsèques par SONAM VIE",
    title: "Votre Assurance Obsèques",
    highlight: "SONAM VIE",
    desc: "Choisissez votre niveau de protection. Chaque formule offre une répartition de 70 % en prestations en nature et 30 % en capital espèces, avec un paiement en moins de 12 heures après dépôt et analyse des pièces.",
  },
  {
    img: heroImg2,
    badge: "Trois générations protégées",
    title: "Protégez ceux qui",
    highlight: "comptent le plus",
    desc: "Conjoint, enfants et ascendants couverts dans un même contrat AssurDignité. La sérénité d'une famille unie, à un tarif accessible.",
  },
  {
    img: heroImg3,
    badge: "100% digital, 100% rassurant",
    title: "Souscrivez en ligne",
    highlight: "en quelques minutes",
    desc: "Un parcours simple : simulation, KYC biométrique, paiement Mobile Money et police d'assurance dans votre espace client immédiatement.",
  },
  {
    img: heroImg4,
    badge: "L'héritage qui rassure",
    title: "Préservez la dignité",
    highlight: "de vos proches",
    desc: "70 % en prestations funéraires complètes et 30 % en capital espèces versé aux bénéficiaires en moins de 12 heures après dépôt et analyse des pièces.",
  },
];

const stats = [
  { value: 15000, suffix: '+', label: 'Familles protégées' },
  { value: 12, prefix: '< ', suffix: 'h', label: 'Délai de paiement', sub: 'après dépôt & analyse' },
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = slides[index];

  return (
    <section id="accueil" className="relative min-h-[92vh] sm:min-h-screen flex items-center overflow-hidden pt-28 sm:pt-44 md:pt-52 lg:pt-60">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img src={slide.img} alt="Famille africaine heureuse" className="w-full h-full object-cover" width={1920} height={1080} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-hero" />
        {/* Extra bottom darken for mobile text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent sm:from-black/50 sm:via-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pb-10 sm:pb-16">
        <div className="max-w-3xl mt-2 md:mt-10 lg:mt-14">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.7 }}>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs sm:text-base font-semibold mb-3 sm:mb-6">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {slide.badge}
              </span>
              <h1 className="text-[28px] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 sm:mb-3 font-display drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                {slide.title}{' '}
                <span className="text-sonam-green inline-block">
                  <Typewriter
                    key={`hl-${index}`}
                    text={slide.highlight}
                    speed={75}
                    initialDelay={250}
                    waitTime={60000}
                    loop={false}
                    cursorClassName="ml-1 text-sonam-green"
                  />
                </span>
              </h1>
              <p className="text-sm sm:text-xl md:text-2xl text-white/95 mb-5 sm:mb-8 max-w-2xl font-sans leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] line-clamp-4 sm:line-clamp-none">
                {slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>



          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 mb-8 sm:mb-16">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white text-sm sm:text-lg px-6 sm:px-8 h-11 sm:h-12 gap-2 font-semibold" asChild>
              <a href="#simulateur"><Calculator className="w-4 h-4 sm:w-5 sm:h-5" /> Simuler ma prime</a>
            </Button>
            <Button size="lg" className="bg-white/20 border-2 border-white text-white hover:bg-white/30 text-sm sm:text-lg px-6 sm:px-8 h-11 sm:h-12 gap-2 backdrop-blur-sm font-semibold" asChild>
              <a href="#contact"><ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /> Nous contacter</a>
            </Button>
          </motion.div>


          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                <p className="text-white/80 text-sm sm:text-base mt-1">{stat.label}</p>
                {(stat as any).sub && <p className="text-white/60 text-[11px] sm:text-xs mt-0.5">{(stat as any).sub}</p>}
              </motion.div>
            ))}
          </motion.div>

          {/* Slider controls */}
          <div className="flex items-center gap-3 mt-10">
            <button
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center hover:bg-white/25 transition"
              aria-label="Slide précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-10 bg-secondary' : 'w-2 bg-white/40'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center hover:bg-white/25 transition"
              aria-label="Slide suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
