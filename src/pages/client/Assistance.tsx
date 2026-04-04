import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, HeadphonesIcon, Ambulance } from 'lucide-react';

export default function AssistancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Assistance</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Hotline SONAM VIE</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold text-primary">27 20 31 71 82</p>
            <p className="text-xl font-bold text-primary">05 95 45 21 65</p>
            <p className="text-sm text-muted-foreground">Disponible 24h/24, 7j/7</p>
            <Button className="w-full gap-2"><Phone className="w-4 h-4" /> Appeler maintenant</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><Ambulance className="w-5 h-5 text-primary" /> Assistance funéraire</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Selon votre formule, bénéficiez de :</p>
            <ul className="space-y-2 text-sm">
              <li>• Cercueil extérieur de qualité</li>
              <li>• Conservation du corps</li>
              <li>• Transport funéraire</li>
              <li>• Aide à l'inhumation</li>
              <li>• Rapatriement (si option activée)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
