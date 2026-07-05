import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Users, FileText, Shield, PenTool, Download, Plus, Minus, AlertCircle, Sparkles, Calculator, CreditCard } from 'lucide-react';
import { simulatePrime, formatCFA, OPTIONS_CAPITALS, type OptionKey, type SimulationResult } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BasicKyc } from '@/components/kyc/BasicKyc';
import { useLocation } from 'react-router-dom';
import { IdCardScanner } from '@/components/kyc/IdCardScanner';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { MarketingCarousel } from '@/components/client/MarketingCarousel';
import { UnifiedProgressBar } from '@/components/adhesion/UnifiedProgressBar';
import { adhesionProgress } from '@/stores/adhesion-progress';

const STEPS = ['Simulation', 'Informations & bénéficiaires', 'Signature & paiement'];
const STEP_ICONS = [Calculator, FileText, CreditCard];

const CG_TEXT = `SONAM VIE – CONDITIONS GÉNÉRALES ASSURDIGNITÉ

Article 1 – Objet : Le présent contrat a pour objet la garantie par SONAM VIE du versement d'un capital décès en cas de décès de l'assuré principal ou de l'un des assurés complémentaires. La garantie se décompose en 70% de prestations en nature et 30% en capital espèces.

Article 2 – Conditions d'adhésion : Assuré principal et conjoint 18-64 ans ; enfants 0-21 ans ; ascendants 0-89 ans. Âge + durée du contrat ≤ 65 ans (principal/conjoint) ou ≤ 90 ans (ascendants).

Article 3 – Prestations : En cas de décès, SONAM VIE fournit cercueil, conservation, transport, cérémonie (70%) et verse 30% en espèces au(x) bénéficiaire(s), sous 12h après dépôt des pièces.

Article 4 – Exclusions : Suicide dans les 2 premières années, faits de guerre, actes terroristes, participation volontaire à des actes criminels, fausses déclarations.

Article 5 – Obligations : Payer la prime annuelle, déclarer tout changement familial, fournir des informations exactes.

Article 6 – Ristourne : 30% de la prime de l'assuré principal restituée si aucun sinistre n'est survenu sur les 3 premières années de souscription.

Article 7 – Résiliation : Possible à tout moment par lettre. Non-paiement : suspension après 30 jours, résiliation après 90 jours.

Article 8 – Juridiction : Tribunaux d'Abidjan, Côte d'Ivoire. Code des Assurances CIMA.`;

const CP_TEXT = `SONAM VIE – CONDITIONS PARTICULIÈRES ASSURDIGNITÉ

1. Souscripteur & assurés : le contrat est établi au nom de l'assuré principal désigné lors de l'adhésion. Les co-assurés (conjoint, enfants, ascendants) sont ceux déclarés dans la simulation et confirmés au KYC.

2. Formule choisie : la formule (A/B/C/D) sélectionnée détermine les capitaux garantis pour chaque catégorie d'assuré (voir tableau du récapitulatif). Toute modification nécessite un avenant.

3. Prime & périodicité : la prime annuelle affichée est calculée sur la table CIMA H (Note Technique 26/05/2026), taux technique 3,5%. Périodicités disponibles : annuelle (défaut), semestrielle, trimestrielle, mensuelle — avec accessoires selon la note technique.

4. Prise d'effet : la couverture prend effet le jour du paiement effectif de la première prime, sous réserve d'acceptation du dossier par SONAM VIE.

5. Délai de carence : aucun délai de carence pour décès accidentel. Décès par maladie : carence de 30 jours après la date d'effet.

6. Bénéficiaires : le capital 30% espèces est versé aux bénéficiaires désignés dans le présent contrat. À défaut de désignation valide, il est versé aux héritiers légaux selon l'ordre successoral ivoirien.

7. Prestations en nature (70%) : fournies par le réseau de partenaires SONAM VIE dans un rayon de 200 km du lieu de décès (métropolitain) ou selon les conditions de rapatriement pour la formule D.

8. Modifications & renouvellement : le contrat se renouvelle tacitement à chaque échéance annuelle sauf résiliation adressée 30 jours avant terme.

9. Ristourne : versée sur le compte Mobile Money du souscripteur au terme des 3 ans si aucun sinistre n'a été déclaré et si toutes les primes ont été régulièrement payées.

10. Réclamations : servicecommercialsonamvie@sonam.ci — 27 20 31 71 82 / 05 95 45 21 65.`;

