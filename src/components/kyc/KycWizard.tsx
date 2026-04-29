import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ScanLine, UserCheck, CheckCircle2 } from 'lucide-react';
import { KycProgressBar } from './KycProgressBar';
import { DocumentTypeStep, type DocType } from './DocumentTypeStep';
import { IdScanner } from './IdScanner';
import { LivenessStep } from './LivenessStep';

export interface KycResult {
  docType: DocType;
  country: string;
  cniRecto: Blob;
  cniVerso: Blob;
  selfie: Blob;
  livenessFrames: Blob[];
  livenessScore: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: (r: KycResult) => void;
  title?: string;
}

const DOC_LABELS: Record<DocType, string> = {
  cni: "Carte d'identité nationale",
  passport: 'Passeport',
  permis: 'Permis de conduire',
  sejour: 'Permis de séjour',
};

type StepKey = 'intro' | 'doc' | 'recto' | 'verso' | 'liveness' | 'success';
const ORDER: StepKey[] = ['intro', 'doc', 'recto', 'verso', 'liveness', 'success'];

export function KycWizard({ open, onOpenChange, onComplete, title }: Props) {
  const [stepKey, setStepKey] = useState<StepKey>('intro');
  const [docType, setDocType] = useState<DocType>('cni');
  const [recto, setRecto] = useState<Blob | null>(null);
  const [verso, setVerso] = useState<Blob | null>(null);

  const idx = ORDER.indexOf(stepKey);
  const progress = idx / (ORDER.length - 1);

  const next = () => setStepKey(ORDER[Math.min(idx + 1, ORDER.length - 1)]);
  const prev = () => setStepKey(ORDER[Math.max(idx - 1, 0)]);

  const handleClose = () => {
    setStepKey('intro');
    setRecto(null);
    setVerso(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-3xl overflow-hidden h-[92vh] sm:h-[90vh] flex flex-col">
        {stepKey !== 'intro' && stepKey !== 'success' && (
          <div className="px-3 pt-2 shrink-0">
            <KycProgressBar progress={progress} onBack={idx > 1 ? prev : undefined} onClose={handleClose} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <AnimatePresence mode="wait">
            {stepKey === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_15px_40px_-10px_hsl(var(--primary)/0.5)] animate-pulse-glow"
                  >
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold font-display">{title || "Vérification d'identité"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Suivez ces étapes rapides pour confirmer votre identité, en toute sécurité.
                  </p>

                  <div className="mt-10 w-full max-w-xs space-y-1">
                    <Step n={1} label="Document d'identité" icon={ScanLine} active />
                    <Step n={2} label="Vérification de présence" icon={UserCheck} />
                    <Step n={3} label="Confirmation" icon={CheckCircle2} />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <p className="text-[11px] text-center text-muted-foreground">
                    En continuant, vous reconnaissez notre{' '}
                    <span className="underline">Politique de confidentialité</span>.
                  </p>
                  <Button
                    onClick={next}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90"
                  >
                    Démarrer la vérification
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Sécurisé par <span className="font-semibold text-foreground">SONAM VIE</span>
                  </p>
                </div>
              </motion.div>
            )}

            {stepKey === 'doc' && (
              <motion.div key="doc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DocumentTypeStep value={docType} onChange={setDocType} onNext={next} />
              </motion.div>
            )}

            {stepKey === 'recto' && (
              <motion.div key="recto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <IdScanner
                  side="recto"
                  docLabel={DOC_LABELS[docType]}
                  onCapture={(b) => setRecto(b)}
                  onSkip={next}
                />
              </motion.div>
            )}

            {stepKey === 'verso' && (
              <motion.div key="verso" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <IdScanner
                  side="verso"
                  docLabel={DOC_LABELS[docType]}
                  onCapture={(b) => setVerso(b)}
                  onSkip={next}
                />
              </motion.div>
            )}

            {stepKey === 'liveness' && (
              <motion.div key="liveness" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <LivenessStep
                  onComplete={(selfie, frames, score) => {
                    if (recto && verso) {
                      onComplete({
                        docType,
                        country: 'CI',
                        cniRecto: recto,
                        cniVerso: verso,
                        selfie,
                        livenessFrames: frames,
                        livenessScore: score,
                      });
                    }
                    setStepKey('success');
                  }}
                />
              </motion.div>
            )}

            {stepKey === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative mb-6"
                >
                  <div className="w-24 h-24 rounded-3xl border-[4px] border-secondary flex items-center justify-center bg-secondary/10">
                    <svg viewBox="0 0 50 50" className="w-12 h-12">
                      <path
                        d="M14 26 L22 34 L38 16"
                        stroke="hsl(var(--sonam-green))"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                        style={{ animation: 'check-draw 0.6s 0.2s ease-out forwards' }}
                      />
                    </svg>
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold font-display">Vous avez été vérifié</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  C'est tout, aucune autre action n'est nécessaire.
                </p>
                <Button
                  onClick={handleClose}
                  size="lg"
                  className="mt-10 w-full h-14 rounded-2xl text-base font-semibold"
                >
                  Terminer maintenant
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  n,
  label,
  icon: Icon,
  active,
}: {
  n: number;
  label: string;
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${active ? 'bg-primary/5' : ''}`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {n}
      </div>
      <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-sm ${active ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}
