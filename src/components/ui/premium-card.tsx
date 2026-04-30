import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'gradient' | 'outline' | 'glass' | 'solid';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  hoverable?: boolean;
}

const variantClass: Record<Variant, string> = {
  gradient: 'bg-gradient-to-br from-primary/10 via-white to-accent/30 border border-primary/15 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)]',
  outline: 'bg-white border border-border shadow-sm',
  glass: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-xl',
  solid: 'bg-card border border-border shadow-md',
};

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = 'outline', hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl p-5 sm:p-6 transition-all duration-300',
        variantClass[variant],
        hoverable && 'hover:shadow-xl hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    />
  )
);
PremiumCard.displayName = 'PremiumCard';
