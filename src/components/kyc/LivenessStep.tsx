import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Smile, Sun, EyeOff, Ban, Camera } from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';

interface Props {
  onComplete: (selfie: Blob, frames: Blob[], score: number) => void;
}

const CHALLENGES = [
  { key: 'center', label: 'Regardez droit vers la caméra' },
  { key: 'left', label: 'Tournez doucement la tête à gauche' },
  { key: 'right', label: 'Tournez doucement la tête à droite' },
  { key: 'smile', label: 'Souriez 😊' },
];

export function LivenessStep({ onComplete }: Props) {
  const [phase, setPhase] = useState<'intro' | 'live' | 'done'>('intro');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const framesRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      setPhase('live');
    } catch (e: any) {
      setError(e?.message || 'Caméra non disponible');
    }
  };

  const captureFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const v = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext('2d')?.drawImage(v, 0, 0);
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
    });
  };

  // run challenges sequentially
  useEffect(() => {
    if (phase !== 'live') return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < CHALLENGES.length; i++) {
        if (cancelled) return;
        setStep(i);
        // animate the ring 0 → 100 over 2.2s
        const start = performance.now();
        const dur = 2200;
        await new Promise<void>((resolve) => {
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            setProgress(p);
            if (p < 1 && !cancelled) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
        const frame = await captureFrame();
        if (frame) framesRef.current.push(frame);
      }
      if (cancelled) return;
      const selfie = await captureFrame();
      stream?.getTracks().forEach((t) => t.stop());
      const score = 0.86 + Math.random() * 0.12; // simulated liveness score
      if (selfie) {
        setPhase('done');
        onComplete(selfie, framesRef.current, Number(score.toFixed(2)));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  if (phase === 'intro') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
            Préparez-vous pour un selfie
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nous allons prendre quelques images de votre visage pour confirmer que c'est bien vous.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-muted to-secondary/10 p-8 flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-32 h-44 rounded-2xl border-[6px] border-foreground bg-background relative overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-foreground/60" />
              <div className="absolute inset-3 rounded-xl bg-gradient-to-b from-primary/15 to-secondary/20 flex items-center justify-center">
                <div className="w-16 h-20 rounded-full border-[3px] border-secondary animate-pulse-glow" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-3">
          <Tip icon={Sun} text="Tenez-vous dans une pièce bien éclairée." />
          <Tip icon={EyeOff} text="Retirez chapeaux, écharpes ou lunettes de soleil." />
          <Tip icon={Ban} text="Pas de lunettes pour éviter les reflets ou les éblouissements." />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={startCamera} size="lg" className="w-full h-14 rounded-2xl text-base font-semibold gap-2">
          <Camera className="w-5 h-5" /> Démarrer la vérification faciale
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold font-display">Vérification de présence</h2>
      </div>

      <div className="relative w-full aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.45)]">
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
        <ScannerOverlay shape="oval" />

        {/* Progress ring around oval */}
        <svg
          viewBox="0 0 100 130"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <ellipse
            cx="50"
            cy="65"
            rx="36"
            ry="46"
            fill="none"
            stroke="hsl(var(--sonam-green))"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray={`${progress * 260} 260`}
            style={{ filter: 'drop-shadow(0 0 4px hsl(var(--sonam-green)))' }}
          />
        </svg>

        {/* Challenge text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute bottom-5 left-4 right-4 mx-auto max-w-sm"
          >
            <div className="px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-sm font-medium text-center flex items-center justify-center gap-2">
              {step === 3 && <Smile className="w-4 h-4" />}
              {CHALLENGES[step].label}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2">
        {CHALLENGES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i < step ? 'w-8 bg-secondary' : i === step ? 'w-12 bg-primary' : 'w-8 bg-muted'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function Tip({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm text-muted-foreground">
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
