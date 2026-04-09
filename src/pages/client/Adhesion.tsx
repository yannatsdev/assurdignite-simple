import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Calculator, Users, FileText, Heart, Shield, CreditCard, PenTool, Download, Plus, Minus, AlertCircle, Building2, Info, Upload, X } from 'lucide-react';
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

const STEP_ICONS = [Calculator, Shield, FileText, Heart, Users, Users, Shield, Users, Heart, Building2, FileText, CreditCard, FileText, PenTool];

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

const FORMULE_DETAILS: Record<string, { name: string; desc: string; nature: string[] }> = {
  A: { name: 'Dignité Simple', desc: 'Couverture essentielle pour protéger votre famille à moindre coût.', nature: ['Cercueil standard', 'Conservation du corps', 'Transport local', 'Inhumation simple'] },
  B: { name: 'Serein', desc: 'Protection élargie avec un capital plus confortable pour vos proches.', nature: ['Cercueil semi-luxe', 'Conservation + embaumement', 'Transport interurbain', 'Cérémonie d\'inhumation'] },
  C: { name: 'Prestige', desc: 'Couverture premium pour une prise en charge complète et digne.', nature: ['Cercueil luxe', 'Embaumement complet', 'Transport national', 'Cérémonie complète + veillée'] },
  D: { name: 'Excellence', desc: 'La formule la plus complète. Rapatriement inclus, idéale pour la diaspora.', nature: ['Cercueil haut de gamme', 'Embaumement + soins de présentation', 'Rapatriement national/international', 'Cérémonie d\'exception'] },
};

