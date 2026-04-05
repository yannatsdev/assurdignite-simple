import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Calculator, Users, FileText, Heart, Shield, CreditCard, PenTool, Download, Plus, Minus, AlertCircle } from 'lucide-react';
import { simulatePrime, formatCFA, OPTIONS_CAPITALS, type OptionKey, type SimulationResult } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import waveIcon from '@/assets/wave.svg';
import orangeIcon from '@/assets/orange.svg';
import mtnIcon from '@/assets/mtn.svg';
import moovIcon from '@/assets/moov.svg';
import jsPDF from 'jspdf';

const STEPS = [
  'Simulation', 'Choix Formule', 'KYC Principal', 'Conjoint', 'Assurés Complémentaires',
  'Bénéficiaires', 'Prestations Nature', 'Ayants-droits', 'Questionnaire Médical',
  'Groupe', 'Conditions Générales', 'Paiement', 'Conditions Particulières', 'Signature & Reçu'
];

const STEP_ICONS = [Calculator, Shield, FileText, Heart, Users, Users, Shield, Users, Heart, Users, FileText, CreditCard, FileText, PenTool];

const CG_TEXT = `SONAM VIE – CONDITIONS GÉNÉRALES ASSURDIGNITÉ

Article 1 – Objet : Le présent contrat a pour objet la garantie par SONAM VIE du versement d'un capital décès en cas de décès de l'assuré principal ou de l'un des assurés complémentaires. La garantie se décompose en 70% de prestations en nature et 30% en capital espèces.

Article 2 – Conditions d'adhésion : L'adhésion est ouverte à toute personne physique résidant en Côte d'Ivoire ou dans la zone CIMA, âgée de 18 à 64 ans (principal), 0 à 21 ans (enfants) et 0 à 79 ans (ascendants).

Article 3 – Prestations : En cas de décès, SONAM VIE fournit : cercueil extérieur, conservation du corps, transport funéraire, cérémonie d'inhumation (70%) et versement de 30% en espèces au(x) bénéficiaire(s), en moins de 12 heures.

Article 4 – Exclusions : Suicide dans les 2 premières années, faits de guerre, actes terroristes, participation volontaire à des actes criminels, fausses déclarations.

Article 5 – Obligations : Payer la prime annuelle, déclarer tout changement familial, fournir des informations exactes. Toute fausse déclaration entraîne la nullité du contrat.

Article 6 – Bonus Fidélité-Santé : Aucun sinistre pendant 3 ans = bonus de 30% des primes nettes cumulées.

Article 7 – Résiliation : Résiliation possible à tout moment par lettre. Non-paiement : suspension après 30 jours, résiliation après 90 jours.

Article 8 – Juridiction : Tribunaux d'Abidjan, Côte d'Ivoire. Code des Assurances CIMA.`;

const MEDICAL_QUESTIONS = [
  "Êtes-vous actuellement sous traitement médical ?",
  "Avez-vous été hospitalisé(e) au cours des 5 dernières années ?",
  "Souffrez-vous d'une maladie chronique (diabète, hypertension, etc.) ?",
  "Avez-vous subi une intervention chirurgicale au cours des 3 dernières années ?",
  "Avez-vous un handicap physique ou mental ?",
  "Prenez-vous des médicaments de façon régulière ?",
];

