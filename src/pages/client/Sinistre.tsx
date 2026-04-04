import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Upload, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

const steps = ['Informations décès', 'Pièces justificatives', 'Coordonnées paiement', 'Confirmation'];

export default function SinistrePage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Sinistre Fast-Track</h1>
      <p className="text-muted-foreground">Déclarez un sinistre en moins de 5 minutes</p>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={i} className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {step}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {currentStep === 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Nom de l'assuré décédé</Label><Input placeholder="Nom complet" /></div>
                <div><Label>Date du décès</Label><Input type="date" /></div>
              </div>
              <div><Label>Lieu du décès</Label><Input placeholder="Ville, quartier" /></div>
              <div><Label>Circonstances</Label><Textarea placeholder="Décrivez brièvement les circonstances..." rows={3} /></div>
            </>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Veuillez fournir les documents suivants :</p>
              {['Acte de décès', 'Certificat médical', 'Pièce d\'identité de l\'assuré', 'Pièce d\'identité du bénéficiaire'].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-sm font-medium">{doc}</span>
                  <Button size="sm" variant="outline" className="gap-1"><Upload className="w-3 h-3" /> Charger</Button>
                </div>
              ))}
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div><Label>Nom du bénéficiaire</Label><Input placeholder="Nom complet" /></div>
              <div><Label>Méthode de paiement</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1"><span className="font-medium">Mobile Money</span><span className="text-xs text-muted-foreground">Wave, Orange, MTN, Moov</span></Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col gap-1"><span className="font-medium">Virement bancaire</span><span className="text-xs text-muted-foreground">Joindre le RIB</span></Button>
                </div>
              </div>
              <div><Label>Numéro Mobile Money / RIB</Label><Input placeholder="Numéro ou RIB" /></div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-16 h-16 text-secondary mx-auto" />
              <h3 className="text-xl font-bold font-display">Déclaration soumise</h3>
              <p className="text-muted-foreground">Votre dossier est en cours de traitement. Le capital espèces sera versé en moins de 12 heures.</p>
              <div className="bg-accent/50 rounded-xl p-4 max-w-sm mx-auto">
                <p className="text-sm">Référence : <span className="font-bold">SIN-2026-0042</span></p>
              </div>
            </div>
          )}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>Précédent</Button>
            <Button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))} disabled={currentStep === steps.length - 1}>
              {currentStep === steps.length - 2 ? 'Soumettre' : 'Suivant'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
