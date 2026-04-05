import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Save } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { useToast } from '@/hooks/use-toast';

const defaultCapitals = {
  A: { principal: 1500000, conjoint: 1500000, enfant: 500000, ascendant: 1050000 },
  B: { principal: 2000000, conjoint: 2000000, enfant: 500000, ascendant: 1400000 },
  C: { principal: 3000000, conjoint: 3000000, enfant: 500000, ascendant: 2100000 },
  D: { principal: 5000000, conjoint: 5000000, enfant: 500000, ascendant: 3500000 },
};

export default function AdminParametrage() {
  const [capitals, setCapitals] = useState(defaultCapitals);
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: 'Paramètres sauvegardés', description: 'Les capitaux par formule ont été mis à jour.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Paramétrage Produit</h1>
          <p className="text-muted-foreground">Configuration des capitaux et chargements par formule</p>
        </div>
        <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Sauvegarder</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(capitals).map(([key, cap]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Formule {key}
                <Badge variant="outline">{formatCFA(cap.principal)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(cap).map(([field, value]) => (
                <div key={field} className="flex items-center gap-4">
                  <Label className="w-28 text-sm capitalize">{field}</Label>
                  <Input type="number" value={value} onChange={e => {
                    const v = parseInt(e.target.value) || 0;
                    setCapitals(prev => ({ ...prev, [key]: { ...prev[key as keyof typeof prev], [field]: v } }));
                  }} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Chargements actuariels</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Chargement gestion (FC)</Label><Input value="0.002" disabled /></div>
          <div><Label>Chargement acquisition (FA)</Label><Input value="0.15" disabled /></div>
          <div><Label>Frais annuels</Label><Input value="2500" disabled /></div>
        </CardContent>
      </Card>
    </div>
  );
}
