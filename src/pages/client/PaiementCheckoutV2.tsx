import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Fingerprint, ShieldAlert, X, CreditCard, Building2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OPERATORS, Operator } from '@/components/payment/OperatorPicker';
import { OtpVerification } from '@/components/payment/OtpVerification';
import { SimulationBadge } from '@/components/payment/SimulationBadge';
import { FamilyBanner } from '@/components/marketing/FamilyBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';
import { toast as sonnerToast } from 'sonner';
import { verifyBiometricForUser, getBiometricSupport } from '@/lib/webauthn';
import { cn } from '@/lib/utils';

type Step = 'form' | 'otp' | 'biometric' | 'success';

export default function PaiementCheckoutV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resume');

  const [step, setStep] = useState<Step>('form');
  const [operator, setOperator] = useState<Operator | null>(OPERATORS[0]);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contract, setContract] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bioStatus, setBioStatus] = useState<'supported' | 'maybe' | 'unsupported' | 'unknown'>('unknown');
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioRunning, setBioRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: contracts }, { data: prof }] = await Promise.all([
        supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name,email,phone').eq('id', user.id).maybeSingle(),
      ]);
      const c = contractId ? (contracts?.find((x: any) => x.id === contractId) || contracts?.[0]) : contracts?.[0];
      setContract(c || null);
      setProfile(prof);
      if (prof?.full_name) {
        const parts = prof.full_name.split(' ');
        setPrenom(parts[0] || ''); setNom(parts.slice(1).join(' ') || '');
      }
      if (prof?.email) setEmail(prof.email);
      if (prof?.phone) setPhone(prof.phone.replace(/\D/g, '').slice(-10));
      if (resumeId) {
        const { data: p } = await supabase.from('paiements').select('*').eq('id', resumeId).maybeSingle();
        if (p) {
          const op = OPERATORS.find(o => o.id === p.methode);
          if (op) setOperator(op);
        }
      }
    };
    load();
    getBiometricSupport().then(setBioStatus);
  }, [user, contractId, resumeId]);

  const baseAmount = contract?.prime_annuelle || 0;
  const fees = Math.round(baseAmount * 0.015);
  const totalAmount = baseAmount + fees;
  const reference = useMemo(() => `AD-${(user?.id || '').slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, [user?.id]);

  const formValid = !!operator && nom.trim() && prenom.trim() && /\S+@\S+\.\S+/.test(email) && phone.length === 10;

  const initiatePayment = async () => {
    if (!user || !contract) return;
    if (!resumeId) {
      // Create pending paiement record
      await supabase.from('paiements').insert({
        user_id: user.id,
        contract_id: contract.id,
        montant: totalAmount,
        methode: operator!.id,
        status: 'pending',
        reference,
      });
    }
    setStep('otp');
  };

  const finalize = async () => {
    if (!user) return;
    setSubmitting(true);
    let paiementId = resumeId;
    if (paiementId) {
      await supabase.from('paiements').update({
        status: 'paid', methode: operator?.id,
        biometric_confirmed_at: new Date().toISOString(),
      }).eq('id', paiementId);
    } else {
      // Update the pending one we just created (latest by reference)
      const { data: existing } = await supabase.from('paiements')
        .select('id').eq('user_id', user.id).eq('reference', reference).maybeSingle();
      if (existing?.id) {
        await supabase.from('paiements').update({
          status: 'paid', biometric_confirmed_at: new Date().toISOString(),
        }).eq('id', existing.id);
        paiementId = existing.id;
      } else {
        const { data } = await supabase.from('paiements').insert({
          user_id: user.id, contract_id: contract?.id || null,
          montant: totalAmount, methode: operator!.id, status: 'paid', reference,
          biometric_confirmed_at: new Date().toISOString(),
        }).select().single();
        paiementId = data?.id;
      }
    }
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Paiement validé ✓',
      message: `${formatCFA(totalAmount)} via ${operator?.name}. Votre contrat est actif.`,
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
    if (res.ok) finalize();
    else if (res.code === 'UNSUPPORTED') { setBioStatus('unsupported'); setBioError(null); }
    else if (res.code === 'CANCELLED') setBioError('Annulé. Réessayez ou continuez sans biométrie.');
    else setBioError(res.error || 'Erreur biométrique.');
  };

  if (!user) return null;
  if (!contract) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4 px-4">
        <p className="text-muted-foreground">Aucun contrat actif. Souscrivez d'abord pour effectuer un paiement.</p>
        <Button asChild><Link to="/client/souscrire">Souscrire maintenant</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 pb-24 sm:pb-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link to="/client/paiements" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <SimulationBadge />
      </div>

      <FamilyBanner
        rotate
        size="compact"
        badge="AssurDignité"
        title="La sérénité pour ceux que vous aimez"
        subtitle="Réglez votre prime annuelle en toute simplicité — Mobile Money sécurisé."
      />

      {/* Amount header — Wave/CinetPay-style */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--sonam-violet))] via-primary to-[hsl(var(--sonam-violet))] text-white p-5 sm:p-6 shadow-xl"
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-sonam-green/30 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/70">Montant à payer</p>
            <p className="font-display font-bold text-3xl sm:text-4xl mt-1">
              {formatCFA(totalAmount)} <span className="text-base font-normal text-white/70">*</span>
            </p>
            <p className="text-[11px] sm:text-xs text-white/70 mt-1">
              (*) 1,5% de frais simulés ajoutés ({formatCFA(fees)}). <button className="underline hover:text-white">En savoir plus</button>
            </p>
          </div>
          <button onClick={() => navigate('/client/paiements')} className="rounded-full bg-white/15 hover:bg-white/25 p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-mono">
          <Lock className="h-3 w-3" /> Contrat {contract.police_number || contract.id.slice(0, 8)}
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {(['form', 'otp', 'biometric', 'success'] as Step[]).map((s, i) => {
          const order: Step[] = ['form', 'otp', 'biometric', 'success'];
          const active = order.indexOf(step) >= i;
          return <div key={s} className={`h-1.5 rounded-full transition-all ${active ? 'bg-primary w-10' : 'bg-muted w-5'}`} />;
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          {step === 'form' && (
            <div className="rounded-2xl bg-card border shadow-sm overflow-hidden">
              <Tabs defaultValue="momo" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                  <TabsTrigger value="momo" className="data-[state=active]:border-b-2 data-[state=active]:border-sonam-green data-[state=active]:text-sonam-green data-[state=active]:bg-transparent rounded-none px-4 py-3 font-semibold text-sm">
                    Mobile Money
                  </TabsTrigger>
                  <TabsTrigger value="card" disabled className="opacity-50 rounded-none px-4 py-3 text-sm">
                    <CreditCard className="h-3.5 w-3.5 mr-1" /> Carte <span className="ml-1 text-[9px] bg-muted px-1 rounded">Bientôt</span>
                  </TabsTrigger>
                  <TabsTrigger value="dd" disabled className="opacity-50 rounded-none px-4 py-3 text-sm">
                    <Building2 className="h-3.5 w-3.5 mr-1" /> Débit <span className="ml-1 text-[9px] bg-muted px-1 rounded">Bientôt</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="momo" className="p-4 sm:p-5 space-y-5 m-0">
                  {/* Operator selection */}
                  <div>
                    <p className="text-center font-display font-bold text-sm sm:text-base">
                      {operator?.name?.toUpperCase() || 'CHOISIR UN OPÉRATEUR'}
                      {operator && <span className="text-muted-foreground font-normal text-xs sm:text-sm"> (Frais : {formatCFA(fees)})</span>}
                    </p>
                    <div className="mt-3 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-hide">
                      <div className="flex sm:grid sm:grid-cols-4 gap-3 min-w-max sm:min-w-0">
                        {OPERATORS.map(op => {
                          const sel = op.id === operator?.id;
                          return (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => setOperator(op)}
                              className={cn(
                                'group flex flex-col items-center gap-1.5 transition-all',
                                'min-w-[72px]'
                              )}
                            >
                              <div className={cn(
                                'relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-white border-2 transition-all',
                                sel ? `border-sonam-green ring-4 ring-sonam-green/20 scale-105` : 'border-transparent hover:border-muted'
                              )}>
                                <img src={op.logo} alt={op.name} className="w-full h-full object-cover" />
                                {sel && (
                                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-sonam-green text-white rounded-full flex items-center justify-center shadow">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <span className={cn('text-[10px] sm:text-xs text-center max-w-[80px] truncate', sel ? 'font-semibold text-sonam-green' : 'text-muted-foreground')}>
                                {op.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs uppercase font-semibold tracking-wider">Nom</Label>
                      <Input value={nom} onChange={e => setNom(e.target.value)} placeholder="NOM" className="mt-1 border-2 focus-visible:border-sonam-green" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-semibold tracking-wider">Prénoms</Label>
                      <Input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="PRÉNOM" className="mt-1 border-2 focus-visible:border-sonam-green" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase font-semibold tracking-wider">Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="exemple@gmail.com" className="mt-1 border-2 focus-visible:border-sonam-green" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase font-semibold tracking-wider">Compte Mobile Money</Label>
                    <div className="mt-1 flex">
                      <span className="inline-flex items-center gap-1.5 px-3 rounded-l-md border-2 border-r-0 bg-muted text-sm font-medium">
                        <span className="text-base">🇨🇮</span> +225
                      </span>
                      <Input
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        inputMode="numeric"
                        placeholder="07 XX XX XX XX"
                        className="rounded-l-none border-2 focus-visible:border-sonam-green flex-1"
                      />
                      {operator && (
                        <img src={operator.logo} alt="" className="ml-2 h-10 w-10 rounded-full self-center hidden sm:block" />
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === 'otp' && operator && (
            <div className="rounded-2xl bg-card border shadow-sm p-4 sm:p-6">
              <OtpVerification
                phone={`+225 ${phone}`}
                operatorName={operator.name}
                onVerified={() => setStep('biometric')}
                onBack={() => setStep('form')}
              />
            </div>
          )}

          {step === 'biometric' && (
            <div className="rounded-2xl bg-card border shadow-sm p-4 sm:p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-lg">Confirmation biométrique</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Validez votre paiement avec votre empreinte ou Face ID.
                </p>
              </div>
              {bioStatus === 'unsupported' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Biométrie non disponible</p>
                      <p className="text-xs text-amber-700 mt-1">Vous pouvez passer cette étape pour valider votre paiement.</p>
                    </div>
                  </div>
                  <Button onClick={finalize} disabled={submitting} className="w-full gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Valider sans biométrie
                  </Button>
                </div>
              ) : (
                <>
                  {bioError && <p className="text-xs text-red-600">{bioError}</p>}
                  <Button onClick={runBiometric} disabled={bioRunning || submitting} className="w-full gap-2">
                    {bioRunning || submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                    Confirmer avec biométrie
                  </Button>
                  <button type="button" onClick={() => setBioStatus('unsupported')} className="text-xs text-muted-foreground hover:text-primary underline">
                    Mon appareil ne supporte pas la biométrie
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="rounded-2xl bg-card border shadow-sm p-6 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
              </motion.div>
              <div>
                <p className="font-display font-bold text-2xl text-emerald-700">Paiement validé</p>
                <p className="text-sm text-muted-foreground mt-1">{formatCFA(totalAmount)} via {operator?.name}</p>
                <p className="font-mono text-xs text-muted-foreground mt-2">{reference}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => navigate('/client')}>Tableau de bord</Button>
                <Button onClick={() => navigate('/client/paiements')}>Voir mes paiements</Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky pay button on form step (mobile-first) */}
      {step === 'form' && (
        <div className="fixed bottom-0 left-0 right-0 sm:static z-40 bg-background/95 backdrop-blur sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0 p-3 sm:p-0 sm:mt-2">
          <Button
            onClick={initiatePayment}
            disabled={!formValid}
            className="w-full h-12 sm:h-14 text-base font-semibold gap-2 bg-gradient-to-r from-[hsl(var(--sonam-violet))] to-primary hover:opacity-95 text-white shadow-lg"
          >
            Payer {formatCFA(totalAmount)} F CFA
          </Button>
        </div>
      )}
    </div>
  );
}
