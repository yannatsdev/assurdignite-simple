import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { SimulateurSection } from '@/components/landing/SimulateurSection';

export default function SouscrirePage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Souscrire</h1>
        <p className="text-muted-foreground mt-1">Démarrez votre adhésion AssurDignité en quelques minutes.</p>
      </div>
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <CardContent className="p-8 sm:p-12 text-center space-y-4">
          <Shield className="w-12 h-12 mx-auto opacity-90" />
          <h2 className="text-xl sm:text-2xl font-bold font-display">Adhésion simplifiée en quelques étapes</h2>
          <p className="text-white/80 text-sm max-w-md mx-auto">Le calcul de votre prime se fait automatiquement à la première étape, en fonction de votre famille et de la formule choisie.</p>
          <Button size="lg" variant="secondary" className="gap-2" onClick={() => navigate('/client/adhesion')}>
            Commencer mon adhésion <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="-mx-4 sm:-mx-6">
        <SimulateurSection showActuarialBreakdown={false} />
      </div>
    </div>
  );
}
