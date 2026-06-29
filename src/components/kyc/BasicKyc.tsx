import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Check, Loader2, IdCard, ScanFace, FileText, X, AlertTriangle, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { track } from '@/lib/telemetry';
import { adhesionProgress } from '@/stores/adhesion-progress';


export type BasicKycDocType = 'cni_recto' | 'cni_verso' | 'selfie' | 'domicile';

export interface BasicKycFile {
  doc_type: BasicKycDocType;
  storage_path: string;
  preview?: string;
}

interface Props {
  /** Suffix used in storage path to distinguish principal vs conjoint */
  scope?: 'principal' | 'conjoint';
  contractId?: string;
  /** Called with the saved DB row id whenever a doc is uploaded */
  onUploaded?: (file: BasicKycFile) => void;
  /** Optional OCR callback (uses ocr-id-card edge function on the recto). */
  onOcrExtracted?: (data: {
    last_name?: string;
    first_name?: string;
    date_of_birth?: string;
    document_number?: string;
    address?: string;
  }) => void;
  /** Hide selfie / domicile blocks when only ID is needed (e.g. for spouse) */
  compact?: boolean;
}

const DOC_META: Record<
  BasicKycDocType,
  { label: string; helper: string; icon: typeof IdCard; capture?: 'environment' | 'user' }
> = {
  cni_recto: {
    label: "Pièce d'identité (recto)",
    helper: 'CNI, passeport ou permis — face avec photo.',
    icon: IdCard,
    capture: 'environment',
  },
  cni_verso: {
    label: "Pièce d'identité (verso)",
    helper: 'Face arrière de votre pièce.',
    icon: IdCard,
    capture: 'environment',
  },
  selfie: {
    label: 'Selfie / Photo de vous',
    helper: 'Une photo nette de votre visage pour validation.',
    icon: ScanFace,
    capture: 'user',
  },
  domicile: {
    label: 'Justificatif de domicile (optionnel)',
    helper: 'Facture eau/électricité de moins de 3 mois.',
    icon: FileText,
  },
};

