import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { useAdhesionProgress, type OcrPhase, type KycDoc, type KycPhase } from '@/stores/adhesion-progress';
import { cn } from '@/lib/utils';

const MACRO = ['Simulation', 'Identité', 'KYC & bénéficiaires', 'Signature & paiement', 'Confirmation'];

const OCR_LABEL: Record<OcrPhase, string> = {
  idle: '',
  compressing: 'Préparation de l’image…',
  uploading: 'Envoi sécurisé…',
  analyzing: 'Analyse IA en cours…',
  done: 'Pièce reconnue ✓',
  error: 'Échec — nouvelle tentative possible',
};

const KYC_LABELS: Record<KycDoc, string> = {
  cni_recto: 'CNI recto',
  cni_verso: 'CNI verso',
  selfie: 'Selfie',
  domicile: 'Domicile',
};

function KycDot({ phase }: { phase: KycPhase }) {
  if (phase === 'done') return <Check className="h-3 w-3 text-emerald-500" />;
  if (phase === 'uploading') return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
  if (phase === 'error') return <AlertTriangle className="h-3 w-3 text-destructive" />;
  return <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />;
}

export function UnifiedProgressBar() {
  const s = useAdhesionProgress();
  const pct = Math.round(((s.macroStep + 1) / MACRO.length) * 100);

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <span className="font-medium text-foreground/80">
            Étape {s.macroStep + 1}/{MACRO.length} — {MACRO[s.macroStep] ?? ''}
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>

        {/* Sub-status row */}
        {(s.ocr.phase !== 'idle' || Object.values(s.kyc).some((p) => p !== 'idle') || s.validationMissing.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px]">
            {s.ocr.phase !== 'idle' && (
              <span className={cn('inline-flex items-center gap-1', s.ocr.phase === 'error' ? 'text-destructive' : 'text-primary')}>
                {s.ocr.phase !== 'done' && s.ocr.phase !== 'error' && <Loader2 className="h-3 w-3 animate-spin" />}
                {s.ocr.phase === 'done' && <Check className="h-3 w-3" />}
                {s.ocr.phase === 'error' && <AlertTriangle className="h-3 w-3" />}
                OCR: {OCR_LABEL[s.ocr.phase]}
              </span>
            )}
            {(['cni_recto', 'cni_verso', 'selfie', 'domicile'] as KycDoc[])
              .filter((d) => s.kyc[d] !== 'idle')
              .map((d) => (
                <span key={d} className="inline-flex items-center gap-1 text-muted-foreground">
                  <KycDot phase={s.kyc[d]} /> {KYC_LABELS[d]}
                </span>
              ))}
            {s.validationMissing.length > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" /> {s.validationMissing.length} élément(s) manquant(s)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedProgressBar;