const FORMULE_DETAILS: Record<string, { name: string; desc: string; nature: string[] }> = {
  A: { name: 'Dignité Simple', desc: 'Couverture essentielle pour protéger votre famille.', nature: ['Cercueil standard', 'Conservation', 'Transport local', 'Inhumation simple'] },
  B: { name: 'Serein', desc: 'Protection élargie et capital confortable.', nature: ['Cercueil semi-luxe', 'Embaumement', 'Transport interurbain', 'Cérémonie'] },
  C: { name: 'Prestige', desc: 'Couverture premium complète.', nature: ['Cercueil luxe', 'Embaumement complet', 'Transport national', 'Cérémonie + veillée'] },
  D: { name: 'Excellence', desc: 'Formule complète. Rapatriement inclus (diaspora).', nature: ['Cercueil haut de gamme', 'Soins de présentation', 'Rapatriement international', 'Cérémonie d\'exception'] },
};

export default function AdhesionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const incomingSim = (location.state as { simResult?: SimulationResult } | null)?.simResult ?? null;

  const [step, setStep] = useState(incomingSim ? 1 : 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepTopRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Simulation
  const [formule, setFormule] = useState<OptionKey>('D');
  const [simPrincipalDob, setSimPrincipalDob] = useState('');
  const [hasConjoint, setHasConjoint] = useState(false);
  const [enfants, setEnfants] = useState<{ nom: string; dob: string }[]>([]);
  const [ascendants, setAscendants] = useState<{ nom: string; dob: string; lien: string }[]>([]);
  const [simResult, setSimResult] = useState<SimulationResult | null>(incomingSim);

  // KYC & famille
  const [kyc, setKyc] = useState({ nom: '', prenom: '', dob: '', email: '', phone: '', adresse: '', cni: '' });
  const [kycAutoFilled, setKycAutoFilled] = useState(false);
  const [kycFiles, setKycFiles] = useState<{ cni?: string; photo?: string; domicile?: string; cniConjoint?: string; photoConjoint?: string }>({});
  const [conjoint, setConjoint] = useState({ nom: '', prenom: '', dob: '' });
  const [beneficiaires, setBeneficiaires] = useState([{ nom: '', lien: '', telephone: '' }]);
  const [medicalHealthy, setMedicalHealthy] = useState(true);
  const [medicalDetails, setMedicalDetails] = useState('');

  // Signature & paiement
  const [cgAccepted, setCgAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);
  const [signed, setSigned] = useState(false);
  const [contractId, setContractId] = useState('');
  const [policeNumber, setPoliceNumber] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const quoteDate = new Date().toISOString().slice(0, 10);

  // === Live simulation — always up-to-date, never "figée" ===
  useEffect(() => {
    if (!simPrincipalDob) { setSimResult(null); return; }
    const t = setTimeout(() => {
      const res = simulatePrime({
        quoteDate, option: formule, principal: { dob: simPrincipalDob },
        conjoint: hasConjoint && conjoint.dob ? { dob: conjoint.dob, included: true } : undefined,
        enfants: enfants.filter(e => e.dob).map(e => ({ dob: e.dob, included: true })),
        ascendants: ascendants.filter(a => a.dob).map(a => ({ dob: a.dob, included: true, label: a.lien })),
      });
      setSimResult(res);
    }, 200);
    return () => clearTimeout(t);
  }, [formule, simPrincipalDob, hasConjoint, conjoint.dob, enfants, ascendants, quoteDate]);

  // Track macro step for the global bar
  useEffect(() => { adhesionProgress.setMacroStep(step); }, [step]);

  // Persist step
  useEffect(() => { try { sessionStorage.setItem('adhesion.step', String(step)); } catch {} }, [step]);
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('adhesion.step');
      if (s && !incomingSim) setStep(Math.min(parseInt(s, 10) || 0, STEPS.length - 1));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signature canvas
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  };
  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { x, y } = getCanvasCoords(e); ctx.beginPath(); ctx.moveTo(x, y);
  }, []);
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.strokeStyle = '#4A0E78'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.lineTo(x, y); ctx.stroke(); setHasSignature(true);
  }, [isDrawing]);
  const stopDraw = useCallback(() => setIsDrawing(false), []);
  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height); setHasSignature(false);
  };

  const scrollTop = () => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  const next = () => { setStep(s => Math.min(s + 1, STEPS.length - 1)); scrollTop(); };
  const prev = () => { setStep(s => Math.max(s - 1, 0)); scrollTop(); };

  const finalize = async () => {
    // Default beneficiary if missing
    let effBenefs = beneficiaires.filter(b => b.nom.trim());
    if (!effBenefs.length) {
      effBenefs = [{ nom: hasConjoint && conjoint.nom ? `${conjoint.prenom} ${conjoint.nom}`.trim() : 'Héritiers légaux', lien: hasConjoint ? 'Conjoint' : 'Héritiers', telephone: kyc.phone || '' }];
      setBeneficiaires(effBenefs);
    }

    const { validateBeforeFinalize } = await import('@/lib/adhesion-validation');
    const check = validateBeforeFinalize({
      kyc, beneficiaires: effBenefs, kycFiles, paymentDone, cgAccepted, cpAccepted: true,
      hasSignature, simResult,
    });
    if (!check.ok) {
      adhesionProgress.setMissing(check.missing.map(m => m.label));
      toast({ title: 'Souscription incomplète', description: check.missing.map(m => `• ${m.label}`).join('\n'), variant: 'destructive' });
      if (check.firstStep !== null) setStep(check.firstStep);
      return;
    }
    adhesionProgress.setMissing([]);

    if (!user || !simResult) return;

    let signatureDataUrl: string | null = null;
    if (canvasRef.current && hasSignature) {
      try { signatureDataUrl = canvasRef.current.toDataURL('image/png'); } catch {}
    }

    const newPolice = `POL-AD-${Date.now().toString(36).toUpperCase()}`;
    setPoliceNumber(newPolice);
    const { data, error } = await supabase.from('contracts').insert({
      user_id: user.id, police_number: newPolice, formule,
      date_effet: quoteDate,
      date_expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      prime_annuelle: simResult.primeAnnuelle,
      principal_name: `${kyc.prenom} ${kyc.nom}`,
      principal_dob: kyc.dob || simPrincipalDob,
      conjoint_name: hasConjoint ? `${conjoint.prenom} ${conjoint.nom}` : null,
      conjoint_dob: hasConjoint ? conjoint.dob : null,
      nb_enfants: enfants.length, nb_ascendants: ascendants.length,
      capital_total: simResult.capitaux.principal,
      kyc_documents: kycFiles,
      signature_data_url: signatureDataUrl,
      status: paymentDone ? 'active' : 'pending_payment',
    } as any).select('id').single();

    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setContractId(data.id);

    for (const b of effBenefs) {
      await supabase.from('beneficiaires').insert({ user_id: user.id, contract_id: data.id, nom: b.nom, lien_parente: b.lien, telephone: b.telephone });
    }
    for (const e of enfants.filter(e => e.nom || e.dob)) {
      await supabase.from('assures_complementaires').insert({ contract_id: data.id, nom: e.nom, dob: e.dob || null, lien_parente: 'enfant', type_assure: 'enfant' });
    }
    for (const a of ascendants.filter(a => a.nom || a.dob)) {
      await supabase.from('assures_complementaires').insert({ contract_id: data.id, nom: a.nom, dob: a.dob || null, lien_parente: a.lien, type_assure: 'ascendant' });
    }

    if (paymentNumber) {
      setPaymentRef(paymentNumber);
      await supabase.from('paiements').update({ contract_id: data.id }).eq('user_id', user.id).eq('reference', paymentNumber);
    }

    setSigned(true);
    toast({ title: 'Contrat signé !', description: `Votre contrat ${newPolice} a été créé avec succès.` });
  };

  const generatePDF = async (kind: 'police' | 'attestation' | 'recu') => {
    if (!simResult) return;
    const { newPdf, pdfHeader, pdfTitle, pdfSection, pdfKeyValueGrid, pdfTable, pdfFooter, pdfSonamStamp, pdfSignatureBlock, formatDateFR: fmt, FORMULE_NAMES } = await import('@/lib/pdf-shared');
    const doc = newPdf();
    const label = kind === 'police' ? "Police d'assurance obsèques" : kind === 'attestation' ? "Attestation d'assurance" : 'Reçu de souscription';
    pdfHeader(doc, label);
    let y = 52;
    y = pdfTitle(doc, label.toUpperCase(), y, `N° ${policeNumber}`);
    y = pdfSection(doc, 'Souscripteur', y);
    y = pdfKeyValueGrid(doc, [
      ['Nom & prénom', `${kyc.prenom} ${kyc.nom}`.trim() || '—'],
      ['Date de naissance', fmt(kyc.dob || simPrincipalDob)],
      ['Téléphone', kyc.phone || '—'],
      ['CNI', kyc.cni || '—'],
    ], y);
    y = pdfSection(doc, 'Formule & garanties', y);
    y = pdfKeyValueGrid(doc, [
      ['Formule', `${formule} — ${FORMULE_NAMES[formule] || FORMULE_DETAILS[formule].name}`],
      ['Capital garanti', formatCFA(simResult.capitaux.principal)],
      ['Prime annuelle', formatCFA(simResult.primeAnnuelle)],
      ['Date d\u2019effet', fmt(quoteDate)],
      ['Couverture', '70% nature + 30% espèces'],
    ], y);
    if (beneficiaires.filter(b => b.nom).length) {
      y = pdfSection(doc, 'Bénéficiaires', y);
      y = pdfTable(doc, ['Nom', 'Lien', 'Téléphone'], beneficiaires.filter(b => b.nom).map(b => [b.nom, b.lien || '—', b.telephone || '—']), y, [80, 60, 40]);
    }
    if (y > 215) { doc.addPage(); pdfHeader(doc); y = 52; }
    y = pdfSection(doc, 'Signature & cachet', y);
    const sigData = (canvasRef.current && hasSignature) ? canvasRef.current.toDataURL('image/png') : null;
    pdfSignatureBlock(doc, 20, y + 4, sigData, `${kyc.prenom} ${kyc.nom}`.trim() || '—', 60, 22);
    pdfSonamStamp(doc, 160, y + 16, 18, kind === 'recu' ? 'PAYÉ' : 'CERTIFIÉ', new Date().toLocaleDateString('fr-FR'));
    pdfFooter(doc);
    const fname = kind === 'police' ? `Police_AssurDignite_${policeNumber}.pdf` : kind === 'attestation' ? `Attestation_AssurDignite_${policeNumber}.pdf` : `Recu_AssurDignite_${policeNumber}.pdf`;
    doc.save(fname);
  };

  const StepIcon = STEP_ICONS[step];

  return (
    <div ref={stepTopRef} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Souscrivez en 3 étapes</h1>
        <p className="text-muted-foreground">AssurDignité — protégez vos proches en moins de 3 minutes.</p>
      </div>

      <MarketingCarousel />
      <UnifiedProgressBar />

      {/* Compact step indicator */}
      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[i];
          const active = i === step;
          const done = i < step;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-2 transition ${
                active ? 'bg-primary text-primary-foreground border-primary' : done ? 'bg-sonam-green text-white border-sonam-green' : 'bg-background text-muted-foreground border-border'
              }`}>{done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}</div>
              <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${active ? 'text-primary' : done ? 'text-sonam-green' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${done ? 'bg-sonam-green' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card className="border-2">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                <StepIcon className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-lg">{STEPS[step]}</h2>
              </div>

              {/* ================= STEP 0 — SIMULATION ================= */}
              {step === 0 && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">Choisissez votre formule et renseignez votre famille. La prime se calcule en temps réel.</p>

                  {/* Formule cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {(['A','B','C','D'] as OptionKey[]).map(k => {
                      const cap = OPTIONS_CAPITALS[k];
                      const d = FORMULE_DETAILS[k];
                      const active = formule === k;
                      return (
                        <button key={k} type="button" onClick={() => setFormule(k)}
                          className={`text-left p-3 rounded-xl border-2 transition-all relative ${active ? 'border-primary bg-primary/10 shadow' : 'border-border/60 hover:border-primary/40 bg-background'}`}>
                          {k === 'D' && <Badge className="absolute -top-2 right-2 bg-secondary text-[10px]">⭐</Badge>}
                          <p className="text-[11px] font-bold text-primary">Formule {k}</p>
                          <p className="text-sm font-bold font-display leading-tight">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Capital</p>
                          <p className="text-sm font-semibold text-primary">{formatCFA(cap.principal)}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-xl bg-accent/40 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Assuré principal — Date de naissance *</Label>
                      <DateInput value={simPrincipalDob} onChange={setSimPrincipalDob} />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <Label className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Conjoint(e)</Label>
                      <Switch checked={hasConjoint} onCheckedChange={setHasConjoint} />
                    </div>
                    {hasConjoint && <DateInput value={conjoint.dob} onChange={v => setConjoint({ ...conjoint, dob: v })} />}

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <Label className="text-sm">Enfants ({enfants.length}/4)</Label>
                      <Button size="sm" variant="outline" onClick={() => enfants.length < 4 && setEnfants([...enfants, { nom: '', dob: '' }])}><Plus className="w-3 h-3 mr-1" />Ajouter</Button>
                    </div>
                    {enfants.map((e, i) => (
                      <div key={i} className="flex gap-2 items-center pl-2">
                        <DateInput value={e.dob} onChange={v => { const n = [...enfants]; n[i].dob = v; setEnfants(n); }} className="flex-1" />
                        <Button size="icon" variant="ghost" onClick={() => setEnfants(enfants.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <Label className="text-sm">Ascendants ({ascendants.length}/2)</Label>
                      <Button size="sm" variant="outline" onClick={() => ascendants.length < 2 && setAscendants([...ascendants, { nom: '', dob: '', lien: 'Père/Mère' }])}><Plus className="w-3 h-3 mr-1" />Ajouter</Button>
                    </div>
                    {ascendants.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center pl-2">
                        <DateInput value={a.dob} onChange={v => { const n = [...ascendants]; n[i].dob = v; setAscendants(n); }} className="flex-1" />
                        <Button size="icon" variant="ghost" onClick={() => setAscendants(ascendants.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>

                  {/* Live prime display */}
                  {simResult ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 text-center">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Prime annuelle</p>
                      <p className="text-4xl font-bold text-primary font-display mt-1">{formatCFA(simResult.primeAnnuelle)}</p>
                      <div className="flex justify-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">Formule {formule} – {FORMULE_DETAILS[formule].name}</Badge>
                        <Badge variant="outline" className="bg-secondary/10">{simResult.persons.filter(p => p.eligible).length} assuré(s)</Badge>
                      </div>
                      {simResult.eligibilityErrors.length > 0 && (
                        <div className="mt-3 text-left">
                          {simResult.eligibilityErrors.map((e, i) => (
                            <p key={i} className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {e}</p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="p-5 rounded-xl bg-muted/40 border border-dashed text-center text-sm text-muted-foreground">
                      Renseignez la date de naissance de l'assuré principal pour afficher la prime.
                    </div>
                  )}
                </div>
              )}

              {/* ================= STEP 1 — INFOS & BÉNÉFICIAIRES ================= */}
              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">Renseignez votre identité, votre famille et vos bénéficiaires. Tout est sur un seul écran.</p>

                  {/* --- Identité principal --- */}
                  <section className="space-y-4">
                    <h3 className="font-semibold text-sm text-primary uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4" /> Identité de l'assuré principal</h3>

                    <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-primary"><Sparkles className="w-4 h-4" /> Remplissage automatique par IA</h4>
                      <p className="text-xs text-muted-foreground mb-3">Photographiez votre CNI ou passeport — l'IA extrait vos informations.</p>
                      <IdCardScanner
                        onExtracted={(d) => {
                          setKyc(prev => ({
                            ...prev,
                            nom: d.last_name || prev.nom,
                            prenom: d.first_name || prev.prenom,
                            dob: d.date_of_birth || prev.dob,
                            cni: d.document_number || prev.cni,
                            adresse: d.address || prev.adresse,
                          }));
                          setKycAutoFilled(true);
                          toast({ title: 'Informations extraites ✓' });
                        }}
                      />
                    </div>

                    {kycAutoFilled && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 rounded-lg border border-sonam-green/40 bg-sonam-green/10 p-3 text-xs sm:text-sm text-sonam-green-dark">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-sonam-green" />
                        <span>Champs pré-remplis — modifiez-les si besoin.</span>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><Label>Nom *</Label><Input value={kyc.nom} onChange={e => setKyc({ ...kyc, nom: e.target.value })} /></div>
                      <div><Label>Prénom *</Label><Input value={kyc.prenom} onChange={e => setKyc({ ...kyc, prenom: e.target.value })} /></div>
                      <div><Label>Date de naissance *</Label><DateInput value={kyc.dob || simPrincipalDob} onChange={v => setKyc({ ...kyc, dob: v })} /></div>
                      <div><Label>Téléphone *</Label><Input value={kyc.phone} onChange={e => setKyc({ ...kyc, phone: e.target.value })} /></div>
                      <div><Label>Email</Label><Input type="email" value={kyc.email} onChange={e => setKyc({ ...kyc, email: e.target.value })} /></div>
                      <div><Label>N° CNI / Passeport *</Label><Input value={kyc.cni} onChange={e => setKyc({ ...kyc, cni: e.target.value })} /></div>
                    </div>
                    <div><Label>Adresse</Label><Input value={kyc.adresse} onChange={e => setKyc({ ...kyc, adresse: e.target.value })} /></div>

                    <div className="rounded-xl bg-accent/30 p-3">
                      <p className="text-xs text-muted-foreground mb-2">Ajoutez un selfie (et optionnellement un justificatif de domicile) pour valider votre identité.</p>
                      <BasicKyc
                        scope="principal"
                        onUploaded={(f) => {
                          if (f.doc_type === 'cni_recto') setKycFiles(prev => ({ ...prev, cni: f.storage_path }));
                          else if (f.doc_type === 'selfie') setKycFiles(prev => ({ ...prev, photo: f.storage_path }));
                          else if (f.doc_type === 'domicile') setKycFiles(prev => ({ ...prev, domicile: f.storage_path }));
                        }}
                        onOcrExtracted={(d) => {
                          setKyc(prev => ({
                            ...prev,
                            nom: prev.nom || d.last_name || '',
                            prenom: prev.prenom || d.first_name || '',
                            dob: prev.dob || d.date_of_birth || '',
                            cni: prev.cni || d.document_number || '',
                            adresse: prev.adresse || d.address || '',
                          }));
                          setKycAutoFilled(true);
                        }}
                      />
                    </div>
                  </section>

                  {/* --- Famille (si co-assurés déclarés) --- */}
                  {(hasConjoint || enfants.length > 0 || ascendants.length > 0) && (
                    <section className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-sm text-primary uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Ma famille couverte</h3>

                      {hasConjoint && (
                        <div className="p-3 rounded-xl bg-accent/30 space-y-3">
                          <p className="text-sm font-medium">Conjoint(e)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input placeholder="Nom" value={conjoint.nom} onChange={e => setConjoint({ ...conjoint, nom: e.target.value })} />
                            <Input placeholder="Prénom" value={conjoint.prenom} onChange={e => setConjoint({ ...conjoint, prenom: e.target.value })} />
                          </div>
                          <BasicKyc
                            scope="conjoint"
                            compact
                            onUploaded={(f) => {
                              if (f.doc_type === 'cni_recto') setKycFiles(prev => ({ ...prev, cniConjoint: f.storage_path }));
                              else if (f.doc_type === 'selfie') setKycFiles(prev => ({ ...prev, photoConjoint: f.storage_path }));
                            }}
                          />
                        </div>
                      )}

                      {enfants.map((e, i) => (
                        <div key={i} className="p-3 rounded-xl bg-accent/30 flex gap-2 items-center">
                          <span className="text-xs font-medium w-16 shrink-0">Enfant {i + 1}</span>
                          <Input placeholder="Nom & prénom" value={e.nom} onChange={ev => { const n = [...enfants]; n[i].nom = ev.target.value; setEnfants(n); }} />
                        </div>
                      ))}

                      {ascendants.map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-accent/30 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <Input placeholder="Nom & prénom" value={a.nom} onChange={ev => { const n = [...ascendants]; n[i].nom = ev.target.value; setAscendants(n); }} className="sm:col-span-2" />
                          <Select value={a.lien} onValueChange={v => { const n = [...ascendants]; n[i].lien = v; setAscendants(n); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Père/Mère">Père/Mère</SelectItem><SelectItem value="Oncle/Tante">Oncle/Tante</SelectItem></SelectContent>
                          </Select>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* --- Bénéficiaires --- */}
                  <section className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-sm text-primary uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Bénéficiaires du capital (30% espèces)</h3>
                    <p className="text-xs text-muted-foreground">Laissez vide pour désigner automatiquement vos héritiers légaux.</p>
                    {beneficiaires.map((b, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-accent/30">
                        <Input placeholder="Nom complet" value={b.nom} onChange={e => { const n = [...beneficiaires]; n[i].nom = e.target.value; setBeneficiaires(n); }} />
                        <Select value={b.lien} onValueChange={v => { const n = [...beneficiaires]; n[i].lien = v; setBeneficiaires(n); }}>
                          <SelectTrigger><SelectValue placeholder="Lien" /></SelectTrigger>
                          <SelectContent><SelectItem value="Conjoint">Conjoint</SelectItem><SelectItem value="Enfant">Enfant</SelectItem><SelectItem value="Parent">Parent</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                        </Select>
                        <div className="flex gap-1">
                          <Input placeholder="Téléphone" value={b.telephone} onChange={e => { const n = [...beneficiaires]; n[i].telephone = e.target.value; setBeneficiaires(n); }} />
                          {beneficiaires.length > 1 && <Button size="icon" variant="ghost" onClick={() => setBeneficiaires(beneficiaires.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button>}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setBeneficiaires([...beneficiaires, { nom: '', lien: '', telephone: '' }])}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                  </section>

                  {/* --- Santé (simplifiée) --- */}
                  <section className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Déclaration de santé</h3>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <Label className="text-sm">Je suis en bonne santé, sans maladie chronique ni traitement en cours.</Label>
                      <Switch checked={medicalHealthy} onCheckedChange={setMedicalHealthy} />
                    </div>
                    {!medicalHealthy && (
                      <Textarea placeholder="Précisez : traitements, maladies chroniques, hospitalisations récentes…" value={medicalDetails} onChange={e => setMedicalDetails(e.target.value)} />
                    )}
                  </section>
                </div>
              )}

              {/* ================= STEP 2 — SIGNATURE & PAIEMENT ================= */}
              {step === 2 && (
                <div className="space-y-6">
                  {!signed ? (
                    <>
                      {/* Récap */}
                      <section className="p-4 rounded-xl bg-accent/40 space-y-1 text-sm">
                        <p><strong>Formule :</strong> {formule} — {FORMULE_DETAILS[formule].name}</p>
                        <p><strong>Assuré principal :</strong> {kyc.prenom} {kyc.nom}</p>
                        {hasConjoint && <p><strong>Conjoint :</strong> {conjoint.prenom} {conjoint.nom}</p>}
                        {enfants.length > 0 && <p><strong>Enfants :</strong> {enfants.length}</p>}
                        {ascendants.length > 0 && <p><strong>Ascendants :</strong> {ascendants.length}</p>}
                        <p className="pt-2 border-t border-border/40 mt-2"><strong>Prime annuelle :</strong> <span className="text-primary font-bold text-lg">{simResult ? formatCFA(simResult.primeAnnuelle) : '—'}</span></p>
                      </section>

                      {/* CG */}
                      <section className="space-y-2">
                        <details className="rounded-xl border p-3 bg-muted/30">
                          <summary className="cursor-pointer text-sm font-medium">Lire les Conditions Générales</summary>
                          <div className="mt-3 max-h-56 overflow-y-auto text-xs whitespace-pre-wrap leading-relaxed">{CG_TEXT}</div>
                        </details>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Checkbox checked={cgAccepted} onCheckedChange={v => setCgAccepted(v === true)} />
                          <span className="text-sm">J'ai lu et j'accepte les <strong>Conditions Générales</strong> et les <strong>Conditions Particulières</strong> d'AssurDignité.</span>
                        </div>
                      </section>

                      {/* Signature */}
                      <section className="space-y-2">
                        <Label className="text-sm font-semibold">Signature manuscrite *</Label>
                        <div className="border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-white">
                          <canvas
                            ref={canvasRef}
                            width={500}
                            height={150}
                            className="w-full h-36 cursor-crosshair touch-none"
                            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={clearCanvas}>Effacer</Button>
                      </section>

                      {/* Paiement */}
                      <section className="space-y-2">
                        <Label className="text-sm font-semibold">Paiement</Label>
                        {paymentDone ? (
                          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-center">
                            <Check className="w-6 h-6 text-secondary mx-auto mb-1" />
                            <p className="font-semibold text-secondary text-sm">Paiement enregistré ✓ — Ref : {paymentNumber}</p>
                          </div>
                        ) : (
                          <PaymentMethodSelector
                            amount={simResult ? formatCFA(simResult.primeAnnuelle) : '—'}
                            rib={{
                              bank: 'SGBCI – SONAM VIE',
                              iban: 'CI93 CI108 01001 1234567890 12',
                              reference: `AD-${(user?.id || '').slice(0, 8).toUpperCase() || 'XXXXXXXX'}`,
                            }}
                            onSubmit={async ({ method, reference }) => {
                              if (!user || !simResult) return;
                              setPaymentMethod(method);
                              setPaymentNumber(reference);
                              const { error } = await supabase.from('paiements').insert({
                                user_id: user.id, montant: simResult.primeAnnuelle,
                                methode: method, status: 'pending', reference,
                              });
                              if (error) { toast({ title: 'Erreur paiement', description: error.message, variant: 'destructive' }); return; }
                              setPaymentDone(true);
                              toast({ title: 'Paiement enregistré ✓', description: `Référence : ${reference}` });
                            }}
                          />
                        )}
                      </section>

                      <Button className="w-full gap-2" size="lg" onClick={finalize} disabled={!hasSignature || !cgAccepted || !paymentDone}>
                        <PenTool className="w-4 h-4" /> Finaliser ma souscription
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-4 py-6">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                          <Check className="w-10 h-10 text-secondary" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold font-display text-secondary">Contrat signé avec succès !</h3>
                      <p className="text-muted-foreground">Votre police <strong>{policeNumber}</strong> est créée. Téléchargez vos documents officiels ci-dessous.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto">
                        <Button onClick={() => generatePDF('police')} className="gap-2"><Download className="w-4 h-4" /> Police</Button>
                        <Button onClick={() => generatePDF('attestation')} variant="secondary" className="gap-2"><Download className="w-4 h-4" /> Attestation</Button>
                        <Button onClick={() => generatePDF('recu')} variant="outline" className="gap-2"><Download className="w-4 h-4" /> Reçu</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {!signed && (
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sticky bottom-0 bg-background/95 backdrop-blur py-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:py-0 border-t border-border sm:border-0">
          <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2 w-full sm:w-auto"><ArrowLeft className="w-4 h-4" /> Précédent</Button>
          {step < STEPS.length - 1 && (
            <Button onClick={next} className="gap-2 w-full sm:w-auto" disabled={
              (step === 0 && !simResult) ||
              (step === 1 && (!kyc.nom || !kyc.prenom || !kyc.phone || !kyc.cni))
            }>
              Continuer <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
