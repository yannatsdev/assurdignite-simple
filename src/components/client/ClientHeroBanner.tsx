import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ClientHeroBannerProps {
  image: string;
  title: string;
  subtitle?: string;
  cta?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  height?: string;
}

/**
 * Premium hero banner used across the client portal.
 * Background image + dark gradient + glassmorphism content + entrance animation.
 */
export function ClientHeroBanner({
  image,
  title,
  subtitle,
  cta,
  align = 'left',
  className,
  height = 'h-44 sm:h-56',
}: ClientHeroBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-lg',
        height,
        className,
      )}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover scale-105 transition-transform duration-[8s] hover:scale-110"
        loading="lazy"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
      {/* Brand violet glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-transparent" />

      <div
        className={cn(
          'relative z-10 flex h-full w-full flex-col justify-end p-5 sm:p-7',
          align === 'center' && 'items-center text-center',
        )}
      >
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white drop-shadow-lg leading-tight"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-2 max-w-xl text-sm sm:text-base text-white/90 drop-shadow"
          >
            {subtitle}
          </motion.p>
        )}
        {cta && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-4"
          >
            {cta}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
