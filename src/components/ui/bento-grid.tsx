import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[14rem]', className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  className?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  background?: ReactNode;
  cta?: ReactNode;
  /** col-span / row-span tailwind classes */
  span?: string;
  delay?: number;
}

export function BentoCard({ className, title, description, icon, background, cta, span, delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft hover:shadow-premium transition-all duration-500',
        span,
        className,
      )}
    >
      {/* Background visual */}
      {background && (
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          {background}
        </div>
      )}
      {/* Strong gradient overlay for legibility on imagery */}
      {background && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-6">
        {icon && (
          <div className="mb-3 inline-flex w-fit items-center justify-center rounded-2xl bg-white/15 p-2.5 text-white backdrop-blur-md ring-1 ring-white/20 transition-transform duration-300 group-hover:-translate-y-1">
            {icon}
          </div>
        )}
        <h3 className={cn('text-lg sm:text-xl font-bold font-display drop-shadow-md', background ? 'text-white' : 'text-foreground')}>{title}</h3>
        {description && (
          <p className={cn('mt-1.5 text-sm leading-relaxed drop-shadow', background ? 'text-white/90' : 'text-muted-foreground')}>{description}</p>
        )}
        {cta && <div className="mt-3">{cta}</div>}
      </div>

      {/* Hover ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-0 ring-primary/0 transition-all duration-500 group-hover:ring-2 group-hover:ring-primary/30" />
    </motion.div>
  );
}
