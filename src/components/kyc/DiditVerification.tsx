import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2, AlertCircle, ExternalLink, ScanFace, FileCheck2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type KycStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'declined';

export type ExtractedKycData = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string; // ISO YYYY-MM-DD
  document_number?: string;
  address?: string;
  nationality?: string;
  gender?: string;
};

// Robust parser for various Didit payload shapes (v3)
export function parseDiditPayload(payload: any): ExtractedKycData {
  if (!payload || typeof payload !== 'object') return {};

  // Recursively flatten promising sub-objects
  const candidates: any[] = [];
  const seen = new WeakSet();
  const walk = (o: any, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 4 || seen.has(o)) return;
    seen.add(o);
    candidates.push(o);
    for (const k of Object.keys(o)) {
      const v = (o as any)[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, depth + 1);
      else if (Array.isArray(v)) v.forEach((it) => walk(it, depth + 1));
    }
  };
  walk(payload);

  const pick = (...keys: string[]): string | undefined => {
    for (const c of candidates) {
      for (const k of keys) {
        const v = c?.[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
    return undefined;
  };

  // Normalize date to YYYY-MM-DD
  const normalizeDate = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return undefined;
  };

  let address = pick('address', 'full_address', 'formatted_address');
  if (!address) {
    const parts = [
      pick('street', 'address_line_1', 'address1'),
      pick('city', 'locality'),
      pick('state', 'region', 'province'),
      pick('postal_code', 'zip', 'zip_code'),
      pick('country', 'country_name'),
    ].filter(Boolean);
    if (parts.length) address = parts.join(', ');
  }

  return {
    first_name: pick('first_name', 'firstName', 'given_name', 'givenNames', 'given_names', 'prenom', 'prenoms'),
    last_name: pick('last_name', 'lastName', 'family_name', 'surname', 'nom'),
    date_of_birth: normalizeDate(pick('date_of_birth', 'dateOfBirth', 'birth_date', 'dob', 'date_naissance')),
    document_number: pick('document_number', 'documentNumber', 'id_number', 'number', 'numero_piece', 'cni'),
    address,
    nationality: pick('nationality', 'country_of_nationality', 'nationalite'),
    gender: pick('gender', 'sex', 'sexe'),
  };
}

interface DiditVerificationProps {
  vendorDataSuffix?: string; // e.g. 'conjoint'
  label?: string;
  onApproved?: () => void;
  onExtractedData?: (data: ExtractedKycData) => void;
  className?: string;
}

const STATUS_LABEL: Record<KycStatus, { text: string; tone: 'default' | 'secondary' | 'destructive' | 'success' }> = {
  not_started: { text: 'Non démarré', tone: 'secondary' },
  pending: { text: 'En cours…', tone: 'secondary' },
  in_review: { text: 'En revue', tone: 'secondary' },
  approved: { text: 'Identité vérifiée', tone: 'success' },
  declined: { text: 'Refusée', tone: 'destructive' },
};

export function DiditVerification({
  vendorDataSuffix,
  label = "Vérifier mon identité",
  onApproved,
  onExtractedData,
  className = '',
}: DiditVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<KycStatus>('not_started');
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const sdkRef = useRef<any>(null);
  const pollRef = useRef<number | null>(null);
  const extractedFiredRef = useRef(false);

  const fireExtracted = (payload: any) => {
    if (extractedFiredRef.current || !onExtractedData) return;
    const data = parseDiditPayload(payload);
    const hasAny = Object.values(data).some((v) => typeof v === 'string' && v.trim());
    if (!hasAny) return;
    extractedFiredRef.current = true;
    onExtractedData(data);
  };

  // Load initial status (only for principal)
  useEffect(() => {
    if (!user || vendorDataSuffix) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('kyc_status, kyc_payload')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data?.kyc_status) {
        setStatus(data.kyc_status as KycStatus);
        if (data.kyc_status === 'approved' && data.kyc_payload) {
          fireExtracted(data.kyc_payload);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, vendorDataSuffix]);

  // Realtime subscription on profile row
  useEffect(() => {
    if (!user || vendorDataSuffix) return;
    const channel = supabase
      .channel(`kyc-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as any;
          const next = row?.kyc_status as KycStatus | undefined;
          if (next) {
            setStatus(next);
            if (next === 'approved') {
              onApproved?.();
              if (row?.kyc_payload) fireExtracted(row.kyc_payload);
              toast({ title: 'Identité vérifiée ✓', description: 'Vos informations ont été récupérées automatiquement.' });
            }
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, vendorDataSuffix, onApproved, toast]);

  // Polling fallback while pending
  useEffect(() => {
    if (vendorDataSuffix) return;
    if (status !== 'pending' && status !== 'in_review') {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (!user) return;
    pollRef.current = window.setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.kyc_status) {
        setStatus(data.kyc_status as KycStatus);
      }
    }, 4000);
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [status, user, vendorDataSuffix]);

  async function handleVerify() {
    if (!user) return;
    setLoading(true);
    setCurrentStep(null);
    try {
      const { data, error } = await supabase.functions.invoke('didit-create-session', {
        body: { vendor_data_suffix: vendorDataSuffix },
      });
      if (error || !data?.verification_url) {
        throw new Error(error?.message || 'Impossible de créer la session de vérification');
      }
      setVerificationUrl(data.verification_url);

      const mod = await import('@didit-protocol/sdk-web');
      const DiditSdk: any = (mod as any).DiditSdk ?? (mod as any).default;
      sdkRef.current = DiditSdk.shared ?? DiditSdk;

      sdkRef.current.onComplete = (result: any) => {
        if (result?.type === 'completed') {
          const s = (result.session?.status ?? 'pending').toLowerCase();
          const mapped: KycStatus =
            s === 'approved' ? 'approved' : s === 'declined' ? 'declined' : 'in_review';
          if (!vendorDataSuffix) setStatus(mapped);
          if (mapped === 'approved') {
            onApproved?.();
            fireExtracted(result.session ?? result);
          }
        } else if (result?.type === 'cancelled') {
          toast({ title: 'Vérification annulée', description: 'Vous pouvez réessayer.' });
        } else if (result?.type === 'failed') {
          toast({
            title: 'Échec',
            description: result.error?.message ?? 'Erreur inconnue',
            variant: 'destructive',
          });
        }
      };

      sdkRef.current.onEvent = (event: any) => {
        if (event?.data?.step) setCurrentStep(event.data.step);
      };

      sdkRef.current.startVerification({
        url: data.verification_url,
        configuration: {
          loggingEnabled: import.meta.env.DEV,
          showExitConfirmation: true,
          closeModalOnComplete: true,
        },
      });

      if (!vendorDataSuffix) setStatus('pending');
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: e?.message ?? 'Impossible de démarrer la vérification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const meta = STATUS_LABEL[status];
  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 'in_review';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-sonam-green/5 p-6 ${className}`}
    >
      {/* Glow background */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-sonam-green/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isApproved ? 'bg-sonam-green/15 text-sonam-green' : 'bg-primary/10 text-primary'
              }`}
            >
              {isApproved ? <ShieldCheck className="h-6 w-6" /> : <ScanFace className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="font-playfair text-lg font-bold leading-tight">
                Vérification d'identité sécurisée
              </h3>
              <p className="text-xs text-muted-foreground">
                Propulsée par <span className="font-semibold">Nirva</span> · CNI, passeport, selfie
              </p>
            </div>
          </div>
          <Badge
            variant={meta.tone === 'success' ? 'default' : meta.tone === 'destructive' ? 'destructive' : 'secondary'}
            className={meta.tone === 'success' ? 'bg-sonam-green text-white' : ''}
          >
            {meta.text}
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          {!isApproved && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3"
            >
              {/* Sci-fi pre-verification animation */}
              <div className="relative h-40 sm:h-48 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-[hsl(var(--sonam-violet))]/10 via-background to-sonam-green/10">
                {/* Holographic grid */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                {/* Radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.25),transparent_60%)]" />

                {/* Scanning line */}
                <motion.div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-sonam-green to-transparent shadow-[0_0_12px_2px_hsl(var(--sonam-green))]"
                  initial={{ top: '10%' }}
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Centered face frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative h-24 w-24 sm:h-28 sm:w-28"
                  >
                    {/* Animated rotating ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-primary/40"
                    />
                    {/* Inner ring counter-rotate */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-2 rounded-full border border-sonam-green/50"
                    />
                    {/* Corners */}
                    {[
                      'top-0 left-0 border-t-2 border-l-2 rounded-tl-md',
                      'top-0 right-0 border-t-2 border-r-2 rounded-tr-md',
                      'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md',
                      'bottom-0 right-0 border-b-2 border-r-2 rounded-br-md',
                    ].map((c, i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
                        className={`absolute h-4 w-4 border-sonam-green ${c}`}
                      />
                    ))}
                    {/* Face icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanFace className="h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
                    </div>
                  </motion.div>
                </div>

                {/* Status pill */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-sonam-green"
                  />
                  Système prêt
                </div>
                <div className="absolute bottom-2 right-2 font-mono text-[10px] text-muted-foreground">
                  NIRVA · KYC v1.0
                </div>
              </div>

              <ul className="grid sm:grid-cols-3 gap-2 text-xs">
                <li className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                  <FileCheck2 className="h-4 w-4 text-primary" /> Pièce d'identité
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                  <ScanFace className="h-4 w-4 text-primary" /> Selfie liveness
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Validation auto.
                </li>
              </ul>

              {currentStep && isPending && (
                <p className="text-xs text-muted-foreground italic">
                  Étape en cours : <span className="font-medium text-foreground">{currentStep}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleVerify}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Initialisation…
                    </>
                  ) : isPending ? (
                    'Reprendre la vérification'
                  ) : (
                    label
                  )}
                </Button>
                {verificationUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(verificationUrl, '_blank', 'noopener')}
                  >
                    <ExternalLink className="h-4 w-4" /> Ouvrir dans un onglet
                  </Button>
                )}
              </div>

              {status === 'declined' && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Votre vérification a été refusée. Veuillez réessayer avec un document valide ou
                    contacter le support.
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {isApproved && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-lg border border-sonam-green/40 bg-sonam-green/10 p-3 text-sm text-sonam-green-dark"
            >
              <ShieldCheck className="h-5 w-5 text-sonam-green" />
              <span className="font-medium">
                Identité vérifiée avec succès. Vous pouvez continuer votre adhésion.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DiditVerification;
