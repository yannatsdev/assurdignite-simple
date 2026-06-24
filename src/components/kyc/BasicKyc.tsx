import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Check, Loader2, IdCard, ScanFace, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

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
    try {
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

      // Auto OCR on recto
      if (docType === 'cni_recto' && onOcrExtracted) {
        setOcrBusy(true);
        try {
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const { data, error } = await supabase.functions.invoke('kyc-ocr-extract', {
            body: { image: dataUrl },
          });
          if (!error && data) {
            onOcrExtracted(data);
            toast({ title: 'Informations extraites ✓', description: 'Vos champs ont été pré-remplis.' });
          }
        } catch (e) {
          console.warn('OCR failed', e);
        } finally {
          setOcrBusy(false);
        }
      }

      toast({ title: 'Document enregistré', description: DOC_META[docType].label });
    } catch (err: any) {
      console.error('KYC upload error', err);
      toast({ title: 'Erreur upload', description: err.message ?? 'Réessayez.', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map((docType) => (
          <DocCard
            key={docType}
            docType={docType}
            file={uploads[docType]}
            busy={busy === docType || (docType === 'cni_recto' && ocrBusy)}
            onFile={(f) => handleFile(docType, f)}
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
  onFile,
  onClear,
}: {
  docType: BasicKycDocType;
  file?: BasicKycFile;
  busy: boolean;
  onFile: (f: File) => void;
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