export default function AdhesionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const cgRef = useRef<HTMLDivElement>(null);

  // Step 1: Simulation
  const [simPrincipalDob, setSimPrincipalDob] = useState('');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Step 2: Formule choice
  const [formule, setFormule] = useState<OptionKey>('B');

  // Step 3: KYC Principal
  const [kyc, setKyc] = useState({ nom: '', prenom: '', dob: '', email: '', phone: '', adresse: '', cni: '' });

  // Step 4: Conjoint
  const [hasConjoint, setHasConjoint] = useState(false);
  const [conjoint, setConjoint] = useState({ nom: '', prenom: '', dob: '' });

  // Step 5: Assurés complémentaires
  const [enfants, setEnfants] = useState<{ nom: string; dob: string; prestation: string }[]>([]);
  const [ascendants, setAscendants] = useState<{ nom: string; dob: string; lien: string; prestation: string }[]>([]);

  // Step 6: Bénéficiaires
  const [beneficiaires, setBeneficiaires] = useState([{ nom: '', lien: '', telephone: '' }]);

  // Step 7: Prestations nature
  const [prestations, setPrestations] = useState({ cercueil: 'Standard', conservation: 'Chambre froide', transport: 'Local', inhumation: 'Cimetière' });

  // Step 8: Ayants-droits
  const [ayantsDroits, setAyantsDroits] = useState<{ nom: string; numero: string }[]>([]);
  const [enfantsNaitre, setEnfantsNaitre] = useState(0);

  // Step 9: Questionnaire médical
  const [medicalAnswers, setMedicalAnswers] = useState<boolean[]>(MEDICAL_QUESTIONS.map(() => false));
  const [medicalDeclaration, setMedicalDeclaration] = useState(false);

  // Step 10: Groupe
  const [groupe, setGroupe] = useState({ association: '', numero: '' });

  // Step 11: CG
  const [cgAccepted, setCgAccepted] = useState(false);
  const [cgScrolledToBottom, setCgScrolledToBottom] = useState(false);

  // Step 12: Paiement
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 13: CP
  const [cpAccepted, setCpAccepted] = useState(false);

  // Step 14: Signature
  const [otp, setOtp] = useState('');
  const [signed, setSigned] = useState(false);
  const [contractId, setContractId] = useState('');

  const quoteDate = new Date().toISOString().slice(0, 10);

  const handleSimulate = () => {
    if (!simPrincipalDob) return;
    const res = simulatePrime({
      quoteDate,
      option: formule,
      principal: { dob: simPrincipalDob },
      conjoint: hasConjoint && conjoint.dob ? { dob: conjoint.dob, included: true } : undefined,
      enfants: enfants.filter(e => e.dob).map(e => ({ dob: e.dob, included: true })),
      ascendants: ascendants.filter(a => a.dob).map(a => ({ dob: a.dob, included: true, label: a.lien })),
    });
    setSimResult(res);
  };

  const handleCgScroll = () => {
    if (cgRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = cgRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) setCgScrolledToBottom(true);
    }
  };

  const handlePay = () => {
    if (!paymentMethod || (!paymentNumber && paymentMethod !== 'virement')) return;
    setPaymentDone(true);
    toast({ title: 'Paiement initié', description: `Paiement via ${paymentMethod} en cours de traitement.` });
  };

  const handleSign = async () => {
    if (!user || !simResult) return;
    const policeNumber = `POL-AD-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from('contracts').insert({
      user_id: user.id,
      police_number: policeNumber,
      formule,
      date_effet: quoteDate,
      date_expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      prime_annuelle: simResult.primeAnnuelle,
      principal_name: `${kyc.prenom} ${kyc.nom}`,
      principal_dob: kyc.dob || simPrincipalDob,
      conjoint_name: hasConjoint ? `${conjoint.prenom} ${conjoint.nom}` : null,
      conjoint_dob: hasConjoint ? conjoint.dob : null,
      nb_enfants: enfants.length,
      nb_ascendants: ascendants.length,
      capital_total: simResult.capitaux.principal,
    }).select('id').single();

    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setContractId(data.id);

    // Insert beneficiaires
    for (const b of beneficiaires.filter(b => b.nom)) {
      await supabase.from('beneficiaires').insert({ user_id: user.id, contract_id: data.id, nom: b.nom, lien_parente: b.lien, telephone: b.telephone });
    }
    // Insert assurés complémentaires
    for (const e of enfants) {
      await supabase.from('assures_complementaires').insert({ contract_id: data.id, nom: e.nom, dob: e.dob || null, lien_parente: 'enfant', prestation_nature: e.prestation, type_assure: 'enfant' });
    }
    for (const a of ascendants) {
      await supabase.from('assures_complementaires').insert({ contract_id: data.id, nom: a.nom, dob: a.dob || null, lien_parente: a.lien, prestation_nature: a.prestation, type_assure: 'ascendant' });
    }
    // Insert paiement
    await supabase.from('paiements').insert({ user_id: user.id, contract_id: data.id, montant: simResult.primeAnnuelle, methode: paymentMethod, status: 'paid', reference: `PAY-${Date.now().toString(36).toUpperCase()}` });

    setSigned(true);
    toast({ title: 'Contrat signé !', description: `Votre contrat ${policeNumber} a été créé avec succès.` });
  };

  const generatePDF = () => {
    if (!simResult) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(74, 14, 120);
    doc.text('SONAM VIE – AssurDignité', 20, 25);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Reçu de souscription', 20, 35);
    doc.line(20, 38, 190, 38);
    doc.setFontSize(10);
    let y = 48;
    const addLine = (label: string, value: string) => { doc.text(`${label}: ${value}`, 20, y); y += 7; };
    addLine('Assuré principal', `${kyc.prenom} ${kyc.nom}`);
    addLine('Date de naissance', kyc.dob || simPrincipalDob);
    addLine('Formule', `${formule} – ${formule === 'A' ? 'Dignité Simple' : formule === 'B' ? 'Serein' : formule === 'C' ? 'Prestige' : 'Excellence'}`);
    addLine('Capital garanti', formatCFA(simResult.capitaux.principal));
    addLine('Prime annuelle', formatCFA(simResult.primeAnnuelle));
    if (hasConjoint) addLine('Conjoint(e)', `${conjoint.prenom} ${conjoint.nom}`);
    addLine('Enfants assurés', String(enfants.length));
    addLine('Ascendants assurés', String(ascendants.length));
    addLine('Mode de paiement', paymentMethod);
    addLine('Date de souscription', quoteDate);
    y += 10;
    doc.setFontSize(8);
    doc.text('Ce document est une attestation de souscription. Il ne remplace pas le contrat définitif.', 20, y);
    doc.text('SONAM VIE – 27 20 31 71 82 – servicecommercialsonamvie@sonam.ci', 20, y + 7);
    doc.save(`AssurDignite_Recu_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const next = () => setStep(Math.min(step + 1, STEPS.length - 1));
  const prev = () => setStep(Math.max(step - 1, 0));
  const progress = ((step + 1) / STEPS.length) * 100;

  const StepIcon = STEP_ICONS[step];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Formulaire d'Adhésion</h1>
        <p className="text-muted-foreground">Complétez les {STEPS.length} étapes pour souscrire à AssurDignité</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-2"><StepIcon className="w-4 h-4 text-primary" /> Étape {step + 1} : {STEPS[step]}</span>
          <span className="text-muted-foreground">{step + 1}/{STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="hidden sm:flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card className="border-2">
            <CardContent className="pt-6 space-y-5">
              {/* Step 0: Simulation */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Renseignez votre date de naissance pour estimer votre prime.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Date de naissance *</Label><Input type="date" value={simPrincipalDob} onChange={e => setSimPrincipalDob(e.target.value)} /></div>
                    <div>
                      <Label>Formule</Label>
                      <Select value={formule} onValueChange={v => setFormule(v as OptionKey)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A – Dignité Simple</SelectItem>
                          <SelectItem value="B">B – Serein</SelectItem>
                          <SelectItem value="C">C – Prestige</SelectItem>
                          <SelectItem value="D">D – Excellence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSimulate} disabled={!simPrincipalDob} className="gap-2"><Calculator className="w-4 h-4" /> Simuler</Button>
                  {simResult && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Prime annuelle estimée</p>
                      <p className="text-3xl font-bold text-primary font-display">{formatCFA(simResult.primeAnnuelle)}</p>
                      {simResult.eligibilityErrors.map((e, i) => <p key={i} className="text-sm text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {e}</p>)}
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Choix Formule */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Sélectionnez la formule qui vous convient.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as OptionKey[]).map(key => {
                      const cap = OPTIONS_CAPITALS[key];
                      const names: Record<string, string> = { A: 'Dignité Simple', B: 'Serein', C: 'Prestige', D: 'Excellence' };
                      return (
                        <div key={key} onClick={() => setFormule(key)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formule === key ? 'border-primary bg-primary/5 shadow-lg' : 'border-border hover:border-primary/30'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={formule === key ? 'default' : 'outline'}>Formule {key}</Badge>
                            {formule === key && <Check className="w-5 h-5 text-primary" />}
                          </div>
                          <p className="font-bold font-display">{names[key]}</p>
                          <p className="text-lg text-primary font-semibold">{formatCFA(cap.principal)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: KYC */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Informations de l'assuré principal.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Nom *</Label><Input value={kyc.nom} onChange={e => setKyc({ ...kyc, nom: e.target.value })} /></div>
                    <div><Label>Prénom *</Label><Input value={kyc.prenom} onChange={e => setKyc({ ...kyc, prenom: e.target.value })} /></div>
                    <div><Label>Date de naissance *</Label><Input type="date" value={kyc.dob || simPrincipalDob} onChange={e => setKyc({ ...kyc, dob: e.target.value })} /></div>
                    <div><Label>Email</Label><Input type="email" value={kyc.email} onChange={e => setKyc({ ...kyc, email: e.target.value })} /></div>
                    <div><Label>Téléphone *</Label><Input value={kyc.phone} onChange={e => setKyc({ ...kyc, phone: e.target.value })} /></div>
                    <div><Label>N° CNI / Passeport *</Label><Input value={kyc.cni} onChange={e => setKyc({ ...kyc, cni: e.target.value })} /></div>
                  </div>
                  <div><Label>Adresse complète</Label><Input value={kyc.adresse} onChange={e => setKyc({ ...kyc, adresse: e.target.value })} /></div>
                </div>
              )}

              {/* Step 3: Conjoint */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Inclure un(e) conjoint(e) ?</Label>
                    <Switch checked={hasConjoint} onCheckedChange={setHasConjoint} />
                  </div>
                  {hasConjoint && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-accent/50">
                      <div><Label>Nom</Label><Input value={conjoint.nom} onChange={e => setConjoint({ ...conjoint, nom: e.target.value })} /></div>
                      <div><Label>Prénom</Label><Input value={conjoint.prenom} onChange={e => setConjoint({ ...conjoint, prenom: e.target.value })} /></div>
                      <div><Label>Date de naissance</Label><Input type="date" value={conjoint.dob} onChange={e => setConjoint({ ...conjoint, dob: e.target.value })} /></div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Assurés complémentaires */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Enfants ({enfants.length}/4)</Label>
                    <Button size="sm" variant="outline" onClick={() => enfants.length < 4 && setEnfants([...enfants, { nom: '', dob: '', prestation: 'Cercueil' }])}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                  </div>
                  {enfants.map((e, i) => (
                    <div key={i} className="p-3 rounded-lg bg-accent/30 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-sm font-medium">Enfant {i + 1}</span><Button size="icon" variant="ghost" onClick={() => setEnfants(enfants.filter((_, j) => j !== i))}><Minus className="w-4 h-4" /></Button></div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input placeholder="Nom" value={e.nom} onChange={ev => { const n = [...enfants]; n[i].nom = ev.target.value; setEnfants(n); }} />
                        <Input type="date" value={e.dob} onChange={ev => { const n = [...enfants]; n[i].dob = ev.target.value; setEnfants(n); }} />
                        <Select value={e.prestation} onValueChange={v => { const n = [...enfants]; n[i].prestation = v; setEnfants(n); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Cercueil">Cercueil</SelectItem><SelectItem value="Transport">Transport</SelectItem><SelectItem value="Inhumation">Inhumation</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between mt-4">
                    <Label className="text-base font-semibold">Ascendants ({ascendants.length}/2)</Label>
                    <Button size="sm" variant="outline" onClick={() => ascendants.length < 2 && setAscendants([...ascendants, { nom: '', dob: '', lien: 'Père/Mère', prestation: 'Cercueil' }])}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                  </div>
                  {ascendants.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg bg-accent/30 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-sm font-medium">{a.lien || `Ascendant ${i + 1}`}</span><Button size="icon" variant="ghost" onClick={() => setAscendants(ascendants.filter((_, j) => j !== i))}><Minus className="w-4 h-4" /></Button></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <Input placeholder="Nom" value={a.nom} onChange={ev => { const n = [...ascendants]; n[i].nom = ev.target.value; setAscendants(n); }} />
                        <Input type="date" value={a.dob} onChange={ev => { const n = [...ascendants]; n[i].dob = ev.target.value; setAscendants(n); }} />
                        <Select value={a.lien} onValueChange={v => { const n = [...ascendants]; n[i].lien = v; setAscendants(n); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Père/Mère">Père/Mère</SelectItem><SelectItem value="Oncle/Tante">Oncle/Tante</SelectItem></SelectContent>
                        </Select>
                        <Select value={a.prestation} onValueChange={v => { const n = [...ascendants]; n[i].prestation = v; setAscendants(n); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Cercueil">Cercueil</SelectItem><SelectItem value="Transport">Transport</SelectItem><SelectItem value="Inhumation">Inhumation</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 5: Bénéficiaires */}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Désignez le(s) bénéficiaire(s) du capital espèces (30%).</p>
                  {beneficiaires.map((b, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-accent/30">
                      <Input placeholder="Nom complet" value={b.nom} onChange={e => { const n = [...beneficiaires]; n[i].nom = e.target.value; setBeneficiaires(n); }} />
                      <Select value={b.lien} onValueChange={v => { const n = [...beneficiaires]; n[i].lien = v; setBeneficiaires(n); }}>
                        <SelectTrigger><SelectValue placeholder="Lien de parenté" /></SelectTrigger>
                        <SelectContent><SelectItem value="Conjoint">Conjoint</SelectItem><SelectItem value="Enfant">Enfant</SelectItem><SelectItem value="Parent">Parent</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Téléphone" value={b.telephone} onChange={e => { const n = [...beneficiaires]; n[i].telephone = e.target.value; setBeneficiaires(n); }} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setBeneficiaires([...beneficiaires, { nom: '', lien: '', telephone: '' }])}><Plus className="w-4 h-4 mr-1" /> Ajouter un bénéficiaire</Button>
                </div>
              )}

              {/* Step 6: Prestations nature */}
              {step === 6 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Choisissez vos prestations en nature (70% du capital).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'cercueil', label: 'Cercueil extérieur', options: ['Standard', 'Semi-luxe', 'Luxe'] },
                      { key: 'conservation', label: 'Conservation du corps', options: ['Chambre froide', 'Embaumement'] },
                      { key: 'transport', label: 'Transport funéraire', options: ['Local', 'Interurbain', 'Rapatriement'] },
                      { key: 'inhumation', label: 'Inhumation', options: ['Cimetière', 'Village', 'Autre'] },
                    ].map(p => (
                      <div key={p.key}>
                        <Label>{p.label}</Label>
                        <Select value={(prestations as any)[p.key]} onValueChange={v => setPrestations({ ...prestations, [p.key]: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{p.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7: Ayants-droits non assurés */}
              {step === 7 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Déclarez les enfants nés ou à naître et autres ayants-droits.</p>
                  <div><Label>Nombre d'enfants à naître</Label><Input type="number" min={0} max={4} value={enfantsNaitre} onChange={e => setEnfantsNaitre(parseInt(e.target.value) || 0)} /></div>
                  <div className="flex items-center justify-between">
                    <Label>Autres ayants-droits</Label>
                    <Button size="sm" variant="outline" onClick={() => setAyantsDroits([...ayantsDroits, { nom: '', numero: '' }])}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                  </div>
                  {ayantsDroits.map((a, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Nom" value={a.nom} onChange={e => { const n = [...ayantsDroits]; n[i].nom = e.target.value; setAyantsDroits(n); }} />
                      <Input placeholder="N° Téléphone" value={a.numero} onChange={e => { const n = [...ayantsDroits]; n[i].numero = e.target.value; setAyantsDroits(n); }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 8: Questionnaire médical */}
              {step === 8 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Répondez honnêtement. Toute fausse déclaration annule le contrat.</p>
                  {MEDICAL_QUESTIONS.map((q, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <span className="text-sm flex-1 mr-4">{q}</span>
                      <Switch checked={medicalAnswers[i]} onCheckedChange={v => { const n = [...medicalAnswers]; n[i] = v; setMedicalAnswers(n); }} />
                    </div>
                  ))}
                  <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                    <Checkbox checked={medicalDeclaration} onCheckedChange={v => setMedicalDeclaration(v === true)} />
                    <span className="text-sm">Je certifie que les informations médicales ci-dessus sont exactes et complètes. Je comprends que toute fausse déclaration est passible de poursuites conformément aux textes en vigueur.</span>
                  </div>
                </div>
              )}

              {/* Step 9: Groupe */}
              {step === 9 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Si vous appartenez à un groupe ou une association (optionnel).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Nom de l'association</Label><Input value={groupe.association} onChange={e => setGroupe({ ...groupe, association: e.target.value })} placeholder="Ex: Association des..." /></div>
                    <div><Label>Numéro de membre</Label><Input value={groupe.numero} onChange={e => setGroupe({ ...groupe, numero: e.target.value })} /></div>
                  </div>
                </div>
              )}

              {/* Step 10: Conditions Générales */}
              {step === 10 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Veuillez lire les conditions générales en entier avant de valider.</p>
                  <div ref={cgRef} onScroll={handleCgScroll} className="h-64 overflow-y-auto p-4 border rounded-xl bg-muted/30 text-sm whitespace-pre-wrap leading-relaxed">
                    {CG_TEXT}
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={cgAccepted} onCheckedChange={v => setCgAccepted(v === true)} disabled={!cgScrolledToBottom} />
                    <span className="text-sm">{cgScrolledToBottom ? "J'ai lu et j'accepte les conditions générales d'AssurDignité." : "Faites défiler jusqu'en bas pour pouvoir accepter."}</span>
                  </div>
                </div>
              )}

              {/* Step 11: Paiement */}
              {step === 11 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Choisissez votre mode de paiement. Prime annuelle : <strong className="text-primary">{simResult ? formatCFA(simResult.primeAnnuelle) : '—'}</strong></p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'wave', label: 'Wave', icon: waveIcon },
                      { id: 'orange', label: 'Orange Money', icon: orangeIcon },
                      { id: 'mtn', label: 'MTN Money', icon: mtnIcon },
                      { id: 'moov', label: 'Moov Money', icon: moovIcon },
                    ].map(m => (
                      <div key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        <img src={m.icon} alt={m.label} className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-medium">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setPaymentMethod('virement')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'virement' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                    <p className="font-medium">🏦 Virement bancaire</p>
                    <p className="text-xs text-muted-foreground">Joindre votre RIB</p>
                  </div>
                  {paymentMethod && paymentMethod !== 'virement' && (
                    <div><Label>Numéro de téléphone Mobile Money</Label><Input value={paymentNumber} onChange={e => setPaymentNumber(e.target.value)} placeholder="Ex: 07 XX XX XX XX" /></div>
                  )}
                  {paymentMethod === 'virement' && (
                    <div><Label>RIB bancaire</Label><Input placeholder="Entrez votre RIB" /></div>
                  )}
                  <Button className="w-full gap-2" onClick={handlePay} disabled={!paymentMethod || paymentDone}>
                    <CreditCard className="w-4 h-4" /> {paymentDone ? 'Paiement confirmé ✓' : 'Procéder au paiement'}
                  </Button>
                </div>
              )}

              {/* Step 12: Conditions Particulières */}
              {step === 12 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Vos conditions particulières basées sur votre souscription.</p>
                  <div className="p-4 bg-accent/30 rounded-xl space-y-2 text-sm">
                    <p><strong>Formule :</strong> {formule} – {formule === 'A' ? 'Dignité Simple' : formule === 'B' ? 'Serein' : formule === 'C' ? 'Prestige' : 'Excellence'}</p>
                    <p><strong>Capital principal :</strong> {formatCFA(OPTIONS_CAPITALS[formule].principal)}</p>
                    <p><strong>Prime annuelle :</strong> {simResult ? formatCFA(simResult.primeAnnuelle) : '—'}</p>
                    <p><strong>Assuré principal :</strong> {kyc.prenom} {kyc.nom}</p>
                    {hasConjoint && <p><strong>Conjoint(e) :</strong> {conjoint.prenom} {conjoint.nom}</p>}
                    <p><strong>Enfants :</strong> {enfants.length}</p>
                    <p><strong>Ascendants :</strong> {ascendants.length}</p>
                    <p><strong>Mode de paiement :</strong> {paymentMethod}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={cpAccepted} onCheckedChange={v => setCpAccepted(v === true)} />
                    <span className="text-sm">J'accepte les conditions particulières ci-dessus.</span>
                  </div>
                </div>
              )}

              {/* Step 13: Signature & Reçu */}
              {step === 13 && (
                <div className="space-y-4">
                  {!signed ? (
                    <>
                      <p className="text-sm text-muted-foreground">Entrez le code OTP reçu par SMS pour signer votre contrat.</p>
                      <div><Label>Code OTP</Label><Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="XXXXXX" maxLength={6} /></div>
                      <Button className="w-full gap-2" onClick={handleSign} disabled={otp.length < 4}>
                        <PenTool className="w-4 h-4" /> Signer le contrat
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                          <Check className="w-10 h-10 text-secondary" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold font-display text-secondary">Contrat signé avec succès !</h3>
                      <p className="text-muted-foreground">Votre contrat AssurDignité a été créé. Téléchargez votre reçu ci-dessous.</p>
                      <Button onClick={generatePDF} className="gap-2"><Download className="w-4 h-4" /> Télécharger le reçu PDF</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2"><ArrowLeft className="w-4 h-4" /> Précédent</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={next} className="gap-2" disabled={
            (step === 0 && !simResult) ||
            (step === 8 && !medicalDeclaration) ||
            (step === 10 && !cgAccepted) ||
            (step === 11 && !paymentDone) ||
            (step === 12 && !cpAccepted)
          }>
            Suivant <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
