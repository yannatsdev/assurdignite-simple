import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import waveLogo from '@/assets/wave.svg';
import orangeLogo from '@/assets/orange.svg';
import mtnLogo from '@/assets/mtn.svg';
import moovLogo from '@/assets/moov.svg';

const steps = ['Informations décès', 'Pièces justificatives', 'Coordonnées paiement', 'Confirmation'];

export default function SinistrePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({ nom_decede: '', date_deces: '', lieu_deces: '', circonstances: '', beneficiaire_nom: '', methode_paiement: '', numero_paiement: '' });
  const [reference, setReference] = useState('');

  const handleSubmit = async () => {
    if (!user) return;
    const ref = `SIN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const { error } = await supabase.from('sinistres').insert({
      user_id: user.id,
      reference: ref,
      nom_decede: form.nom_decede,
      date_deces: form.date_deces || null,
      lieu_deces: form.lieu_deces,
      circonstances: form.circonstances,
      beneficiaire_nom: form.beneficiaire_nom,
      methode_paiement: form.methode_paiement,
      numero_paiement: form.numero_paiement,
    });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setReference(ref);
    setCurrentStep(3);
    toast({ title: 'Sinistre déclaré', description: `Référence : ${ref}` });
  };

  const paymentLogos = [
    { name: 'Wave', logo: waveLogo },
    { name: 'Orange', logo: orangeLogo },
    { name: 'MTN', logo: mtnLogo },
    { name: 'Moov', logo: moovLogo },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">Sinistre Fast-Track</h1>
      <p className="text-muted-foreground">Déclarez un sinistre en moins de 5 minutes</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={i} className={`text-center py-2 rounded-lg text-xs font-medium transition-all ${i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {step}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nom de l'assuré décédé</Label><Input value={form.nom_decede} onChange={e => setForm({ ...form, nom_decede: e.target.value })} placeholder="Nom complet" /></div>
                <div><Label>Date du décès</Label><Input type="date" value={form.date_deces} onChange={e => setForm({ ...form, date_deces: e.target.value })} /></div>
              </div>
              <div><Label>Lieu du décès</Label><Input value={form.lieu_deces} onChange={e => setForm({ ...form, lieu_deces: e.target.value })} placeholder="Ville, quartier" /></div>
              <div><Label>Circonstances</Label><Textarea value={form.circonstances} onChange={e => setForm({ ...form, circonstances: e.target.value })} placeholder="Décrivez brièvement..." rows={3} /></div>
            </>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Veuillez fournir les documents suivants :</p>
              {['Acte de décès', 'Certificat médical', "Pièce d'identité de l'assuré", "Pièce d'identité du bénéficiaire"].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-sm font-medium">{doc}</span>
                  <Button size="sm" variant="outline" className="gap-1"><Upload className="w-3 h-3" /> Charger</Button>
                </div>
              ))}
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
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${form.methode_paiement === m.name.toLowerCase() ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
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
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-16 h-16 text-secondary mx-auto" />
              <h3 className="text-xl font-bold font-display">Déclaration soumise</h3>
              <p className="text-muted-foreground">Votre dossier est en cours de traitement. Le capital espèces sera versé en moins de 12 heures.</p>
              <div className="bg-accent/50 rounded-xl p-4 max-w-sm mx-auto">
                <p className="text-sm">Référence : <span className="font-bold">{reference}</span></p>
              </div>
            </div>
          )}
          {currentStep < 3 && (
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>Précédent</Button>
              <Button onClick={() => currentStep === 2 ? handleSubmit() : setCurrentStep(currentStep + 1)}>
                {currentStep === 2 ? 'Soumettre' : 'Suivant'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
