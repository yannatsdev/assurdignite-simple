import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2, AlertCircle, ExternalLink, ScanFace, FileCheck2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type KycStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'declined';

interface DiditVerificationProps {
  vendorDataSuffix?: string; // e.g. 'conjoint'
  label?: string;
  onApproved?: () => void;
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

  // Load initial status (only for principal)
  useEffect(() => {
    if (!user || vendorDataSuffix) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .maybeSingle();
      if (!cancelled && data?.kyc_status) {
        setStatus(data.kyc_status as KycStatus);
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
          const next = (payload.new as any)?.kyc_status as KycStatus | undefined;
          if (next) {
            setStatus(next);
            if (next === 'approved') {
              onApproved?.();
              toast({ title: 'Identité vérifiée ✓', description: 'Votre KYC a été validé.' });
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
          if (mapped === 'approved') onApproved?.();
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
