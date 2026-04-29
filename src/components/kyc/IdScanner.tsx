import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, Upload, RotateCw, Check } from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';

interface Props {
  side: 'recto' | 'verso';
  docLabel: string;
  onCapture: (blob: Blob) => void;
  onSkip?: () => void;
}

export function IdScanner({ side, docLabel, onCapture, onSkip }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e: any) {
        setError(e?.message || "Caméra indisponible");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const capture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    // brief flash effect via CSS, then snap
    await new Promise((r) => setTimeout(r, 250));
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCaptured(dataUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
        setCapturing(false);
      },
      'image/jpeg',
      0.88,
    );
  };

  const retake = () => setCaptured(null);

  const handleFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setCaptured(url);
    onCapture(f);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
          Scanner le {side}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Assurez-vous qu'il s'agit d'une {docLabel.toLowerCase()} valide qui montre clairement vos
          informations et la date d'expiration.
        </p>
      </div>

      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.45)]">
        {captured ? (
          <img src={captured} alt="Capture" className="w-full h-full object-cover" />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
            <Camera className="w-10 h-10 mb-3 opacity-60" />
            <p className="text-sm opacity-80 mb-4">Caméra non disponible. Importez une photo à la place.</p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <Upload className="w-4 h-4" /> Choisir un fichier
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <ScannerOverlay
              shape="card"
              hint={`Placez le ${side} de votre pièce d'identité dans le cadre.`}
              active={!capturing}
            />
            {capturing && <div className="absolute inset-0 bg-white animate-fade-in pointer-events-none" />}
            {/* Doc badge */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md text-white text-xs flex items-center gap-2">
              <span>🇨🇮</span> <span>{docLabel}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        {captured ? (
          <>
            <Button variant="outline" onClick={retake} className="flex-1 h-12 rounded-2xl gap-2">
              <RotateCw className="w-4 h-4" /> Reprendre
            </Button>
            <Button onClick={onSkip} className="flex-1 h-12 rounded-2xl gap-2">
              <Check className="w-4 h-4" /> Valider
            </Button>
          </>
        ) : !error ? (
          <Button
            onClick={capture}
            disabled={capturing || !stream}
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
          >
            <Camera className="w-5 h-5" />
            Prendre une photo du {side}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
