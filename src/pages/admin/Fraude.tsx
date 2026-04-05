import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

const alerts = [
  { type: 'warning', message: 'Sinistre SIN-2026-001 : même bénéficiaire déclaré sur 2 contrats différents', date: '04/04/2026' },
  { type: 'info', message: 'Vérification identité complétée pour contrat POL-AD-20260401-001', date: '03/04/2026' },
  { type: 'success', message: 'Audit mensuel terminé – aucune anomalie détectée', date: '01/04/2026' },
  { type: 'warning', message: 'Paiement MTN suspect : montant inhabituel de 5 000 000 FCFA', date: '31/03/2026' },
];

export default function AdminFraude() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Anti-fraude & Conformité</h1>
        <p className="text-muted-foreground">Journal d'audit et alertes de conformité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><ShieldAlert className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Alertes actives</p><p className="text-xl font-bold font-display">2</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><CheckCircle className="w-8 h-8 text-secondary" /><div><p className="text-xs text-muted-foreground">Cas résolus</p><p className="text-xl font-bold font-display">15</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Eye className="w-8 h-8 text-sonam-gold" /><div><p className="text-xs text-muted-foreground">En surveillance</p><p className="text-xl font-bold font-display">3</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-sm">Journal d'audit</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${a.type === 'warning' ? 'text-sonam-gold' : a.type === 'success' ? 'text-secondary' : 'text-primary'}`} />
              <div className="flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.date}</p>
              </div>
              <Badge variant="outline" className="text-xs">{a.type === 'warning' ? 'Alerte' : a.type === 'success' ? 'Résolu' : 'Info'}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
