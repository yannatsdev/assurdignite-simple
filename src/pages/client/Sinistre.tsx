import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle, FileCheck2, Loader2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Sinistre Fast-Track</h1>
        <p className="text-muted-foreground">Déclarez un sinistre en moins de 5 minutes</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {steps.map((step, i) => (
          <div key={i} className={`text-center py-2.5 rounded-xl text-xs font-medium transition-all ${i <= currentStep ? 'bg-gradient-to-br from-primary to-[hsl(var(--sonam-blue))] text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
            {step}
          </div>
        ))}
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
