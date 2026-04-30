import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SparklesProps {
  className?: string;
  density?: number;
  color?: string; // any CSS color (use hsl(var(--primary)) etc.)
  minSize?: number;
  maxSize?: number;
}

/**
 * Lightweight canvas sparkles overlay. Pointer-events disabled.
 * Place inside a relative container.
 */
export function Sparkles({
  className,
  density = 60,
  color = 'hsl(var(--secondary))',
  minSize = 0.6,
  maxSize = 1.8,
}: SparklesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let particles: { x: number; y: number; r: number; vx: number; vy: number; a: number; va: number }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      particles = Array.from({ length: density }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: minSize + Math.random() * (maxSize - minSize),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        a: Math.random(),
        va: 0.005 + Math.random() * 0.015,
      }));
    };

    const draw = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.va;
        const alpha = (Math.sin(p.a) + 1) / 2;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * 0.85;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [density, color, minSize, maxSize]);

  return (
    <canvas
      ref={ref}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
