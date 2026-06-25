import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Upload, X, Check, RotateCcw, ScanLine, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type OcrExtractedData = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  document_number?: string;
  document_type?: 'cni' | 'passport' | 'driving_license' | 'other';
  address?: string;
  nationality?: string;
  gender?: string;
};

interface Props {
  onExtracted: (data: OcrExtractedData) => void;
  className?: string;
}

const fileToBase64 = (file: File | Blob): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/** Downscale a dataURL to max dimension and JPEG quality — speeds up OCR drastically. */
const compressDataUrl = (dataUrl: string, maxDim = 1280, quality = 0.72): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });


// Tolerant field-name mapping for the AI response
function normalizeExtracted(raw: any): OcrExtractedData {
  if (!raw || typeof raw !== 'object') return {};
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return undefined;
  };
  return {
    first_name: pick('first_name', 'firstName', 'prenom', 'prénom', 'given_name', 'givenName'),
    last_name: pick('last_name', 'lastName', 'nom', 'surname', 'family_name', 'familyName'),
    date_of_birth: pick('date_of_birth', 'dateOfBirth', 'dob', 'date_naissance', 'birth_date', 'birthdate'),
    document_number: pick('document_number', 'documentNumber', 'numero_cni', 'cni', 'numero', 'id_number', 'idNumber', 'passport_number'),
    document_type: (pick('document_type', 'documentType', 'type_document') as any),
    address: pick('address', 'adresse', 'lieu_residence', 'residence'),
    nationality: pick('nationality', 'nationalite', 'nationalité'),
    gender: pick('gender', 'sexe', 'sex'),
  };
}

export function IdCardScanner({ onExtracted, className }: Props) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [recto, setRecto] = useState<string | null>(null);
  const [verso, setVerso] = useState<string | null>(null);
  const [side, setSide] = useState<'recto' | 'verso'>('recto');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  const startCamera = async () => {
    setError(null);
    // Detect feature availability synchronously so we can fall back without breaking the gesture chain
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      // Mobile in-app browsers / iOS PWA: open the native camera input instead
      cameraInputRef.current?.click();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      setStreaming(true);
      // Attach stream after render so the <video> element exists
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          try { await videoRef.current.play(); } catch {}
        }
      }, 50);
    } catch (e: any) {
      setError("Caméra indisponible. Autorisez l'accès dans votre navigateur, ou utilisez l'option « Galerie ».");
      // Best-effort fallback: open native camera input
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setStreaming(false);
  };

  const capture = async () => {
    if (!videoRef.current) return;
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth || 1280;
    c.height = videoRef.current.videoHeight || 720;
    c.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const raw = c.toDataURL('image/jpeg', 0.85);
    const data = await compressDataUrl(raw);
    if (side === 'recto') { setRecto(data); setSide('verso'); }
    else { setVerso(data); }
    stopCamera();
  };

  const onUpload = async (file: File) => {
    if (file.size > 12 * 1024 * 1024) {
      toast({ title: 'Image trop volumineuse', description: 'Max 12 Mo', variant: 'destructive' });
      return;
    }
    const b64 = await fileToBase64(file);
    const compressed = await compressDataUrl(b64);
    if (side === 'recto') { setRecto(compressed); setSide('verso'); }
    else { setVerso(compressed); }
  };

  const runOcr = async () => {
    if (!recto) return;
    setScanning(true);
    setError(null);
    try {
      // Ensure payload size is minimal
      const [r2, v2] = await Promise.all([
        compressDataUrl(recto, 1024, 0.7),
        verso ? compressDataUrl(verso, 1024, 0.7) : Promise.resolve<string | null>(null),
      ]);
      const { data, error } = await supabase.functions.invoke('kyc-ocr-extract', {
        body: { image: r2, image2: v2 || undefined },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const extracted = normalizeExtracted(data?.data ?? data);
      if (!extracted || Object.values(extracted).every(v => !v)) throw new Error('Aucune donnée extraite — essayez une photo plus nette.');
      onExtracted(extracted);
      toast({
        title: '✓ Pièce scannée avec succès',
        description: 'Vos informations ont été pré-remplies automatiquement.',
      });
    } catch (e: any) {
      setError(e.message || 'Échec de la lecture');
      toast({ title: 'Échec OCR', description: e.message || 'Réessayez avec une image plus nette.', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const reset = () => { setRecto(null); setVerso(null); setSide('recto'); setError(null); };

  return (
    <div className={cn('rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-sonam-green/5 p-4 sm:p-5 space-y-4', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <ScanLine className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-base">Scanner ma pièce d'identité (OCR)</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            CNI ou passeport · Vision IA · Pré-remplit automatiquement le formulaire
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
          <Sparkles className="h-3 w-3" /> AI
        </span>
      </div>

      {/* Captured previews */}
      {(recto || verso) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Recto', img: recto, clear: () => setRecto(null) },
            { label: 'Verso', img: verso, clear: () => setVerso(null) },
          ].map(p => (
            <div key={p.label} className="relative rounded-xl overflow-hidden border bg-muted/30 aspect-[3/2] flex items-center justify-center">
              {p.img ? (
                <>
                  <img src={p.img} alt={p.label} className="w-full h-full object-cover" />
                  <button onClick={p.clear} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" /> {p.label}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                  <FileText className="h-5 w-5" /> {p.label} {p.label === 'Verso' && '(optionnel)'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Camera viewport */}
      <AnimatePresence>
        {streaming && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full aspect-[3/2] object-cover bg-black" playsInline autoPlay muted />
            {/* Frame overlay */}
            <div className="absolute inset-6 rounded-lg border-2 border-sonam-green/80 pointer-events-none">
              {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c, i) => (
                <span key={i} className={`absolute h-5 w-5 border-sonam-green ${c}`} />
              ))}
            </div>
            <motion.div
              className="absolute left-6 right-6 h-px bg-sonam-green shadow-[0_0_10px_2px_hsl(var(--sonam-green))]"
              initial={{ top: '15%' }} animate={{ top: ['15%', '85%', '15%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded">
              {side === 'recto' ? '1/2 · RECTO' : '2/2 · VERSO'}
            </span>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              <Button size="sm" onClick={capture} className="gap-1 bg-white text-black hover:bg-white/90"><Camera className="h-4 w-4" /> Capturer</Button>
              <Button size="sm" variant="outline" onClick={stopCamera} className="bg-black/60 text-white border-white/30 hover:bg-black/80">Annuler</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Hidden inputs — camera (mobile native) and gallery (file picker) */}
      <input
        ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
      />
      <input
        ref={galleryInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
      />

      {/* Action buttons */}
      {!streaming && (
        <div className="flex flex-wrap gap-2">
          {(!recto || (recto && !verso)) && (
            <>
              <Button onClick={startCamera} className="gap-1 flex-1 sm:flex-none">
                <Camera className="h-4 w-4" /> {recto ? 'Caméra (verso)' : 'Caméra (recto)'}
              </Button>
              <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()} className="gap-1 flex-1 sm:flex-none">
                <Upload className="h-4 w-4" /> Galerie / Fichier
              </Button>
            </>
          )}

          {recto && (
            <>
              <Button onClick={runOcr} disabled={scanning} className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-primary to-sonam-green text-white">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {scanning ? 'Analyse en cours…' : 'Extraire les informations'}
              </Button>
              <Button onClick={reset} variant="ghost" size="sm" className="gap-1"><RotateCcw className="h-3 w-3" /> Recommencer</Button>
            </>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground italic">
        🔒 Vos images sont traitées par notre IA de manière sécurisée et ne sont pas stockées.
      </p>
    </div>
  );
}
