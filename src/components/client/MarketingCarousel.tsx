import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Award, Clock, Users } from 'lucide-react';
import familyUnited from '@/assets/banners/family-united.jpg';
import familyElderly from '@/assets/banners/family-elderly.jpg';
import familyMother from '@/assets/banners/family-mother.jpg';
import fastPayout from '@/assets/banners/fast-payout.jpg';

const slides = [
  {
    image: familyUnited,
    title: 'Familles unies, protégées ensemble',
    text: 'Couverture étendue : principal, conjoint, jusqu\'à 4 enfants et 2 ascendants.',
    icon: Heart,
  },
  {
    image: familyElderly,
    title: 'Dignité jusqu\'au dernier souffle',
    text: 'Prestations en nature 70% + 30% en capital espèces aux bénéficiaires.',
    icon: Users,
  },
  {
    image: fastPayout,
    title: 'Versement express en moins de 12h',
    text: 'Capital versé rapidement après dépôt et analyse des pièces.',
    icon: Clock,
  },
  {
    image: familyMother,
    title: 'Bonus Fidélité jusqu\'à 30%',
    text: '3 années consécutives sans sinistre = 30% de vos primes restituées.',
    icon: Award,
  },
];

interface Props {
  className?: string;
  interval?: number;
}

export function MarketingCarousel({ className, interval = 5500 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [interval]);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <div
      className={`relative h-44 sm:h-52 w-full overflow-hidden rounded-3xl border border-border shadow-md ${className || ''}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img src={slide.image} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/35 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full w-full flex-col justify-end p-5 sm:p-6 text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 p-2 mb-2.5">
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display drop-shadow-lg leading-tight">
              {slide.title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-white/90 drop-shadow">{slide.text}</p>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
