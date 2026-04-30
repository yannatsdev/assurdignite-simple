import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** seconds for one full loop */
  speed?: number;
  vertical?: boolean;
}

/**
 * Premium infinite marquee. Duplicates children to create a seamless loop.
 * Animation defined inline below; no Tailwind config change required.
 */
export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  speed = 30,
  vertical = false,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        'group relative flex overflow-hidden [--gap:1.5rem] [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className={cn(
            'flex shrink-0 [gap:var(--gap)]',
            vertical ? 'flex-col animate-marquee-vertical' : 'flex-row animate-marquee',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
          style={{
            animationDirection: reverse ? 'reverse' : 'normal',
            animationDuration: `${speed}s`,
          }}
          aria-hidden={i === 1 ? true : undefined}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