export default function AdhesionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const cgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Step 0: Simulation
  const [simPrincipalDob, setSimPrincipalDob] = useState('');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isGroupSubscription, setIsGroupSubscription] = useState(false);

  // Step 1: Formule
  const [formule, setFormule] = useState<OptionKey>('D');

  // Step 2: KYC
  const [kyc, setKyc] = useState({ nom: '', prenom: '', dob: '', email: '', phone: '', adresse: '', cni: '' });
  const [kycFiles, setKycFiles] = useState<{ cni?: string; photo?: string; domicile?: string; cniConjoint?: string }>({});
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Step 3: Conjoint
  const [hasConjoint, setHasConjoint] = useState(false);
  const [conjoint, setConjoint] = useState({ nom: '', prenom: '', dob: '' });

  // Step 4: Assurés
  const [enfants, setEnfants] = useState<{ nom: string; dob: string; prestation: string }[]>([]);
  const [ascendants, setAscendants] = useState<{ nom: string; dob: string; lien: string; prestation: string }[]>([]);

  // Step 5: Bénéficiaires
  const [beneficiaires, setBeneficiaires] = useState([{ nom: '', lien: '', telephone: '' }]);

  // Step 6: Prestations
  const [prestations, setPrestations] = useState({ cercueil: 'Standard', conservation: 'Chambre froide', transport: 'Local', inhumation: 'Cimetière' });

  // Step 7: Ayants-droits
  const [ayantsDroits, setAyantsDroits] = useState<{ nom: string; numero: string }[]>([]);
  const [enfantsNaitre, setEnfantsNaitre] = useState(0);

  // Step 8: Medical
  const [medicalAnswers, setMedicalAnswers] = useState<boolean[]>(MEDICAL_QUESTIONS.map(() => false));
  const [medicalDeclaration, setMedicalDeclaration] = useState(false);

  // Step 9: Groupe
  const [groupeData, setGroupeData] = useState({
    typeSouscripteur: '', raisonSociale: '', formeJuridique: '', rccm: '', ccIfu: '',
    secteur: '', adresse: '', telephone: '', whatsapp: false, emailGroupe: '',
    effectifTotal: '', effectifAssure: '',
    repLegalNom: '', repLegalFonction: '', repLegalTel: '', repLegalEmail: '', repLegalPiece: '', repLegalNumPiece: '',
    rhNom: '', rhFonction: '', rhTel: '', rhEmail: '',
    typeAdhesion: '', perimetre: '', dateEffet: '', duree: '12',
    formulesRetenues: [] as string[], periodicite: 'Annuelle', modePaiement: '', quiPaie: '',
    nbAssuresA: '', primeA: '', nbAssuresB: '', primeB: '', nbAssuresC: '', primeC: '', nbAssuresD: '', primeD: '',
  });
  const [groupeDeclarations, setGroupeDeclarations] = useState<boolean[]>([false, false, false, false, false]);
  const [groupeMembers, setGroupeMembers] = useState<{ nom: string; dob: string; sexe: string; tel: string; matricule: string; statut: string; formule: string }[]>([]);

  // Step 10: CG
  const [cgAccepted, setCgAccepted] = useState(false);
  const [cgScrolledToBottom, setCgScrolledToBottom] = useState(false);

  // Step 11: Paiement
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 12: CP
  const [cpAccepted, setCpAccepted] = useState(false);

  // Step 13: Signature
  const [otp, setOtp] = useState('');
  const [signed, setSigned] = useState(false);
  const [contractId, setContractId] = useState('');

  const quoteDate = new Date().toISOString().slice(0, 10);

  const handleKycUpload = async (file: File, type: string) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Fichier trop volumineux', description: 'Max 5 Mo', variant: 'destructive' }); return; }
    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowed.includes(file.type)) { toast({ title: 'Type non supporté', description: 'PNG, JPG ou PDF uniquement', variant: 'destructive' }); return; }
    setUploadingFile(type);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file);
    if (error) { toast({ title: 'Erreur upload', description: error.message, variant: 'destructive' }); }
    else { setKycFiles(prev => ({ ...prev, [type]: path })); toast({ title: 'Document uploadé ✓' }); }
    setUploadingFile(null);
  };

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
    toast({ title: 'Paiement confirmé ✓', description: `Paiement via ${paymentMethod} traité avec succès.` });
    setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1500);
  };

  // Signature canvas
  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = '#4A0E78';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!user || !simResult) return;
    const policeNumber = `POL-AD-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from('contracts').insert({
      user_id: user.id, police_number: policeNumber, formule,
      date_effet: quoteDate,
      date_expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      prime_annuelle: simResult.primeAnnuelle,
      principal_name: `${kyc.prenom} ${kyc.nom}`,
      principal_dob: kyc.dob || simPrincipalDob,
      conjoint_name: hasConjoint ? `${conjoint.prenom} ${conjoint.nom}` : null,
      conjoint_dob: hasConjoint ? conjoint.dob : null,
      nb_enfants: enfants.length, nb_ascendants: ascendants.length,
      capital_total: simResult.capitaux.principal,
    }).select('id').single();

    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setContractId(data.id);

    for (const b of beneficiaires.filter(b => b.nom)) {
      await supabase.from('beneficiaires').insert({ user_id: user.id, contract_id: data.id, nom: b.nom, lien_parente: b.lien, telephone: b.telephone });
    }
    for (const e of enfants) {
      await supabase.from('assures_complementaires').insert({ contract_id: data.id, nom: e.nom, dob: e.dob || null, lien_parente: 'enfant', prestation_nature: e.prestation, type_assure: 'enfant' });
    }
    for (const a of ascendants) {
      await supabase.from('assures_complementaires').insert({ contract_id: data.id, nom: a.nom, dob: a.dob || null, lien_parente: a.lien, prestation_nature: a.prestation, type_assure: 'ascendant' });
    }
    await supabase.from('paiements').insert({ user_id: user.id, contract_id: data.id, montant: simResult.primeAnnuelle, methode: paymentMethod, status: 'paid', reference: `PAY-${Date.now().toString(36).toUpperCase()}` });

    setSigned(true);
    toast({ title: 'Contrat signé !', description: `Votre contrat ${policeNumber} a été créé avec succès.` });
  };

  const generatePDF = () => {
    if (!simResult) return;
    const doc = new jsPDF();
    // Header
    doc.setFillColor(74, 14, 120);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SONAM VIE', 15, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AssurDignité', 15, 22);
    doc.setFontSize(8);
    doc.text('27 20 31 71 82 / 05 95 45 21 65', 195, 10, { align: 'right' });
    doc.text('servicecommercialsonamvie@sonam.ci', 195, 16, { align: 'right' });
    doc.text('Immeuble SONAM, Plateau, Abidjan', 195, 22, { align: 'right' });

    doc.setTextColor(74, 14, 120);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REÇU DE SOUSCRIPTION — ASSURDIGNITÉ', 105, 40, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 55;
    const addLine = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} :`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 85, y);
      y += 8;
    };
    addLine('Assuré principal', `${kyc.prenom} ${kyc.nom}`);
    addLine('Date de naissance', kyc.dob || simPrincipalDob);
    addLine('Formule', `${formule} – ${FORMULE_DETAILS[formule].name}`);
    addLine('Capital garanti', formatCFA(simResult.capitaux.principal));
    addLine('Prime annuelle', formatCFA(simResult.primeAnnuelle));
    if (hasConjoint) addLine('Conjoint(e)', `${conjoint.prenom} ${conjoint.nom}`);
    addLine('Enfants assurés', String(enfants.length));
    addLine('Ascendants assurés', String(ascendants.length));
    addLine('Mode de paiement', paymentMethod);
    addLine('Date de souscription', quoteDate);

    // Add signature if available
    if (canvasRef.current && hasSignature) {
      y += 5;
      doc.text('Signature :', 20, y);
      const imgData = canvasRef.current.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 20, y + 3, 60, 25);
      y += 35;
    }

    // Footer
    y = Math.max(y + 10, 250);
    doc.setDrawColor(74, 14, 120);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Ce document est une attestation de souscription. Il ne remplace pas le contrat définitif.', 105, y + 5, { align: 'center' });
    doc.text('SONAM VIE S.A. – Code des Assurances CIMA', 105, y + 10, { align: 'center' });

    doc.save(`AssurDignite_Recu_${quoteDate}.pdf`);
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
                <div className="space-y-5">
                  {/* Formule comparison table */}
                  <div className="p-4 rounded-xl bg-accent/50 border">
                    <div className="flex items-center gap-2 mb-3"><Info className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">Comparatif des formules AssurDignité</span></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-2">Capital</th>
                            {(['A','B','C','D'] as OptionKey[]).map(k => (
                              <th key={k} className={`text-center py-2 px-2 ${k === 'D' ? 'bg-primary/10 font-bold' : ''}`}>
                                {k} – {FORMULE_DETAILS[k].name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['principal', 'conjoint', 'enfant', 'ascendant'].map(role => (
                            <tr key={role} className="border-b border-border/50">
                              <td className="py-2 pr-2 capitalize font-medium">{role}</td>
                              {(['A','B','C','D'] as OptionKey[]).map(k => (
                                <td key={k} className={`text-center py-2 px-2 ${k === 'D' ? 'bg-primary/5' : ''}`}>
                                  {formatCFA(OPTIONS_CAPITALS[k][role as keyof typeof OPTIONS_CAPITALS.A])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">70% prestations en nature (cercueil, conservation, transport, inhumation) + 30% capital espèces au(x) bénéficiaire(s). Calcul basé sur la table actuarielle CIMA H.</p>
                  </div>

                  <p className="text-sm text-muted-foreground">Renseignez les informations pour estimer votre prime annuelle.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Date de naissance de l'assuré principal *</Label><Input type="date" value={simPrincipalDob} onChange={e => setSimPrincipalDob(e.target.value)} /></div>
                    <div>
                      <Label>Formule</Label>
                      <Select value={formule} onValueChange={v => setFormule(v as OptionKey)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(['A','B','C','D'] as OptionKey[]).map(k => (
                            <SelectItem key={k} value={k}>{k} – {FORMULE_DETAILS[k].name} {k === 'D' ? '⭐' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conjoint toggle in simulation */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <Label className="text-sm">Inclure un(e) conjoint(e)</Label>
                    <Switch checked={hasConjoint} onCheckedChange={setHasConjoint} />
                  </div>
                  {hasConjoint && (
                    <div className="pl-4"><Label className="text-xs">Date de naissance conjoint</Label><Input type="date" value={conjoint.dob} onChange={e => setConjoint({...conjoint, dob: e.target.value})} /></div>
                  )}

                  {/* Quick enfant/ascendant add */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <Label className="text-sm">Enfants ({enfants.length}/4)</Label>
                    <Button size="sm" variant="outline" onClick={() => enfants.length < 4 && setEnfants([...enfants, { nom: '', dob: '', prestation: 'Cercueil' }])}><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
                  </div>
                  {enfants.map((e, i) => (
                    <div key={i} className="flex gap-2 items-center pl-4">
                      <Input type="date" value={e.dob} onChange={ev => { const n = [...enfants]; n[i].dob = ev.target.value; setEnfants(n); }} className="flex-1" />
                      <Button size="icon" variant="ghost" onClick={() => setEnfants(enfants.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <Label className="text-sm">Ascendants ({ascendants.length}/2)</Label>
                    <Button size="sm" variant="outline" onClick={() => ascendants.length < 2 && setAscendants([...ascendants, { nom: '', dob: '', lien: 'Père/Mère', prestation: 'Cercueil' }])}><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
                  </div>
                  {ascendants.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center pl-4">
                      <Input type="date" value={a.dob} onChange={ev => { const n = [...ascendants]; n[i].dob = ev.target.value; setAscendants(n); }} className="flex-1" />
                      <Button size="icon" variant="ghost" onClick={() => setAscendants(ascendants.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button>
                    </div>
                  ))}

                  <Button onClick={handleSimulate} disabled={!simPrincipalDob} className="w-full gap-2" size="lg"><Calculator className="w-4 h-4" /> Simuler ma prime</Button>

                  {simResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 text-center">
                        <p className="text-sm text-muted-foreground">Prime annuelle estimée</p>
                        <p className="text-4xl font-bold text-primary font-display mt-1">{formatCFA(simResult.primeAnnuelle)}</p>
                        <div className="flex justify-center gap-2 mt-2">
                          <Badge variant="outline">Formule {formule} – {FORMULE_DETAILS[formule].name}</Badge>
                          <Badge variant="outline" className="bg-secondary/10">{simResult.persons.filter(p => p.eligible).length} assuré(s)</Badge>
                        </div>
                      </div>
                      {/* Detail per person */}
                      <div className="space-y-1">
                        {simResult.persons.map((p, i) => (
                          <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-accent/30 text-sm">
                            <div><span className="font-medium">{p.label}</span> <span className="text-muted-foreground">({p.age} ans)</span></div>
                            {p.eligible ? <span className="font-semibold text-primary">{formatCFA(Math.round(p.pap))}</span> : <Badge variant="destructive" className="text-xs">Non éligible</Badge>}
                          </div>
                        ))}
                      </div>
                      {simResult.eligibilityErrors.map((e, i) => <p key={i} className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {e}</p>)}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 1: Choix Formule */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Sélectionnez la formule qui vous convient. Chaque formule inclut 70% de prestations en nature et 30% en capital espèces.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(['A', 'B', 'C', 'D'] as OptionKey[]).map(key => {
                      const cap = OPTIONS_CAPITALS[key];
                      const detail = FORMULE_DETAILS[key];
                      return (
                        <div key={key} onClick={() => setFormule(key)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all relative ${formule === key ? 'border-primary bg-primary/5 shadow-lg' : 'border-border hover:border-primary/30'}`}>
                          {key === 'D' && <Badge className="absolute -top-2 right-3 bg-secondary">⭐ Populaire</Badge>}
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={formule === key ? 'default' : 'outline'}>Formule {key}</Badge>
                            {formule === key && <Check className="w-5 h-5 text-primary" />}
                          </div>
                          <p className="font-bold font-display text-lg">{detail.name}</p>
                          <p className="text-xs text-muted-foreground mb-3">{detail.desc}</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span>Principal</span><span className="font-semibold">{formatCFA(cap.principal)}</span></div>
                            <div className="flex justify-between"><span>Conjoint</span><span className="font-semibold">{formatCFA(cap.conjoint)}</span></div>
                            <div className="flex justify-between"><span>Enfant</span><span className="font-semibold">{formatCFA(cap.enfant)}</span></div>
                            <div className="flex justify-between"><span>Ascendant</span><span className="font-semibold">{formatCFA(cap.ascendant)}</span></div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium mb-1">Prestations en nature (70%) :</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {detail.nature.map((n, i) => <li key={i}>• {n}</li>)}
                            </ul>
                          </div>
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

              {/* Step 7: Ayants-droits */}
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
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border">
                    <Label className="text-base font-semibold">Souscription Groupe ?</Label>
                    <Switch checked={isGroupSubscription} onCheckedChange={setIsGroupSubscription} />
                  </div>

                  {!isGroupSubscription ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Souscription individuelle</p>
                      <p className="text-sm">Activez le toggle ci-dessus pour une souscription groupe (entreprise, association, mutuelle).</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Section A: Identification */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">A) Identification du souscripteur</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Type de souscripteur *</Label>
                            <Select value={groupeData.typeSouscripteur} onValueChange={v => setGroupeData({...groupeData, typeSouscripteur: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Entreprise">Entreprise (PME/TPE)</SelectItem>
                                <SelectItem value="Association">Association</SelectItem>
                                <SelectItem value="Mutuelle">Mutuelle</SelectItem>
                                <SelectItem value="Coopérative">Coopérative</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Raison sociale *</Label><Input value={groupeData.raisonSociale} onChange={e => setGroupeData({...groupeData, raisonSociale: e.target.value})} /></div>
                          <div>
                            <Label>Forme juridique</Label>
                            <Select value={groupeData.formeJuridique} onValueChange={v => setGroupeData({...groupeData, formeJuridique: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SARL">SARL</SelectItem><SelectItem value="SA">SA</SelectItem><SelectItem value="EI">EI</SelectItem>
                                <SelectItem value="Association">Association</SelectItem><SelectItem value="Mutuelle">Mutuelle</SelectItem><SelectItem value="Coopérative">Coopérative</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>RCCM / N° récépissé</Label><Input value={groupeData.rccm} onChange={e => setGroupeData({...groupeData, rccm: e.target.value})} /></div>
                          <div><Label>CC / IFU</Label><Input value={groupeData.ccIfu} onChange={e => setGroupeData({...groupeData, ccIfu: e.target.value})} /></div>
                          <div><Label>Secteur d'activité</Label><Input value={groupeData.secteur} onChange={e => setGroupeData({...groupeData, secteur: e.target.value})} /></div>
                          <div className="sm:col-span-2"><Label>Adresse complète</Label><Input value={groupeData.adresse} onChange={e => setGroupeData({...groupeData, adresse: e.target.value})} /></div>
                          <div><Label>Téléphone</Label><Input value={groupeData.telephone} onChange={e => setGroupeData({...groupeData, telephone: e.target.value})} /></div>
                          <div><Label>Email</Label><Input value={groupeData.emailGroupe} onChange={e => setGroupeData({...groupeData, emailGroupe: e.target.value})} /></div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30"><Label className="text-sm">WhatsApp</Label><Switch checked={groupeData.whatsapp} onCheckedChange={v => setGroupeData({...groupeData, whatsapp: v})} /></div>
                          <div><Label>Effectif total</Label><Input type="number" value={groupeData.effectifTotal} onChange={e => setGroupeData({...groupeData, effectifTotal: e.target.value})} /></div>
                          <div><Label>Effectif à assurer</Label><Input type="number" value={groupeData.effectifAssure} onChange={e => setGroupeData({...groupeData, effectifAssure: e.target.value})} /></div>
                        </div>
                      </div>

                      {/* Section B: Personnes habilitées */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">B) Personnes habilitées</h3>
                        <p className="text-xs text-muted-foreground font-medium">B1) Représentant légal</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label>Nom & Prénoms *</Label><Input value={groupeData.repLegalNom} onChange={e => setGroupeData({...groupeData, repLegalNom: e.target.value})} /></div>
                          <div><Label>Fonction</Label><Input value={groupeData.repLegalFonction} onChange={e => setGroupeData({...groupeData, repLegalFonction: e.target.value})} /></div>
                          <div><Label>Téléphone</Label><Input value={groupeData.repLegalTel} onChange={e => setGroupeData({...groupeData, repLegalTel: e.target.value})} /></div>
                          <div><Label>Email</Label><Input value={groupeData.repLegalEmail} onChange={e => setGroupeData({...groupeData, repLegalEmail: e.target.value})} /></div>
                          <div>
                            <Label>Pièce d'identité</Label>
                            <Select value={groupeData.repLegalPiece} onValueChange={v => setGroupeData({...groupeData, repLegalPiece: v})}>
                              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent><SelectItem value="CNI">CNI</SelectItem><SelectItem value="Passeport">Passeport</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div><Label>N° pièce</Label><Input value={groupeData.repLegalNumPiece} onChange={e => setGroupeData({...groupeData, repLegalNumPiece: e.target.value})} /></div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-3">B2) Responsable RH / Trésorerie (si différent)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label>Nom & Prénoms</Label><Input value={groupeData.rhNom} onChange={e => setGroupeData({...groupeData, rhNom: e.target.value})} /></div>
                          <div><Label>Fonction</Label><Input value={groupeData.rhFonction} onChange={e => setGroupeData({...groupeData, rhFonction: e.target.value})} /></div>
                          <div><Label>Téléphone</Label><Input value={groupeData.rhTel} onChange={e => setGroupeData({...groupeData, rhTel: e.target.value})} /></div>
                          <div><Label>Email</Label><Input value={groupeData.rhEmail} onChange={e => setGroupeData({...groupeData, rhEmail: e.target.value})} /></div>
                        </div>
                      </div>

                      {/* Section C: Modalités */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">C) Modalités du contrat groupe</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Type d'adhésion</Label>
                            <Select value={groupeData.typeAdhesion} onValueChange={v => setGroupeData({...groupeData, typeAdhesion: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Obligatoire">Obligatoire (tout le personnel)</SelectItem>
                                <SelectItem value="Volontaire">Volontaire (au choix)</SelectItem>
                                <SelectItem value="Mixte">Mixte (noyau + volontaires)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Périmètre des assurés</Label>
                            <Select value={groupeData.perimetre} onValueChange={v => setGroupeData({...groupeData, perimetre: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Personnel uniquement">Personnel uniquement</SelectItem>
                                <SelectItem value="Personnel + conjoint">Personnel + conjoint</SelectItem>
                                <SelectItem value="Personnel + enfants">Personnel + enfants</SelectItem>
                                <SelectItem value="Personnel + parents">Personnel + parents</SelectItem>
                                <SelectItem value="Complet">Personnel + famille complète</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Date souhaitée de prise d'effet</Label><Input type="date" value={groupeData.dateEffet} onChange={e => setGroupeData({...groupeData, dateEffet: e.target.value})} /></div>
                          <div>
                            <Label>Durée / renouvellement</Label>
                            <Select value={groupeData.duree} onValueChange={v => setGroupeData({...groupeData, duree: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="12">12 mois (annuel renouvelable)</SelectItem><SelectItem value="24">24 mois</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Section D: Formules et tarifs */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">D) Formules, garanties et tarifs</h3>
                        <div className="space-y-2">
                          <Label className="text-xs">Formules retenues pour le groupe :</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['A','B','C','D'] as OptionKey[]).map(k => (
                              <div key={k} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30">
                                <Checkbox checked={groupeData.formulesRetenues.includes(k)} onCheckedChange={v => {
                                  setGroupeData({...groupeData, formulesRetenues: v ? [...groupeData.formulesRetenues, k] : groupeData.formulesRetenues.filter(f => f !== k)});
                                }} />
                                <span className="text-sm">Formule {k} – {FORMULE_DETAILS[k].name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Périodicité</Label>
                            <Select value={groupeData.periodicite} onValueChange={v => setGroupeData({...groupeData, periodicite: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mensuelle">Mensuelle</SelectItem><SelectItem value="Trimestrielle">Trimestrielle</SelectItem><SelectItem value="Annuelle">Annuelle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Mode de paiement</Label>
                            <Select value={groupeData.modePaiement} onValueChange={v => setGroupeData({...groupeData, modePaiement: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mobile Money">Mobile Money</SelectItem><SelectItem value="Virement bancaire">Virement bancaire</SelectItem>
                                <SelectItem value="Espèces">Espèces</SelectItem><SelectItem value="Prélèvement">Prélèvement</SelectItem><SelectItem value="Retenue sur salaire">Retenue sur salaire</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Qui paie ?</Label>
                            <Select value={groupeData.quiPaie} onValueChange={v => setGroupeData({...groupeData, quiPaie: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Groupe 100%">Le groupe paie 100%</SelectItem>
                                <SelectItem value="Salarié 100%">Le salarié/membre paie 100%</SelectItem>
                                <SelectItem value="Partage 50/50">Partage 50/50</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Section E: Récapitulatif */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">E) Récapitulatif financier</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(['A','B','C','D'] as OptionKey[]).filter(k => groupeData.formulesRetenues.includes(k)).map(k => (
                            <div key={k} className="p-3 rounded-lg bg-accent/30 space-y-2">
                              <p className="text-sm font-medium">Formule {k} – {FORMULE_DETAILS[k].name}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div><Label className="text-xs">Nb assurés</Label><Input type="number" value={(groupeData as any)[`nbAssures${k}`]} onChange={e => setGroupeData({...groupeData, [`nbAssures${k}`]: e.target.value})} /></div>
                                <div><Label className="text-xs">Prime totale (FCFA)</Label><Input type="number" value={(groupeData as any)[`prime${k}`]} onChange={e => setGroupeData({...groupeData, [`prime${k}`]: e.target.value})} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section F: Déclarations */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">F) Déclarations et engagements</h3>
                        {[
                          'Les informations fournies sont exactes et vérifiables.',
                          'Le souscripteur s\'engage à communiquer toute modification.',
                          'Les assurés ont été informés des garanties, exclusions et du délai de carence.',
                          'Le maintien des garanties est conditionné au paiement des primes.',
                          'En cas de sinistre, le souscripteur accepte le contrôle documentaire.',
                        ].map((decl, i) => (
                          <div key={i} className="flex items-start gap-3 p-2">
                            <Checkbox checked={groupeDeclarations[i]} onCheckedChange={v => { const n = [...groupeDeclarations]; n[i] = v === true; setGroupeDeclarations(n); }} />
                            <span className="text-sm">{decl}</span>
                          </div>
                        ))}
                      </div>

                      {/* Annexe: Members list */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Annexe — Liste du personnel</h3>
                          <Button size="sm" variant="outline" onClick={() => setGroupeMembers([...groupeMembers, { nom: '', dob: '', sexe: 'M', tel: '', matricule: '', statut: 'Personnel', formule: 'A' }])}><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
                        </div>
                        {groupeMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun membre ajouté. Cliquez sur "Ajouter" pour commencer.</p>}
                        {groupeMembers.map((m, i) => (
                          <div key={i} className="p-3 rounded-lg bg-accent/30 space-y-2">
                            <div className="flex items-center justify-between"><span className="text-xs font-medium">Membre {i + 1}</span><Button size="icon" variant="ghost" onClick={() => setGroupeMembers(groupeMembers.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button></div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Input placeholder="Nom & Prénoms" value={m.nom} onChange={e => { const n = [...groupeMembers]; n[i].nom = e.target.value; setGroupeMembers(n); }} className="col-span-2" />
                              <Input type="date" value={m.dob} onChange={e => { const n = [...groupeMembers]; n[i].dob = e.target.value; setGroupeMembers(n); }} />
                              <Select value={m.sexe} onValueChange={v => { const n = [...groupeMembers]; n[i].sexe = v; setGroupeMembers(n); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
                              </Select>
                              <Input placeholder="Téléphone" value={m.tel} onChange={e => { const n = [...groupeMembers]; n[i].tel = e.target.value; setGroupeMembers(n); }} />
                              <Input placeholder="Matricule" value={m.matricule} onChange={e => { const n = [...groupeMembers]; n[i].matricule = e.target.value; setGroupeMembers(n); }} />
                              <Select value={m.statut} onValueChange={v => { const n = [...groupeMembers]; n[i].statut = v; setGroupeMembers(n); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="Personnel">Personnel</SelectItem><SelectItem value="Conjoint">Conjoint</SelectItem><SelectItem value="Enfant">Enfant</SelectItem><SelectItem value="Parent">Parent</SelectItem></SelectContent>
                              </Select>
                              <Select value={m.formule} onValueChange={v => { const n = [...groupeMembers]; n[i].formule = v; setGroupeMembers(n); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{(['A','B','C','D']).map(k => <SelectItem key={k} value={k}>Formule {k}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                      <div key={m.id} onClick={() => !paymentDone && setPaymentMethod(m.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        <img src={m.icon} alt={m.label} className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-medium">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => !paymentDone && setPaymentMethod('virement')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'virement' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                    <p className="font-medium">🏦 Virement bancaire</p>
                    <p className="text-xs text-muted-foreground">Joindre votre RIB</p>
                  </div>
                  {paymentMethod && paymentMethod !== 'virement' && !paymentDone && (
                    <div><Label>Numéro de téléphone Mobile Money</Label><Input value={paymentNumber} onChange={e => setPaymentNumber(e.target.value)} placeholder="Ex: 07 XX XX XX XX" /></div>
                  )}
                  {paymentMethod === 'virement' && !paymentDone && (
                    <div><Label>RIB bancaire</Label><Input placeholder="Entrez votre RIB" /></div>
                  )}
                  {paymentDone ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-center">
                      <Check className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <p className="font-semibold text-secondary">Paiement confirmé !</p>
                      <p className="text-xs text-muted-foreground">Passage automatique à l'étape suivante...</p>
                    </motion.div>
                  ) : (
                    <Button className="w-full gap-2" onClick={handlePay} disabled={!paymentMethod}>
                      <CreditCard className="w-4 h-4" /> Procéder au paiement
                    </Button>
                  )}
                </div>
              )}

              {/* Step 12: Conditions Particulières */}
              {step === 12 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Vos conditions particulières basées sur votre souscription.</p>
                  <div className="p-4 bg-accent/30 rounded-xl space-y-2 text-sm">
                    <p><strong>Formule :</strong> {formule} – {FORMULE_DETAILS[formule].name}</p>
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
                      <p className="text-sm text-muted-foreground">Signez votre contrat ci-dessous et entrez le code OTP reçu par SMS.</p>

                      {/* Signature canvas */}
                      <div className="space-y-2">
                        <Label>Signature manuscrite</Label>
                        <div className="border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-white">
                          <canvas
                            ref={canvasRef}
                            width={500}
                            height={150}
                            className="w-full h-36 cursor-crosshair touch-none"
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={clearCanvas}>Effacer la signature</Button>
                      </div>

                      <div><Label>Code OTP (reçu par SMS)</Label><Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="XXXXXX" maxLength={6} /></div>
                      <Button className="w-full gap-2" onClick={handleSign} disabled={otp.length < 4 || !hasSignature}>
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