export function BasicKyc({
  scope = 'principal',
  contractId,
  onUploaded,
  onOcrExtracted,
  compact = false,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Record<BasicKycDocType, BasicKycFile | undefined>>({
    cni_recto: undefined,
    cni_verso: undefined,
    selfie: undefined,
    domicile: undefined,
  });
  const [busy, setBusy] = useState<BasicKycDocType | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<BasicKycDocType, string>>>({});
  const [lastFile, setLastFile] = useState<Partial<Record<BasicKycDocType, File>>>({});
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSkipped, setOcrSkipped] = useState(false);


  const docs: BasicKycDocType[] = compact
    ? ['cni_recto', 'cni_verso']
    : ['cni_recto', 'cni_verso', 'selfie', 'domicile'];

  const handleFile = async (docType: BasicKycDocType, file: File) => {
    if (!user) {
      toast({ title: 'Veuillez vous reconnecter', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux', description: 'Maximum 10 Mo.', variant: 'destructive' });
      return;
    }
    setBusy(docType);
    setErrors((p) => ({ ...p, [docType]: undefined }));
    setLastFile((p) => ({ ...p, [docType]: file }));
    adhesionProgress.setKyc(docType, 'uploading');
    try {
      await track({ kind: 'kyc', name: `kyc.upload.${docType}`, meta: { size: file.size } }, async () => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/${contractId || 'draft'}/${scope}-${docType}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('kyc-documents')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;

        const { error: dbErr } = await supabase.from('kyc_documents').insert({
          user_id: user.id,
          contract_id: contractId || null,
          doc_type: docType,
          storage_path: path,
          mime_type: file.type,
          status: 'pending',
        });
        if (dbErr) throw dbErr;

        const preview = URL.createObjectURL(file);
        const next = { doc_type: docType, storage_path: path, preview };
        setUploads((prev) => ({ ...prev, [docType]: next }));
        onUploaded?.(next);
      });
      adhesionProgress.setKyc(docType, 'done');

      // Auto OCR on recto
      if (docType === 'cni_recto' && onOcrExtracted && !ocrSkipped) {
        setOcrBusy(true);
        setOcrError(null);
        adhesionProgress.setOcr('compressing');
        try {
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          adhesionProgress.setOcr('analyzing');
          const data = await track({ kind: 'ocr', name: 'ocr.extract', meta: { bytes: dataUrl.length } }, async () => {
            const { data, error } = await supabase.functions.invoke('kyc-ocr-extract', { body: { image: dataUrl } });
            if (error) throw error;
            return data;
          });
          if (data) {
            onOcrExtracted(data);
            adhesionProgress.setOcr('done');
            toast({ title: 'Informations extraites ✓', description: 'Étape suivante : verso de votre pièce.' });
          }
        } catch (e: any) {
          console.warn('OCR failed', e);
          adhesionProgress.setOcr('error');
          setOcrError(e?.message || 'Lecture impossible — image floue ou éclairage insuffisant.');
        } finally {
          setOcrBusy(false);
        }
      }

      const nextHint =
        docType === 'cni_recto' ? 'Étape suivante : verso de la pièce.' :
        docType === 'cni_verso' ? 'Étape suivante : selfie.' :
        docType === 'selfie' ? 'Étape suivante : justificatif de domicile (optionnel).' :
        'Vous pouvez continuer.';
      toast({ title: 'Document enregistré ✓', description: nextHint });
    } catch (err: any) {
      console.error('KYC upload error', err);
      adhesionProgress.setKyc(docType, 'error');
      setErrors((p) => ({ ...p, [docType]: err?.message || 'Erreur réseau' }));
      toast({ title: 'Échec — réessayez', description: err.message ?? 'Connexion instable ?', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const retryOcr = async () => {
    const f = lastFile.cni_recto;
    if (!f) return;
    setOcrError(null);
    await handleFile('cni_recto', f);
  };

  const skipOcr = () => {
    setOcrSkipped(true);
    setOcrError(null);
    adhesionProgress.setOcr('idle');
    toast({ title: 'Saisie manuelle', description: 'Renseignez vos infos ci-dessus, c\'est tout aussi valide.' });
  };


  return (
    <div className="space-y-4">
      {ocrError && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-medium">Lecture automatique impossible</p>
              <p className="text-muted-foreground">{ocrError} — réessayez avec une photo nette ou continuez en saisie manuelle.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" size="sm" variant="outline" onClick={retryOcr} className="gap-1.5 h-8">
              <RotateCw className="h-3.5 w-3.5" /> Réessayer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={skipOcr} className="h-8">
              Saisir manuellement
            </Button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map((docType) => (
          <DocCard
            key={docType}
            docType={docType}
            file={uploads[docType]}
            busy={busy === docType || (docType === 'cni_recto' && ocrBusy)}
            error={errors[docType]}
            onFile={(f) => handleFile(docType, f)}
            onRetry={lastFile[docType] ? () => handleFile(docType, lastFile[docType]!) : undefined}
            onClear={() => setUploads((p) => ({ ...p, [docType]: undefined }))}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Vos documents sont chiffrés et stockés de manière sécurisée. Ils ne servent qu'à valider votre identité auprès de SONAM VIE.
      </p>
    </div>
  );
}

function DocCard({
  docType,
  file,
  busy,
  error,
  onFile,
  onRetry,
  onClear,
}: {
  docType: BasicKycDocType;
  file?: BasicKycFile;
  busy: boolean;
  error?: string;
  onFile: (f: File) => void;
  onRetry?: () => void;
  onClear: () => void;
}) {

  const meta = DOC_META[docType];
  const Icon = meta.icon;
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <Label className="text-sm font-semibold leading-tight">{meta.label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.helper}</p>
        </div>
        {file && (
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive p-1"
            aria-label="Retirer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {file?.preview ? (
        <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-border bg-background">
          <img src={file.preview} alt={meta.label} className="w-full h-32 object-cover" />
          <div className="px-3 py-1.5 text-xs text-emerald-600 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Enregistré
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => galleryRef.current?.click()}
            className="gap-1.5"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="text-xs">Importer</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="gap-1.5"
          >
            <Camera className="h-4 w-4" />
            <span className="text-xs">Photo</span>
          </Button>
        </div>
      )}

      {/* Hidden inputs — gallery vs camera */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture={meta.capture ?? 'environment'}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </motion.div>
  );
}

export default BasicKyc;
