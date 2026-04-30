import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Ambulance, MessageCircle, Mail } from 'lucide-react';

export default function AssistancePage() {
  const tel = '+2250595452165';
  const telDisplay = '05 95 45 21 65';
  const tel2 = '+2252720317182';
  const tel2Display = '27 20 31 71 82';
  const wa = `https://wa.me/${tel.replace('+', '')}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Assistance 24/7</h1>
        <p className="text-muted-foreground">Notre équipe est à votre écoute à tout moment.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              Hotline SONAM VIE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <a href={`tel:${tel}`} className="block text-2xl font-bold text-primary hover:underline">{telDisplay}</a>
              <a href={`tel:${tel2}`} className="block text-lg font-semibold text-muted-foreground hover:text-primary hover:underline">{tel2Display}</a>
            </div>
            <p className="text-sm text-muted-foreground">Disponible 24h/24, 7j/7</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="w-full gap-2">
                <a href={`tel:${tel}`}><Phone className="w-4 h-4" /> Appeler maintenant</a>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2">
                <a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
              </Button>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full gap-2">
              <a href="mailto:servicecommercialsonamvie@sonam.ci"><Mail className="w-4 h-4" /> servicecommercialsonamvie@sonam.ci</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                <Ambulance className="w-4 h-4 text-secondary" />
              </div>
              Assistance funéraire
            </CardTitle>
          </CardHeader>
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
