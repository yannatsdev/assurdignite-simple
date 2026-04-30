import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Banknote, Check, Loader2, Smartphone, Sparkles, Fingerprint, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PremiumCard } from '@/components/ui/premium-card';
import { SectionHeader } from '@/components/ui/section-header';
import { OperatorPicker, OPERATORS, Operator } from '@/components/payment/OperatorPicker';
import { OtpVerification } from '@/components/payment/OtpVerification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';
import { toast as sonnerToast } from 'sonner';
import { verifyBiometricForUser, getBiometricSupport } from '@/lib/webauthn';

type Step = 'operator' | 'phone' | 'otp' | 'biometric' | 'success';

export default function PaiementCheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resume');

  const [step, setStep] = useState<Step>('operator');
  const [operator, setOperator] = useState<Operator | null>(null);
  const [phone, setPhone] = useState('');
  const [contract, setContract] = useState<any>(null);
  const [bioStatus, setBioStatus] = useState<'supported' | 'maybe' | 'unsupported' | 'unknown'>('unknown');
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioRunning, setBioRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      setContract(contractId ? (data?.find((c: any) => c.id === contractId) || data?.[0]) : (data?.[0] || null));

      if (resumeId) {
        const { data: p } = await supabase.from('paiements').select('*').eq('id', resumeId).maybeSingle();
        if (p) {
          const op = OPERATORS.find(o => o.id === p.methode);
          if (op) { setOperator(op); setStep('phone'); }
        }
      }
    };
    load();
    getBiometricSupport().then(setBioStatus);
  }, [user, contractId, resumeId]);

  const amount = contract?.prime_annuelle || 0;
  const reference = useMemo(() => `AD-${(user?.id || '').slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, [user?.id]);

  const finalize = async () => {
    if (!user) return;
    setSubmitting(true);

    let paiementId = resumeId;
    if (paiementId) {
      await supabase.from('paiements').update({
        status: 'paid',
        methode: operator?.id,
        biometric_confirmed_at: new Date().toISOString(),
      }).eq('id', paiementId);
    } else {
      const { data, error } = await supabase.from('paiements').insert({
        user_id: user.id,
        contract_id: contract?.id || null,
        montant: amount,
        methode: operator!.id,
        status: 'paid',
        reference,
        biometric_confirmed_at: new Date().toISOString(),
      }).select().single();
      if (error) { setSubmitting(false); sonnerToast.error('Erreur', { description: error.message }); return; }
      paiementId = data?.id;
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Paiement validé ✓',
      message: `${formatCFA(amount)} via ${operator?.name}. Votre contrat est actif.`,
      type: 'success',
      link: '/client/paiements',
      contract_id: contract?.id || null,
    });

    setSubmitting(false);
    setStep('success');
  };

  const runBiometric = async () => {
    if (!user) return;
    setBioRunning(true); setBioError(null);
    const res = await verifyBiometricForUser(user.id, user.email);
    setBioRunning(false);
    if (res.ok) {
      finalize();
    } else if (res.code === 'UNSUPPORTED') {
      setBioStatus('unsupported');
      setBioError(null);
    } else if (res.code === 'CANCELLED') {
      setBioError('Confirmation annulée. Réessayez ou continuez sans biométrie.');
    } else {
      setBioError(res.error || 'Erreur de confirmation biométrique');
    }
  };

  if (!user) return null;
  if (!contract) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-muted-foreground">Aucun contrat actif. Souscrivez d'abord pour effectuer un paiement.</p>
        <Button asChild><Link to="/client/souscrire">Souscrire maintenant</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/client/paiements" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Retour aux paiements
      </Link>

      <SectionHeader
        title="Paiement de la prime"
        subtitle="Mode test — Aucun débit réel ne sera effectué."
        icon={<Banknote className="w-6 h-6" />}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span><b>Simulation :</b> les paiements sont simulés à des fins de tests. Aucune transaction réelle n'est exécutée.</span>
      </div>

      <PremiumCard variant="gradient" className="text-center py-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Montant à régler</p>
        <p className="text-4xl font-bold font-display text-primary mt-1">{formatCFA(amount)}</p>
        <p className="text-xs text-muted-foreground mt-1">Contrat {contract.police_number || contract.id.slice(0, 8)}</p>
      </PremiumCard>

      {/* Stepper indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {(['operator', 'phone', 'otp', 'biometric', 'success'] as Step[]).map((s, i) => {
          const order = ['operator','phone','otp','biometric','success'];
          const active = order.indexOf(step) >= i;
          return <div key={s} className={`h-1.5 rounded-full transition-all ${active ? 'bg-primary w-8' : 'bg-muted w-4'}`} />;
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <PremiumCard variant="solid">
            {step === 'operator' && (
              <div className="space-y-4">
                <p className="font-semibold font-display">Choisissez votre opérateur Mobile Money</p>
                <OperatorPicker value={operator?.id} onChange={setOperator} />
                <Button className="w-full gap-2" disabled={!operator} onClick={() => setStep('phone')}>
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 'phone' && operator && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={operator.logo} alt={operator.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold">{operator.name}</p>
                    <p className="text-xs text-muted-foreground">Saisissez votre numéro</p>
                  </div>
                </div>
                <div>
                  <Label>Numéro de téléphone</Label>
                  <div className="flex gap-2 mt-1">
                    <span className="flex items-center px-3 rounded-md border bg-muted text-sm font-medium">+225</span>
                    <Input
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="07 XX XX XX XX"
                      inputMode="numeric"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Numéro à 10 chiffres</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('operator')} className="flex-1">Retour</Button>
                  <Button onClick={() => setStep('otp')} disabled={phone.length !== 10} className="flex-1 gap-2">
                    Envoyer le code <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'otp' && operator && (
              <OtpVerification
                phone={`+225 ${phone}`}
                operatorName={operator.name}
                onVerified={() => setStep('biometric')}
                onBack={() => setStep('phone')}
              />
            )}

            {step === 'biometric' && (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-lg">Confirmation biométrique</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Validez votre paiement avec votre empreinte ou Face ID — chaque paiement est lié à votre identité.
                  </p>
                </div>

                {bioStatus === 'unsupported' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800">Biométrie non disponible sur cet appareil</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Votre navigateur ou appareil ne supporte pas la confirmation biométrique. Vous pouvez passer cette étape.
                        </p>
                      </div>
                    </div>
                    <Button onClick={finalize} disabled={submitting} className="w-full gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      Passer à l'étape suivante
                    </Button>
                  </div>
                ) : (
                  <>
                    {bioError && <p className="text-xs text-red-600">{bioError}</p>}
                    <Button onClick={runBiometric} disabled={bioRunning || submitting} className="w-full gap-2">
                      {bioRunning || submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                      Confirmer avec biométrie
                    </Button>
                    <button
                      type="button"
                      onClick={() => setBioStatus('unsupported')}
                      className="text-xs text-muted-foreground hover:text-primary underline"
                    >
                      Mon appareil ne supporte pas la biométrie
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4 py-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
                </motion.div>
                <div>
                  <p className="font-display font-bold text-2xl text-emerald-700">Paiement validé</p>
                  <p className="text-sm text-muted-foreground mt-1">{formatCFA(amount)} via {operator?.name}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-2">{reference}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => navigate('/client')}>Tableau de bord</Button>
                  <Button onClick={() => navigate('/client/paiements')}>Voir mes paiements</Button>
                </div>
              </div>
            )}
          </PremiumCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
