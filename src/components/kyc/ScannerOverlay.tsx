import { motion } from 'framer-motion';

type Shape = 'card' | 'oval';

interface Props {
  shape?: Shape;
  hint?: string;
  active?: boolean;
}

/**
 * Sci-fi scan overlay used by ID scanner & liveness check.
 * - "card" = ID-card aspect (1.586:1, like a real CNI)
 * - "oval" = face oval for selfie/liveness
 */
export function ScannerOverlay({ shape = 'card', hint, active = true }: Props) {
  const isCard = shape === 'card';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
      {/* Holographic grid backdrop */}
      <div
        className="absolute inset-0 opacity-30 animate-holo-grid"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--sonam-violet) / 0.25) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--sonam-violet) / 0.25) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }}
      />

      {/* Frame */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative"
        style={
          isCard
            ? { width: 'min(86%, 360px)', aspectRatio: '1.586 / 1' }
            : { width: 'min(72%, 280px)', aspectRatio: '0.78 / 1' }
        }
      >
        <div
          className="absolute inset-0 backdrop-blur-[1px]"
          style={{
            border: '2px solid hsl(0 0% 100% / 0.85)',
            borderRadius: isCard ? '20px' : '50% / 45%',
            boxShadow:
              '0 0 0 9999px hsl(270 60% 8% / 0.55), 0 0 35px hsl(var(--sonam-violet) / 0.45) inset',
          }}
        />

        {/* Corner brackets (only for card) */}
        {isCard && active && (
          <>
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
            {/* Vertical scan line */}
            <div className="absolute inset-3 overflow-hidden rounded-2xl">
              <div
                className="absolute inset-x-0 h-[3px] animate-scan-line"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsl(var(--sonam-green)), transparent)',
                  boxShadow: '0 0 12px hsl(var(--sonam-green))',
                }}
              />
            </div>
          </>
        )}
      </motion.div>

      {hint && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-6 left-4 right-4 mx-auto max-w-sm text-center"
        >
          <div className="px-4 py-2.5 rounded-2xl bg-black/55 backdrop-blur-md text-white text-sm font-medium">
            {hint}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const base = 'absolute w-7 h-7 border-white animate-corner-pulse';
  const map: Record<string, string> = {
    tl: '-top-1 -left-1 border-t-[3px] border-l-[3px] rounded-tl-2xl',
    tr: '-top-1 -right-1 border-t-[3px] border-r-[3px] rounded-tr-2xl',
    bl: '-bottom-1 -left-1 border-b-[3px] border-l-[3px] rounded-bl-2xl',
    br: '-bottom-1 -right-1 border-b-[3px] border-r-[3px] rounded-br-2xl',
  };
  return <div className={`${base} ${map[pos]}`} style={{ boxShadow: '0 0 10px hsl(var(--sonam-green))' }} />;
}
