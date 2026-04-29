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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Calculator, Users, FileText, Heart, Shield, CreditCard, PenTool, Download, Plus, Minus, AlertCircle, Building2, Upload, X, Camera, Banknote, ScanFace, ShieldCheck } from 'lucide-react';
import { simulatePrime, formatCFA, OPTIONS_CAPITALS, type OptionKey, type SimulationResult } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { KycWizard, type KycResult } from '@/components/kyc/KycWizard';

const STEPS = [
  'Simulation', 'Choix Formule', 'KYC Principal', 'Conjoint', 'Assurés Complémentaires',
  'Bénéficiaires', 'Prestations Nature', 'Ayants-droits', 'Questionnaire Médical',
  'Groupe', 'Conditions Générales', 'Paiement', 'Conditions Particulières', 'Signature & Reçu'
];

const STEP_ICONS = [Calculator, Shield, FileText, Heart, Users, Users, Shield, Users, Heart, Building2, FileText, CreditCard, FileText, PenTool];

const CG_TEXT = `SONAM VIE – CONDITIONS GÉNÉRALES ASSURDIGNITÉ

Article 1 – Objet : Le présent contrat a pour objet la garantie par SONAM VIE du versement d'un capital décès en cas de décès de l'assuré principal ou de l'un des assurés complémentaires. La garantie se décompose en 70% de prestations en nature et 30% en capital espèces.

Article 2 – Conditions d'adhésion : L'adhésion est ouverte à toute personne physique résidant en Côte d'Ivoire ou dans la zone CIMA, âgée de 18 à 64 ans (principal), 0 à 21 ans (enfants) et 0 à 79 ans (ascendants).

Article 3 – Prestations : En cas de décès, SONAM VIE fournit : cercueil extérieur, conservation du corps, transport funéraire, cérémonie d'inhumation (70%) et versement de 30% en espèces au(x) bénéficiaire(s), en moins de 12 heures après dépôt et analyse des pièces justificatives.

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

// Camera selfie component
function CameraSelfie({ onCapture, existingFile, onRemove, uploading }: {
  onCapture: (blob: Blob) => void;
  existingFile?: string;
  onRemove: () => void;
  uploading: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
      setStream(s);
      setStreaming(true);
      setCameraError(false);
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setStreaming(false);
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) onCapture(blob);
      stopCamera();
    }, 'image/jpeg', 0.85);
  };

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  if (existingFile) {
    return (
      <div className="border-2 border-dashed rounded-xl p-4 text-center border-sonam-green bg-sonam-green/5">
        <div className="flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-sonam-green" />
          <span className="text-sm text-sonam-green font-medium">Photo capturée</span>
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="border-2 border-dashed rounded-xl p-4 text-center border-border">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Upload...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed rounded-xl p-4 text-center border-border hover:border-primary/50 transition-colors space-y-3">
      {streaming ? (
        <>
          <video ref={videoRef} className="w-full max-w-xs mx-auto rounded-lg" autoPlay playsInline muted />
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={capture} className="gap-1"><Camera className="w-4 h-4" /> Prendre la photo</Button>
            <Button size="sm" variant="outline" onClick={stopCamera}>Annuler</Button>
          </div>
        </>
      ) : (
        <>
          <Button size="sm" variant="outline" onClick={startCamera} className="gap-1"><Camera className="w-4 h-4" /> Ouvrir la caméra</Button>
          {cameraError && (
            <>
              <p className="text-xs text-destructive">Caméra non disponible</p>
              <label className="cursor-pointer text-xs text-primary underline">
                Uploader une photo à la place
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onCapture(f);
                }} />
              </label>
            </>
          )}
        </>
      )}
    </div>
  );
}

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
  const [kycFiles, setKycFiles] = useState<{
    cni?: string; cniVerso?: string; photo?: string; domicile?: string;
    cniConjoint?: string; cniVersoConjoint?: string; photoConjoint?: string;
    livenessFrames?: string[]; livenessFramesConjoint?: string[];
    docType?: string; livenessScore?: number; verifiedAt?: string;
    docTypeConjoint?: string; livenessScoreConjoint?: number; verifiedAtConjoint?: string;
  }>({});
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardConjointOpen, setWizardConjointOpen] = useState(false);
  const [verifying, setVerifying] = useState<'principal' | 'conjoint' | null>(null);

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

  // Step 8: Medical — Oui/Non + details
  const [medicalAnswers, setMedicalAnswers] = useState<{ answer: boolean; details: string }[]>(MEDICAL_QUESTIONS.map(() => ({ answer: false, details: '' })));
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
  const [signed, setSigned] = useState(false);
  const [contractId, setContractId] = useState('');
  const [policeNumber, setPoliceNumber] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const quoteDate = new Date().toISOString().slice(0, 10);

  const handleKycUpload = async (file: File | Blob, type: string) => {
    if (!user) return;
    const size = file instanceof File ? file.size : file.size;
    if (size > 5 * 1024 * 1024) { toast({ title: 'Fichier trop volumineux', description: 'Max 5 Mo', variant: 'destructive' }); return; }
    setUploadingFile(type);
    const ext = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file);
    if (error) { toast({ title: 'Erreur upload', description: error.message, variant: 'destructive' }); }
    else { setKycFiles(prev => ({ ...prev, [type]: path })); toast({ title: 'Document uploadé ✓' }); }
    setUploadingFile(null);
  };

  // Upload a single Blob silently (used by wizard) and return path
  const uploadBlob = async (blob: Blob, type: string): Promise<string | null> => {
    if (!user) return null;
    const path = `${user.id}/${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await supabase.storage.from('kyc-documents').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) {
      toast({ title: 'Erreur upload', description: error.message, variant: 'destructive' });
      return null;
    }
    return path;
  };

  const handleWizardComplete = async (r: KycResult, target: 'principal' | 'conjoint') => {
    setVerifying(target);
    const prefix = target === 'conjoint' ? 'conjoint_' : '';
    const [recto, verso, selfie, ...frames] = await Promise.all([
      uploadBlob(r.cniRecto, `${prefix}cni_recto`),
      uploadBlob(r.cniVerso, `${prefix}cni_verso`),
      uploadBlob(r.selfie, `${prefix}selfie`),
      ...r.livenessFrames.map((f, i) => uploadBlob(f, `${prefix}liveness_${i}`)),
    ]);
    const okFrames = frames.filter(Boolean) as string[];

    setKycFiles(prev =>
      target === 'conjoint'
        ? {
            ...prev,
            cniConjoint: recto || prev.cniConjoint,
            cniVersoConjoint: verso || prev.cniVersoConjoint,
            photoConjoint: selfie || prev.photoConjoint,
            livenessFramesConjoint: okFrames,
            docTypeConjoint: r.docType,
            livenessScoreConjoint: r.livenessScore,
            verifiedAtConjoint: new Date().toISOString(),
          }
        : {
            ...prev,
            cni: recto || prev.cni,
            cniVerso: verso || prev.cniVerso,
            photo: selfie || prev.photo,
            livenessFrames: okFrames,
            docType: r.docType,
            livenessScore: r.livenessScore,
            verifiedAt: new Date().toISOString(),
          },
    );
    setVerifying(null);
    toast({ title: 'Identité vérifiée ✓', description: `Score de présence : ${(r.livenessScore * 100).toFixed(0)}%` });
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

  // Signature canvas — fixed coordinate scaling
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
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
    } as any).select('id').single();

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
    const newPayRef = `PAY-${Date.now().toString(36).toUpperCase()}`;
    setPaymentRef(newPayRef);
    await supabase.from('paiements').insert({ user_id: user.id, contract_id: data.id, montant: simResult.primeAnnuelle, methode: paymentMethod, status: 'paid', reference: newPayRef });

    setSigned(true);
    toast({ title: 'Contrat signé !', description: `Votre contrat ${newPolice} a été créé avec succès.` });
  };

  const formatDateFR = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
  };

  const generatePDF = async () => {
    if (!simResult) return;
    const { newPdf, pdfHeader, pdfTitle, pdfSection, pdfKeyValueGrid, pdfTable, pdfFooter, formatDateFR: fmt } = await import('@/lib/pdf-shared');
    const doc = newPdf();
    pdfHeader(doc, 'Reçu de souscription');
    let y = 52;
    y = pdfTitle(doc, 'REÇU DE SOUSCRIPTION', y, `Référence ${quoteDate}`);

    y = pdfSection(doc, 'Souscripteur', y);
    y = pdfKeyValueGrid(doc, [
      ['Nom & prénom', `${kyc.prenom} ${kyc.nom}`.trim() || '—'],
      ['Date de naissance', fmt(kyc.dob || simPrincipalDob)],
      ['CNI', kyc.cni || '—'],
      ['Date de souscription', fmt(quoteDate)],
    ], y);

    y = pdfSection(doc, 'Formule & garanties', y);
    y = pdfKeyValueGrid(doc, [
      ['Formule choisie', `${formule} — ${FORMULE_DETAILS[formule].name}`],
      ['Capital principal', formatCFA(simResult.capitaux.principal)],
      ['Capital conjoint', hasConjoint ? formatCFA(simResult.capitaux.conjoint || 0) : 'Non inclus'],
      ['Capital enfant (par)', formatCFA(simResult.capitaux.enfant || 0)],
      ['Capital ascendant (par)', formatCFA(simResult.capitaux.ascendant || 0)],
      ['Prime annuelle', formatCFA(simResult.primeAnnuelle)],
      ['Mode de paiement', String(paymentMethod || '—').replace('simulation_', 'Simulation ')],
      ['Couverture', '70% nature + 30% espèces'],
    ], y);

    if (hasConjoint || enfants.length || ascendants.length) {
      y = pdfSection(doc, 'Assurés complémentaires', y);
      const rows: string[][] = [];
      const fullName = (p: any, fallback: string) => {
        const n = `${p?.prenom ?? ''} ${p?.nom ?? ''}`.replace(/\s+/g, ' ').trim();
        return n || fallback;
      };
      if (hasConjoint) rows.push([fullName(conjoint, 'Conjoint(e)'), 'Conjoint(e)', fmt(conjoint.dob)]);
      enfants.forEach((e: any, i: number) => rows.push([fullName(e, `Enfant ${i + 1}`), 'Enfant', fmt(e.dob)]));
      ascendants.forEach((a: any, i: number) => rows.push([fullName(a, `Ascendant ${i + 1}`), a.lien || 'Ascendant', fmt(a.dob)]));
      y = pdfTable(doc, ['Nom & prénom', 'Lien', 'Né(e) le'], rows, y, [85, 50, 45]);
    }

    if (beneficiaires?.length) {
      y = pdfSection(doc, 'Bénéficiaires désignés', y);
      y = pdfTable(
        doc,
        ['Nom', 'Lien', 'Téléphone'],
        beneficiaires.map((b: any) => [b.nom || '—', b.lien || b.lien_parente || '—', b.telephone || '—']),
        y, [80, 60, 40],
      );
    }

    if (canvasRef.current && hasSignature) {
      if (y > 235) { doc.addPage(); pdfHeader(doc); y = 52; }
      y = pdfSection(doc, 'Signature du souscripteur', y);
      try {
        const imgData = canvasRef.current.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, y, 60, 25);
      } catch {}
    }

    pdfFooter(doc);
    doc.save(`AssurDignite_Recu_${quoteDate}.pdf`);
  };

  const generatePolicePDF = async () => {
    if (!simResult) return;
    const { newPdf, pdfHeader, pdfTitle, pdfSection, pdfKeyValueGrid, pdfTable, pdfFooter, formatDateFR: fmt, FORMULE_NAMES, SONAM_BRAND } = await import('@/lib/pdf-shared');
    const doc = newPdf();
    pdfHeader(doc, "Police d'assurance obsèques");
    let y = 52;
    y = pdfTitle(doc, "POLICE D'ASSURANCE", y, `N° ${policeNumber}`);
    y = pdfSection(doc, '1. Souscripteur', y);
    y = pdfKeyValueGrid(doc, [
      ['Nom & prénom', `${kyc.prenom} ${kyc.nom}`.trim() || '—'],
      ['Email', user?.email || '—'],
      ['Téléphone', kyc.phone || '—'],
      ['Date de naissance', fmt(kyc.dob || simPrincipalDob)],
      ['CNI', kyc.cni || '—'],
      ['Adresse', kyc.adresse || '—'],
    ], y);
    y = pdfSection(doc, '2. Formule & garanties', y);
    y = pdfKeyValueGrid(doc, [
      ['Formule', `${formule} — ${FORMULE_NAMES[formule] || ''}`],
      ['Capital garanti', formatCFA(simResult.capitaux.principal)],
      ['Prime annuelle', formatCFA(simResult.primeAnnuelle)],
      ['Date d\u2019effet', fmt(quoteDate)],
      ['Date d\u2019expiration', fmt(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10))],
      ['Couverture', '70% prestations en nature + 30% capital espèces'],
    ], y);
    if (hasConjoint || enfants.length || ascendants.length) {
      y = pdfSection(doc, '3. Assurés complémentaires', y);
      const fullName = (p: any, fb: string) => (`${p?.prenom ?? ''} ${p?.nom ?? ''}`.replace(/\s+/g, ' ').trim() || fb);
      const rows: string[][] = [];
      if (hasConjoint) rows.push([fullName(conjoint, 'Conjoint(e)'), 'Conjoint(e)', fmt(conjoint.dob)]);
      enfants.forEach((e: any, i: number) => rows.push([fullName(e, `Enfant ${i + 1}`), 'Enfant', fmt(e.dob)]));
      ascendants.forEach((a: any, i: number) => rows.push([fullName(a, `Ascendant ${i + 1}`), a.lien || 'Ascendant', fmt(a.dob)]));
      y = pdfTable(doc, ['Nom & prénom', 'Lien', 'Né(e) le'], rows, y, [85, 50, 45]);
    }
    if (beneficiaires.filter((b: any) => b.nom).length) {
      y = pdfSection(doc, '4. Bénéficiaires désignés', y);
      y = pdfTable(doc, ['Nom', 'Lien', 'Téléphone'],
        beneficiaires.filter((b: any) => b.nom).map((b: any) => [b.nom, b.lien || '—', b.telephone || '—']),
        y, [80, 60, 40]);
    }
    if (y > 235) { doc.addPage(); pdfHeader(doc); y = 52; }
    y = pdfSection(doc, '5. Signatures', y);
    doc.setFontSize(9); doc.setTextColor(110);
    doc.text('Fait à Abidjan, le ' + new Date().toLocaleDateString('fr-FR'), 18, y); y += 14;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 14, 120);
    doc.text('Le Souscripteur', 30, y);
    doc.text('La Direction Générale', 140, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 24, 48);
    doc.text(`${kyc.prenom} ${kyc.nom}`.trim() || '—', 30, y + 18);
    doc.text(SONAM_BRAND.name, 140, y + 18);
    if (canvasRef.current && hasSignature) {
      try { doc.addImage(canvasRef.current.toDataURL('image/png'), 'PNG', 25, y + 4, 50, 18); } catch {}
    }
    pdfFooter(doc);
    doc.save(`Police_AssurDignite_${policeNumber}.pdf`);
  };

  const generateAttestationPDF = async () => {
    if (!simResult) return;
    const { newPdf, pdfHeader, pdfTitle, pdfSection, pdfKeyValueGrid, pdfFooter, formatDateFR: fmt, FORMULE_NAMES, SONAM_BRAND } = await import('@/lib/pdf-shared');
    const doc = newPdf();
    pdfHeader(doc, "Attestation d'assurance");
    let y = 56;
    y = pdfTitle(doc, "ATTESTATION D'ASSURANCE", y, `Police N° ${policeNumber}`);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 24, 48);
    const txt = `Nous, SONAM VIE S.A., attestons par la présente que ${`${kyc.prenom} ${kyc.nom}`.trim() || "l'assuré"} est titulaire du contrat d'assurance obsèques AssurDignité, Formule ${formule} — ${FORMULE_NAMES[formule] || ''}, sous le numéro de police ${policeNumber}.`;
    const split = doc.splitTextToSize(txt, 175);
    doc.text(split, 18, y); y += split.length * 6 + 6;
    y = pdfSection(doc, 'Détails du contrat', y);
    const expiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
    y = pdfKeyValueGrid(doc, [
      ['Période de validité', `Du ${fmt(quoteDate)} au ${fmt(expiry)}`],
      ['Capital garanti', formatCFA(simResult.capitaux.principal)],
      ['Prime annuelle', formatCFA(simResult.primeAnnuelle)],
      ['Statut', 'Actif'],
    ], y);
    y += 8;
    doc.setFontSize(10);
    doc.text('Fait à Abidjan, le ' + new Date().toLocaleDateString('fr-FR'), 18, y);
    y += 18;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 14, 120);
    doc.text('La Direction Générale', 130, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 24, 48);
    doc.text(SONAM_BRAND.name, 130, y + 6);
    pdfFooter(doc);
    doc.save(`Attestation_AssurDignite_${policeNumber}.pdf`);
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

              {/* Step 0: Simulation — NO comparison table */}
              {step === 0 && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">Renseignez les informations pour estimer votre prime annuelle.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Date de naissance de l'assuré principal *</Label><DateInput value={simPrincipalDob} onChange={e => setSimPrincipalDob(e)} /></div>
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

                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <Label className="text-sm">Inclure un(e) conjoint(e)</Label>
                    <Switch checked={hasConjoint} onCheckedChange={setHasConjoint} />
                  </div>
                  {hasConjoint && (
                    <div className="pl-4"><Label className="text-xs">Date de naissance conjoint</Label><DateInput value={conjoint.dob} onChange={e => setConjoint({...conjoint, dob: e})} /></div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <Label className="text-sm">Enfants ({enfants.length}/4)</Label>
                    <Button size="sm" variant="outline" onClick={() => enfants.length < 4 && setEnfants([...enfants, { nom: '', dob: '', prestation: 'Cercueil' }])}><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
                  </div>
                  {enfants.map((e, i) => (
                    <div key={i} className="flex gap-2 items-center pl-4">
                      <DateInput value={e.dob} onChange={ev => { const n = [...enfants]; n[i].dob = ev; setEnfants(n); }} className="flex-1" />
                      <Button size="icon" variant="ghost" onClick={() => setEnfants(enfants.filter((_, j) => j !== i))}><Minus className="w-3 h-3" /></Button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <Label className="text-sm">Ascendants ({ascendants.length}/2)</Label>
                    <Button size="sm" variant="outline" onClick={() => ascendants.length < 2 && setAscendants([...ascendants, { nom: '', dob: '', lien: 'Père/Mère', prestation: 'Cercueil' }])}><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
                  </div>
                  {ascendants.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center pl-4">
                      <DateInput value={a.dob} onChange={ev => { const n = [...ascendants]; n[i].dob = ev; setAscendants(n); }} className="flex-1" />
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

              {/* Step 2: KYC — with camera selfie for photo */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Informations de l'assuré principal.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Nom *</Label><Input value={kyc.nom} onChange={e => setKyc({ ...kyc, nom: e.target.value })} /></div>
                    <div><Label>Prénom *</Label><Input value={kyc.prenom} onChange={e => setKyc({ ...kyc, prenom: e.target.value })} /></div>
                    <div><Label>Date de naissance *</Label><DateInput value={kyc.dob || simPrincipalDob} onChange={e => setKyc({ ...kyc, dob: e })} /></div>
                    <div><Label>Email</Label><Input type="email" value={kyc.email} onChange={e => setKyc({ ...kyc, email: e.target.value })} /></div>
                    <div><Label>Téléphone *</Label><Input value={kyc.phone} onChange={e => setKyc({ ...kyc, phone: e.target.value })} /></div>
                    <div><Label>N° CNI / Passeport *</Label><Input value={kyc.cni} onChange={e => setKyc({ ...kyc, cni: e.target.value })} /></div>
                  </div>
                  <div><Label>Adresse complète</Label><Input value={kyc.adresse} onChange={e => setKyc({ ...kyc, adresse: e.target.value })} /></div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold font-display mb-3 flex items-center gap-2"><Upload className="w-4 h-4" /> Documents justificatifs</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* CNI upload */}
                      <div className="space-y-2">
                        <Label className="text-sm">Pièce d'identité (CNI/Passeport) *</Label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${kycFiles.cni ? 'border-sonam-green bg-sonam-green/5' : 'border-border hover:border-primary/50'}`}>
                          {kycFiles.cni ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-4 h-4 text-sonam-green" />
                              <span className="text-sm text-sonam-green font-medium">Uploadé</span>
                              <button onClick={() => setKycFiles(prev => { const n = { ...prev }; delete n.cni; return n; })} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              {uploadingFile === 'cni' ? (
                                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs">Upload...</span></div>
                              ) : (
                                <><Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Cliquez pour uploader</p><p className="text-xs text-muted-foreground/60">PNG, JPG ou PDF (max 5 Mo)</p></>
                              )}
                              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleKycUpload(e.target.files[0], 'cni')} />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Photo — Camera selfie */}
                      <div className="space-y-2">
                        <Label className="text-sm">Prendre une photo (selfie) *</Label>
                        <CameraSelfie
                          existingFile={kycFiles.photo}
                          uploading={uploadingFile === 'photo'}
                          onCapture={blob => handleKycUpload(blob, 'photo')}
                          onRemove={() => setKycFiles(prev => { const n = { ...prev }; delete n.photo; return n; })}
                        />
                      </div>

                      {/* Domicile upload */}
                      <div className="space-y-2">
                        <Label className="text-sm">Justificatif de domicile</Label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${kycFiles.domicile ? 'border-sonam-green bg-sonam-green/5' : 'border-border hover:border-primary/50'}`}>
                          {kycFiles.domicile ? (
                            <div className="flex items-center justify-center gap-2">
                              <Check className="w-4 h-4 text-sonam-green" />
                              <span className="text-sm text-sonam-green font-medium">Uploadé</span>
                              <button onClick={() => setKycFiles(prev => { const n = { ...prev }; delete n.domicile; return n; })} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              {uploadingFile === 'domicile' ? (
                                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs">Upload...</span></div>
                              ) : (
                                <><Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Cliquez pour uploader</p><p className="text-xs text-muted-foreground/60">PNG, JPG ou PDF (max 5 Mo)</p></>
                              )}
                              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleKycUpload(e.target.files[0], 'domicile')} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Conjoint — with CNI + camera selfie */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Inclure un(e) conjoint(e) ?</Label>
                    <Switch checked={hasConjoint} onCheckedChange={setHasConjoint} />
                  </div>
                  {hasConjoint && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-accent/50">
                        <div><Label>Nom</Label><Input value={conjoint.nom} onChange={e => setConjoint({ ...conjoint, nom: e.target.value })} /></div>
                        <div><Label>Prénom</Label><Input value={conjoint.prenom} onChange={e => setConjoint({ ...conjoint, prenom: e.target.value })} /></div>
                        <div><Label>Date de naissance</Label><DateInput value={conjoint.dob} onChange={e => setConjoint({ ...conjoint, dob: e })} /></div>
                      </div>
                      {/* Conjoint CNI */}
                      <div className="space-y-2">
                        <Label className="text-sm">Pièce d'identité du conjoint (CNI/Passeport) *</Label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${kycFiles.cniConjoint ? 'border-sonam-green bg-sonam-green/5' : 'border-border hover:border-primary/50'}`}>
                          {kycFiles.cniConjoint ? (
                            <div className="flex items-center justify-center gap-2"><Check className="w-4 h-4 text-sonam-green" /><span className="text-sm text-sonam-green font-medium">Uploadé</span><button onClick={() => setKycFiles(prev => { const n = { ...prev }; delete n.cniConjoint; return n; })} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button></div>
                          ) : (
                            <label className="cursor-pointer">
                              {uploadingFile === 'cniConjoint' ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs">Upload...</span></div> : <><Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Cliquez pour uploader (PNG, JPG, PDF)</p></>}
                              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleKycUpload(e.target.files[0], 'cniConjoint')} />
                            </label>
                          )}
                        </div>
                      </div>
                      {/* Conjoint Photo selfie */}
                      <div className="space-y-2">
                        <Label className="text-sm">Photo du conjoint (selfie) *</Label>
                        <CameraSelfie
                          existingFile={kycFiles.photoConjoint}
                          uploading={uploadingFile === 'photoConjoint'}
                          onCapture={blob => handleKycUpload(blob, 'photoConjoint')}
                          onRemove={() => setKycFiles(prev => { const n = { ...prev }; delete n.photoConjoint; return n; })}
                        />
                      </div>
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
                        <DateInput value={e.dob} onChange={ev => { const n = [...enfants]; n[i].dob = ev; setEnfants(n); }} />
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
                        <DateInput value={a.dob} onChange={ev => { const n = [...ascendants]; n[i].dob = ev; setAscendants(n); }} />
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

              {/* Step 8: Questionnaire médical — Oui/Non + textarea */}
              {step === 8 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Répondez honnêtement. Toute fausse déclaration annule le contrat.</p>
                  {MEDICAL_QUESTIONS.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg bg-accent/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex-1 mr-4">{q}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant={medicalAnswers[i].answer ? 'default' : 'outline'}
                            className={medicalAnswers[i].answer ? 'bg-destructive hover:bg-destructive/90' : ''}
                            onClick={() => { const n = [...medicalAnswers]; n[i] = { ...n[i], answer: true }; setMedicalAnswers(n); }}>
                            Oui
                          </Button>
                          <Button size="sm" variant={!medicalAnswers[i].answer ? 'default' : 'outline'}
                            className={!medicalAnswers[i].answer ? 'bg-sonam-green hover:bg-sonam-green/90 text-white' : ''}
                            onClick={() => { const n = [...medicalAnswers]; n[i] = { answer: false, details: '' }; setMedicalAnswers(n); }}>
                            Non
                          </Button>
                        </div>
                      </div>
                      {medicalAnswers[i].answer && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <Textarea
                            placeholder="Veuillez préciser..."
                            value={medicalAnswers[i].details}
                            onChange={e => { const n = [...medicalAnswers]; n[i] = { ...n[i], details: e.target.value }; setMedicalAnswers(n); }}
                            className="mt-2"
                          />
                        </motion.div>
                      )}
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
                                <SelectItem value="ONG">ONG</SelectItem>
                                <SelectItem value="Administration">Administration publique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Raison sociale *</Label><Input value={groupeData.raisonSociale} onChange={e => setGroupeData({...groupeData, raisonSociale: e.target.value})} /></div>
                          <div><Label>Forme juridique</Label><Input value={groupeData.formeJuridique} onChange={e => setGroupeData({...groupeData, formeJuridique: e.target.value})} placeholder="SA, SARL, SAS..." /></div>
                          <div><Label>RCCM</Label><Input value={groupeData.rccm} onChange={e => setGroupeData({...groupeData, rccm: e.target.value})} /></div>
                          <div><Label>CC / IFU</Label><Input value={groupeData.ccIfu} onChange={e => setGroupeData({...groupeData, ccIfu: e.target.value})} /></div>
                          <div><Label>Secteur d'activité</Label><Input value={groupeData.secteur} onChange={e => setGroupeData({...groupeData, secteur: e.target.value})} /></div>
                          <div className="sm:col-span-2"><Label>Adresse du siège</Label><Input value={groupeData.adresse} onChange={e => setGroupeData({...groupeData, adresse: e.target.value})} /></div>
                          <div><Label>Téléphone</Label><Input value={groupeData.telephone} onChange={e => setGroupeData({...groupeData, telephone: e.target.value})} /></div>
                          <div><Label>Email</Label><Input value={groupeData.emailGroupe} onChange={e => setGroupeData({...groupeData, emailGroupe: e.target.value})} /></div>
                          <div><Label>Effectif total</Label><Input type="number" value={groupeData.effectifTotal} onChange={e => setGroupeData({...groupeData, effectifTotal: e.target.value})} /></div>
                          <div><Label>Effectif à assurer</Label><Input type="number" value={groupeData.effectifAssure} onChange={e => setGroupeData({...groupeData, effectifAssure: e.target.value})} /></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">B) Représentant légal</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div><Label>Nom & Prénoms *</Label><Input value={groupeData.repLegalNom} onChange={e => setGroupeData({...groupeData, repLegalNom: e.target.value})} /></div>
                          <div><Label>Fonction</Label><Input value={groupeData.repLegalFonction} onChange={e => setGroupeData({...groupeData, repLegalFonction: e.target.value})} /></div>
                          <div><Label>Téléphone</Label><Input value={groupeData.repLegalTel} onChange={e => setGroupeData({...groupeData, repLegalTel: e.target.value})} /></div>
                          <div><Label>Email</Label><Input value={groupeData.repLegalEmail} onChange={e => setGroupeData({...groupeData, repLegalEmail: e.target.value})} /></div>
                          <div><Label>Type de pièce</Label><Input value={groupeData.repLegalPiece} onChange={e => setGroupeData({...groupeData, repLegalPiece: e.target.value})} placeholder="CNI / Passeport" /></div>
                          <div><Label>N° de pièce</Label><Input value={groupeData.repLegalNumPiece} onChange={e => setGroupeData({...groupeData, repLegalNumPiece: e.target.value})} /></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">C) Modalités d'adhésion</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Type d'adhésion</Label>
                            <Select value={groupeData.typeAdhesion} onValueChange={v => setGroupeData({...groupeData, typeAdhesion: v})}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Obligatoire">Obligatoire (tous les membres)</SelectItem>
                                <SelectItem value="Facultative">Facultative (sur base volontaire)</SelectItem>
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
                          <div><Label>Date souhaitée de prise d'effet</Label><DateInput value={groupeData.dateEffet} onChange={e => setGroupeData({...groupeData, dateEffet: e})} /></div>
                          <div>
                            <Label>Durée / renouvellement</Label>
                            <Select value={groupeData.duree} onValueChange={v => setGroupeData({...groupeData, duree: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="12">12 mois (annuel renouvelable)</SelectItem><SelectItem value="24">24 mois</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

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
                              <DateInput value={m.dob} onChange={e => { const n = [...groupeMembers]; n[i].dob = e; setGroupeMembers(n); }} />
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
                  <p className="text-sm text-muted-foreground">Paiement annuel — Mobile Money, virement bancaire ou espèces en agence. Prime annuelle : <strong className="text-primary">{simResult ? formatCFA(simResult.primeAnnuelle) : '—'}</strong></p>
                  {paymentDone ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 rounded-xl bg-secondary/10 border border-secondary/30 text-center">
                      <Check className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <p className="font-semibold text-secondary">Paiement enregistré !</p>
                      <p className="text-xs text-muted-foreground">Votre référence sera vérifiée par notre équipe. Passage à l'étape suivante…</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border-2 border-primary/30 p-4 sm:p-5 bg-accent/30 space-y-3">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-5 h-5 text-primary" />
                          <p className="font-semibold text-primary">Coordonnées bancaires SONAM VIE</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="bg-white rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Banque</p>
                            <p className="font-semibold">SGBCI – SONAM VIE</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">RIB / IBAN</p>
                            <p className="font-mono text-xs sm:text-sm">CI93 CI108 01001 1234567890 12</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Mobile Money (Wave / Orange / MTN / Moov)</p>
                            <p className="font-semibold">+225 27 20 31 71 82</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-border">
                            <p className="text-xs text-muted-foreground">Référence à indiquer</p>
                            <p className="font-semibold">AD-{(user?.id || '').slice(0, 8).toUpperCase() || 'XXXXXXXX'}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Après votre paiement, saisissez ci-dessous le numéro / référence de transaction. Notre équipe validera sous 24h ouvrées.</p>
                      </div>

                      <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
                        <Label>Méthode utilisée</Label>
                        <Select value={paymentMethod || ''} onValueChange={setPaymentMethod}>
                          <SelectTrigger><SelectValue placeholder="Choisir un mode de paiement" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="virement">Virement bancaire</SelectItem>
                            <SelectItem value="wave">Wave</SelectItem>
                            <SelectItem value="orange_money">Orange Money</SelectItem>
                            <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                            <SelectItem value="moov_money">Moov Money</SelectItem>
                            <SelectItem value="especes">Espèces (agence)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label>Référence / numéro de transaction</Label>
                        <Input value={paymentNumber} onChange={e => setPaymentNumber(e.target.value)} placeholder="Ex : TXN-987654 ou nom du titulaire" />
                        <Button
                          className="w-full gap-2"
                          disabled={!paymentMethod || !paymentNumber.trim() || !user || !simResult}
                          onClick={async () => {
                            if (!user || !simResult) return;
                            const ref = paymentNumber.trim();
                            const { error } = await supabase.from('paiements').insert({
                              user_id: user.id,
                              montant: simResult.primeAnnuelle,
                              methode: paymentMethod,
                              status: 'pending',
                              reference: ref,
                            });
                            if (error) {
                              toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
                              return;
                            }
                            await supabase.from('notifications').insert({
                              user_id: user.id,
                              title: 'Paiement déclaré',
                              message: `Référence ${ref} — ${formatCFA(simResult.primeAnnuelle)}. En attente de validation.`,
                              type: 'info',
                              link: '/client/paiements',
                            });
                            setPaymentDone(true);
                            toast({ title: 'Paiement enregistré ✓', description: `Référence : ${ref}. Validation sous 24h.` });
                            setTimeout(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1500);
                          }}
                        >
                          <Check className="w-4 h-4" /> Confirmer mon paiement
                        </Button>
                      </div>
                    </div>
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

              {/* Step 13: Signature & Reçu — NO OTP */}
              {step === 13 && (
                <div className="space-y-4">
                  {!signed ? (
                    <>
                      <p className="text-sm text-muted-foreground">Signez votre contrat ci-dessous pour finaliser votre souscription.</p>

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

                      <Button className="w-full gap-2" onClick={handleSign} disabled={!hasSignature}>
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
                      <p className="text-muted-foreground">Votre contrat AssurDignité a été créé. Téléchargez vos documents officiels ci-dessous.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto">
                        <Button onClick={generatePolicePDF} className="gap-2"><Download className="w-4 h-4" /> Police PDF</Button>
                        <Button onClick={generateAttestationPDF} variant="secondary" className="gap-2"><Download className="w-4 h-4" /> Attestation PDF</Button>
                        <Button onClick={generatePDF} variant="outline" className="gap-2"><Download className="w-4 h-4" /> Reçu PDF</Button>
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
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 py-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-0 sm:py-0 border-t border-border sm:border-0">
        <Button variant="outline" onClick={prev} disabled={step === 0} className="gap-2 w-full sm:w-auto"><ArrowLeft className="w-4 h-4" /> Précédent</Button>
        {step < STEPS.length - 1 && (
          <Button onClick={next} className="gap-2 w-full sm:w-auto" disabled={
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
