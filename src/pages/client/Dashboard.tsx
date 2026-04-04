import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard, AlertTriangle, Download, Shield, Gift, Users } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Bienvenue dans votre espace AssurDignité</p>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Statut du contrat</p>
                <Badge className="mt-2 bg-secondary">Actif</Badge>
                <p className="text-xs text-muted-foreground mt-2">Police N° AD-2026-001234</p>
              </div>
              <Shield className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Prochaine échéance</p>
                <p className="text-2xl font-bold mt-1 font-display">{formatCFA(45000)}</p>
                <p className="text-xs text-muted-foreground mt-1">Échéance : 15 juin 2026</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sonam-gold">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Bonus Fidélité-Santé 30%</p>
                <p className="text-2xl font-bold mt-1 font-display">{formatCFA(13500)}</p>
                <p className="text-xs text-muted-foreground mt-1">Éligible le 15 juin 2029</p>
              </div>
              <Gift className="w-8 h-8 text-sonam-gold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recap */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Récapitulatif de couverture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-accent/50 rounded-xl">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold font-display">4</p>
              <p className="text-sm text-muted-foreground">Personnes couvertes</p>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-xl">
              <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold font-display">{formatCFA(2000000)}</p>
              <p className="text-sm text-muted-foreground">Capital total</p>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-xl">
              <FileText className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold font-display">Formule B</p>
              <p className="text-sm text-muted-foreground">Serein</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button className="h-auto py-4 flex flex-col gap-2" variant="outline" asChild>
          <a href="/client/paiements"><CreditCard className="w-5 h-5" /> Payer ma prime</a>
        </Button>
        <Button className="h-auto py-4 flex flex-col gap-2" variant="outline" asChild>
          <a href="/client/sinistre"><AlertTriangle className="w-5 h-5" /> Déclarer un sinistre</a>
        </Button>
        <Button className="h-auto py-4 flex flex-col gap-2" variant="outline" asChild>
          <a href="/client/documents"><Download className="w-5 h-5" /> Télécharger attestation</a>
        </Button>
      </div>
    </div>
  );
}
