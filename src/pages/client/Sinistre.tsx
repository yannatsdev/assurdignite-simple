import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle, FileCheck2, Loader2, X, Clock, Phone, MessageCircle, Building2, Smartphone, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ClientHeroBanner } from '@/components/client/ClientHeroBanner';
import fastPayout from '@/assets/banners/fast-payout.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import waveLogo from '@/assets/wave.svg';
import orangeLogo from '@/assets/orange.svg';
import mtnLogo from '@/assets/mtn.svg';
import moovLogo from '@/assets/moov.svg';

const steps = ['Informations décès', 'Pièces justificatives', 'Coordonnées paiement', 'Confirmation'];
const docTypes = [
  { key: 'acte_deces', label: 'Acte de décès', required: true },
  { key: 'certif_medical', label: 'Certificat médical', required: true },
  { key: 'cni_assure', label: "Pièce d'identité de l'assuré", required: true },
  { key: 'cni_benef', label: "Pièce d'identité du bénéficiaire", required: true },
];

type UploadState = { uploading: boolean; path?: string; error?: string; fileName?: string };

export default function SinistrePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nom_decede: '', date_deces: '', lieu_deces: '', circonstances: '', beneficiaire_nom: '', methode_paiement: '', numero_paiement: '' });
  const [reference, setReference] = useState('');
  const [sinistreId, setSinistreId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Create the sinistre on entering step 1 to enable uploads
  const ensureSinistre = async (): Promise<string | null> => {
    if (sinistreId) return sinistreId;
    if (!user) return null;
    const ref = `SIN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const { data, error } = await supabase.from('sinistres').insert({
      user_id: user.id,
      reference: ref,
      nom_decede: form.nom_decede,
      date_deces: form.date_deces || null,
      lieu_deces: form.lieu_deces,
      circonstances: form.circonstances,
      status: 'declared',
    }).select().single();
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return null;
    }
    setReference(ref);
    setSinistreId(data.id);
    return data.id;
  };

  const handleNextFromInfos = async () => {
    if (!form.nom_decede.trim()) {
      toast({ title: 'Champ requis', description: 'Indiquez le nom du défunt.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const id = await ensureSinistre();
    setSubmitting(false);
    if (id) setCurrentStep(1);
  };

  const handleFile = async (docKey: string, file: File) => {
    if (!user || !sinistreId) return;
    setUploads(p => ({ ...p, [docKey]: { uploading: true, fileName: file.name } }));
    try {
      const ext = file.name.split('.').pop();
      const path = `sinistres/${user.id}/${sinistreId}/${docKey}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('kyc-documents').upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      // Append to sinistre.documents_urls
      const { data: current } = await supabase.from('sinistres').select('documents_urls').eq('id', sinistreId).single();
      const existing: string[] = (current?.documents_urls as any) || [];
      const next = [...existing.filter(u => !u.includes(`/${docKey}-`)), path];
      await supabase.from('sinistres').update({ documents_urls: next, updated_at: new Date().toISOString() }).eq('id', sinistreId);

      setUploads(p => ({ ...p, [docKey]: { uploading: false, path, fileName: file.name } }));
      toast({ title: 'Pièce ajoutée', description: file.name });
    } catch (e: any) {
      setUploads(p => ({ ...p, [docKey]: { uploading: false, error: e.message } }));
      toast({ title: 'Erreur upload', description: e.message, variant: 'destructive' });
    }
  };

  const handleFinalSubmit = async () => {
    if (!sinistreId) return;
    setSubmitting(true);
    const { error } = await supabase.from('sinistres').update({
      beneficiaire_nom: form.beneficiaire_nom,
      methode_paiement: form.methode_paiement,
      numero_paiement: form.numero_paiement,
      updated_at: new Date().toISOString(),
    }).eq('id', sinistreId);
    setSubmitting(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setCurrentStep(3);
    toast({ title: 'Sinistre déclaré', description: `Référence : ${reference}` });
  };

  const paymentLogos = [
    { name: 'Wave', logo: waveLogo },
    { name: 'Orange', logo: orangeLogo },
    { name: 'MTN', logo: mtnLogo },
    { name: 'Moov', logo: moovLogo },
  ];

  const allRequiredUploaded = docTypes.filter(d => d.required).every(d => uploads[d.key]?.path);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ClientHeroBanner
        image={fastPayout}
        title="Sinistre Fast-Track"
        subtitle="Déclarez un sinistre en moins de 5 minutes — délai contractuel maximal 15 jours ouvrés, objectif interne quelques heures."
        height="h-52 sm:h-60"
        cta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/95 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white shadow">
            <Clock className="w-3.5 h-3.5" /> Max 15 j ouvrés
          </span>
        }
      />

      {/* Official process panel — SLA & canaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/40">
          <CardContent className="pt-5">
            <h3 className="font-bold font-display text-base mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-secondary" /> Le processus officiel AssurDignité — 8 étapes
            </h3>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {[
                'Déclaration initiale (24/24)',
                'Pré-validation du dossier',
                'Activation immédiate de l\'assistance (< 1h)',
                'Constitution du dossier (pièces)',
                'Validation technique SONAM Vie',
                'Versement cash MoMo (objectif interne quelques heures)',
                'Exécution prestations nature (70%)',
                'Clôture & archivage',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex w-5 h-5 shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold items-center justify-center">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-secondary/10 text-secondary rounded-lg p-2 text-center font-semibold">Prise en charge &lt; 1h</div>
              <div className="bg-primary/10 text-primary rounded-lg p-2 text-center font-semibold">Max 15 j ouvrés</div>
              <div className="bg-[hsl(var(--sonam-blue))]/10 text-[hsl(var(--sonam-blue))] rounded-lg p-2 text-center font-semibold">Logistique 2–4h</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="pt-5">
            <h3 className="font-bold font-display text-base mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Canaux de déclaration
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-primary" /> Application — 24h/24</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> Hotline dédiée — 24h/24</li>
              <li className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-primary" /> Agence SONAM (heures ouvrables)</li>
              <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-primary" /> Réseau commercial</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-primary" /> WhatsApp dédié</li>
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              📞 +225 27 20 31 71 82 / 05 95 45 21 65<br />
              ✉️ servicecommercialsonamvie@sonam.ci
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="relative px-2">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0" />
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary -z-0"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="relative grid grid-cols-4 gap-1">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{ scale: i === currentStep ? 1.1 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                  i < currentStep
                    ? 'bg-secondary border-secondary text-white'
                    : i === currentStep
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-background border-muted text-muted-foreground'
                }`}
              >
                {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </motion.div>
              <span
                className={`text-[10px] sm:text-xs text-center leading-tight font-medium ${
                  i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nom de l'assuré décédé</Label><Input value={form.nom_decede} onChange={e => setForm({ ...form, nom_decede: e.target.value })} placeholder="Nom complet" /></div>
                <div><Label>Date du décès</Label><DateInput value={form.date_deces} onChange={e => setForm({ ...form, date_deces: e })} /></div>
              </div>
              <div><Label>Lieu du décès</Label><Input value={form.lieu_deces} onChange={e => setForm({ ...form, lieu_deces: e.target.value })} placeholder="Ville, quartier" /></div>
              <div><Label>Circonstances</Label><Textarea value={form.circonstances} onChange={e => setForm({ ...form, circonstances: e.target.value })} placeholder="Décrivez brièvement..." rows={3} /></div>
            </>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Téléchargez les documents requis (PDF ou image, max 10 Mo).</p>
              {docTypes.map((doc) => {
                const st = uploads[doc.key];
                return (
                  <motion.div
                    key={doc.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border border-border/60 rounded-xl bg-card hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${st?.path ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {st?.path ? <FileCheck2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.label}</p>
                        {st?.fileName && <p className="text-xs text-muted-foreground truncate">{st.fileName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {st?.uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {st?.path && (
                        <button
                          onClick={() => setUploads(p => ({ ...p, [doc.key]: {} as UploadState }))}
                          className="p-1 rounded hover:bg-muted"
                          title="Remplacer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <input
                        ref={el => (fileInputs.current[doc.key] = el)}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(doc.key, f);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        size="sm"
                        variant={st?.path ? 'outline' : 'default'}
                        className="gap-1"
                        disabled={st?.uploading}
                        onClick={() => fileInputs.current[doc.key]?.click()}
                      >
                        <Upload className="w-3 h-3" /> {st?.path ? 'Changer' : 'Charger'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              {!allRequiredUploaded && (
                <p className="text-xs text-amber-600">⚠ Tous les documents requis doivent être téléchargés.</p>
              )}
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div><Label>Nom du bénéficiaire</Label><Input value={form.beneficiaire_nom} onChange={e => setForm({ ...form, beneficiaire_nom: e.target.value })} /></div>
              <div>
                <Label>Mode de paiement</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {paymentLogos.map(m => (
                    <button key={m.name} onClick={() => setForm({ ...form, methode_paiement: m.name.toLowerCase() })}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${form.methode_paiement === m.name.toLowerCase() ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}>
                      <img src={m.logo} alt={m.name} className="h-6 w-auto" />
                      <span className="text-xs">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div><Label>Numéro Mobile Money / RIB</Label><Input value={form.numero_paiement} onChange={e => setForm({ ...form, numero_paiement: e.target.value })} /></div>
            </div>
          )}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-5">
              <div className="w-20 h-20 rounded-full bg-secondary/15 flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold font-display">Déclaration soumise</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Votre dossier est en cours de traitement. Le capital espèces sera versé en moins de 12 heures.</p>

              {/* Résumé du dossier */}
              <div className="text-left max-w-md mx-auto bg-accent/40 rounded-2xl p-5 space-y-2 text-sm">
                <p className="font-semibold font-display text-base mb-2">Résumé du dossier</p>
                <div className="grid grid-cols-[120px_1fr] gap-y-1.5">
                  <span className="text-muted-foreground">Référence</span><span className="font-mono">{reference}</span>
                  <span className="text-muted-foreground">Décédé</span><span>{form.nom_decede}</span>
                  {form.date_deces && (<><span className="text-muted-foreground">Date</span><span>{form.date_deces}</span></>)}
                  {form.lieu_deces && (<><span className="text-muted-foreground">Lieu</span><span>{form.lieu_deces}</span></>)}
                  <span className="text-muted-foreground">Bénéficiaire</span><span>{form.beneficiaire_nom || '—'}</span>
                  <span className="text-muted-foreground">Paiement</span><span className="capitalize">{form.methode_paiement} • {form.numero_paiement}</span>
                  <span className="text-muted-foreground">Pièces</span><span>{Object.values(uploads).filter(u => u.path).length} / {docTypes.length}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 max-w-sm mx-auto text-left">
                <p className="text-xs font-semibold text-primary mb-1">⏱ Délai estimé</p>
                <p className="text-sm">Validation sous 2h • Versement sous <strong>12h</strong> après acceptation.</p>
              </div>

              {sinistreId && (
                <Button onClick={() => window.location.href = `/client/sinistre/${sinistreId}`} variant="outline" className="gap-2">
                  Suivre mon dossier
                </Button>
              )}
            </motion.div>
          )}
          {currentStep < 3 && (
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0 || submitting}>Précédent</Button>
              <Button
                onClick={() => {
                  if (currentStep === 0) handleNextFromInfos();
                  else if (currentStep === 1) {
                    if (!allRequiredUploaded) { toast({ title: 'Documents manquants', description: 'Veuillez charger tous les documents requis.', variant: 'destructive' }); return; }
                    setCurrentStep(2);
                  } else if (currentStep === 2) handleFinalSubmit();
                }}
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {currentStep === 2 ? 'Soumettre' : 'Suivant'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
