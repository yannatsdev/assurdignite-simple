import * as React from 'react';
import { motion } from 'framer-motion';
import familyUnited from '@/assets/banners/family-united.jpg';
import familyElderly from '@/assets/banners/family-elderly.jpg';
import familyMother from '@/assets/banners/family-mother.jpg';
import familyPro from '@/assets/banners/family-pro.jpg';
import { cn } from '@/lib/utils';
import { Sparkles, ShieldCheck } from 'lucide-react';

const IMAGES = {
  united: familyUnited,
  elderly: familyElderly,
  mother: familyMother,
  pro: familyPro,
};

interface Props {
  variant?: keyof typeof IMAGES;
  rotate?: boolean;        // cycle through all
  title?: string;
  subtitle?: string;
  badge?: string;
  size?: 'compact' | 'wide' | 'hero';
  className?: string;
  children?: React.ReactNode;
}

export const FamilyBanner: React.FC<Props> = ({
  variant = 'united', rotate, title, subtitle, badge, size = 'wide', className, children,
}) => {
  const keys = Object.keys(IMAGES) as (keyof typeof IMAGES)[];
  const [idx, setIdx] = React.useState(keys.indexOf(variant));

  React.useEffect(() => {
    if (!rotate) return;
    const t = setInterval(() => setIdx(i => (i + 1) % keys.length), 6000);
    return () => clearInterval(t);
  }, [rotate]);

  const img = rotate ? IMAGES[keys[idx]] : IMAGES[variant];
  const heightCls = size === 'hero' ? 'h-56 sm:h-72 md:h-80' : size === 'wide' ? 'h-40 sm:h-48' : 'h-28 sm:h-32';

  return (
    <div className={cn('relative w-full overflow-hidden rounded-2xl shadow-lg', heightCls, className)}>
      <motion.img
        key={img}
        src={img}
        alt="Famille AssurDignité"
        loading="lazy"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--sonam-violet))]/85 via-[hsl(var(--sonam-violet))]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Decorative blobs */}
      <motion.div
        className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-sonam-green/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative z-10 h-full flex flex-col justify-center p-4 sm:p-6 md:p-8 max-w-xl text-white">
        {badge && (
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider w-max border border-white/20">
            <Sparkles className="h-3 w-3 text-amber-300" /> {badge}
          </motion.span>
        )}
        {title && (
          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-display font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-2 leading-tight drop-shadow-lg">
            {title}
          </motion.h2>
        )}
        {subtitle && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-xs sm:text-sm md:text-base text-white/90 mt-1.5 sm:mt-2 max-w-md drop-shadow">
            {subtitle}
          </motion.p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-white/80 font-mono">
        <ShieldCheck className="h-3 w-3" /> SONAM VIE · AssurDignité
      </div>
    </div>
  );
};
