import { RefObject, useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement>;
  fromRef: RefObject<HTMLElement>;
  toRef: RefObject<HTMLElement>;
  className?: string;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  pathColor?: string;
  pathWidth?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
}

/**
 * Animated SVG beam that connects two elements within a container.
 * Inspired by Magic UI. Use absolutely-positioned SVG over the container.
 */
export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  className,
  curvature = 0,
  reverse = false,
  duration = 4,
  pathColor = 'hsl(var(--border))',
  pathWidth = 2,
  gradientStartColor = 'hsl(var(--primary))',
  gradientStopColor = 'hsl(var(--secondary))',
}: AnimatedBeamProps) {
  const id = useId();
  const [path, setPath] = useState('');
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const c = containerRef.current;
      const a = fromRef.current;
      const b = toRef.current;
      if (!c || !a || !b) return;
      const cr = c.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      setSize({ w: cr.width, h: cr.height });
      const sx = ar.left - cr.left + ar.width / 2;
      const sy = ar.top - cr.top + ar.height / 2;
      const ex = br.left - cr.left + br.width / 2;
      const ey = br.top - cr.top + br.height / 2;
      const cx = (sx + ex) / 2;
      const cy = (sy + ey) / 2 - curvature;
      setPath(`M ${sx},${sy} Q ${cx},${cy} ${ex},${ey}`);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, fromRef, toRef, curvature]);

  return (
    <svg
      width={size.w}
      height={size.h}
      className={cn('pointer-events-none absolute left-0 top-0', className)}
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0">
            <animate attributeName="offset" values={reverse ? '1;0' : '0;1'} dur={`${duration}s`} repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor={gradientStartColor} stopOpacity="1">
            <animate attributeName="offset" values={reverse ? '1;0' : '0;1'} dur={`${duration}s`} repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0">
            <animate attributeName="offset" values={reverse ? '1;0' : '0;1'} dur={`${duration}s`} repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <path d={path} stroke={pathColor} strokeWidth={pathWidth} strokeOpacity={0.25} fill="none" />
      <path d={path} stroke={`url(#grad-${id})`} strokeWidth={pathWidth} strokeLinecap="round" fill="none" />
    </svg>
  );
}
