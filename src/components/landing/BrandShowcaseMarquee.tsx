import { motion } from 'framer-motion';
import { Heart, Sparkles, Clock, Award, Globe, ShieldCheck, LucideIcon } from 'lucide-react';
import familyUnited from '@/assets/banners/family-united.jpg';
import familyElderly from '@/assets/banners/family-elderly.jpg';
import familyMother from '@/assets/banners/family-mother.jpg';
import familyPro from '@/assets/banners/family-pro.jpg';
import fastPayout from '@/assets/banners/fast-payout.jpg';

type Card = {
  image: string;
  icon: LucideIcon;
  title: string;
  text: string;
};

const cards: Card[] = [
  { image: familyUnited, icon: Heart, title: 'Familles unies', text: 'Principal + conjoint + 4 enfants + 2 ascendants.' },
  { image: familyElderly, icon: Sparkles, title: 'Dignité préservée', text: '70 % prestations nature + 30 % cash MoMo.' },
  { image: fastPayout, icon: Clock, title: 'Versement < 12 h', text: 'Capital débloqué rapidement après dossier complet.' },
  { image: familyMother, icon: Award, title: 'Bonus Fidélité 30 %', text: '3 ans sans sinistre = 30 % de vos primes restituées.' },
  { image: familyPro, icon: Globe, title: 'Diaspora couverte', text: 'Rapatriement & assistance funéraire incluse.' },
  { image: familyUnited, icon: ShieldCheck, title: 'Porteur CIMA', text: 'SONAM Vie, sécurité réglementaire garantie.' },
];

interface Props {
  className?: string;
  variant?: 'default' | 'compact';
  speed?: number; // seconds
}

export function BrandShowcaseMarquee({ className = '', variant = 'default', speed = 45 }: Props) {
  const isCompact = variant === 'compact';
  const cardW = isCompact ? 'w-[260px] sm:w-[300px]' : 'w-[300px] sm:w-[380px]';
  const cardH = isCompact ? 'h-[200px] sm:h-[220px]' : 'h-[240px] sm:h-[280px]';
  const titleSize = isCompact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-background to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="group flex"
        style={{ ['--gap' as any]: '1.5rem' }}
      >
        <div
          className="flex shrink-0 gap-6 pr-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ ['--duration' as any]: `${speed}s` }}
        >
          {[...cards, ...cards].map((c, i) => {
            const Icon = c.icon;
            return (
              <article
                key={i}
                className={`relative shrink-0 ${cardW} ${cardH} rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-card`}
              >
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[6s] ease-out hover:scale-110"
                />
                {/* Dark layered gradients (image stays visible) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-secondary/15" />

                {/* Top row: icon + brand tag */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    AssurDignité
                  </span>
                </div>

                {/* Bottom: title + subtitle */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-white">
                  <h3 className={`${titleSize} font-bold font-display leading-tight drop-shadow-lg`}>
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-white/85 leading-snug drop-shadow">
                    {c.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

export default BrandShowcaseMarquee;
