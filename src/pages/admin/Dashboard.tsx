import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CreditCard, AlertTriangle, TrendingUp, Shield, Clock, BarChart3 } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';

const kpis = [
  { label: 'Polices actives', value: '2 847', icon: FileText, change: '+12%', color: 'text-primary' },
  { label: 'Primes émises (mois)', value: formatCFA(128500000), icon: CreditCard, change: '+8%', color: 'text-secondary' },
  { label: 'Taux de persistance', value: '94.2%', icon: TrendingUp, change: '+1.3%', color: 'text-sonam-green' },
  { label: 'Sinistres en cours', value: '23', icon: AlertTriangle, change: '-5', color: 'text-sonam-gold' },
  { label: 'Délai moyen paiement', value: '8.4h', icon: Clock, change: '-2.1h', color: 'text-primary' },
  { label: 'Bonus distribués', value: formatCFA(4200000), icon: Shield, change: '+15%', color: 'text-secondary' },
];

const alerts = [
  { type: 'danger', text: '3 impayés > 5 jours', icon: CreditCard },
  { type: 'warning', text: '2 sinistres non traités depuis 24h', icon: AlertTriangle },
  { type: 'info', text: '1 anomalie détectée (questionnaire médical)', icon: Shield },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Tableau de bord Général</h1>
        <p className="text-muted-foreground">Back-office SONAM VIE – AssurDignité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1 font-display">{kpi.value}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{kpi.change}</Badge>
                </div>
                <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader><CardTitle className="font-display">Alertes prioritaires</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${a.type === 'danger' ? 'bg-destructive/10' : a.type === 'warning' ? 'bg-sonam-gold/10' : 'bg-accent'}`}>
              <a.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{a.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Placeholder for charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display">Évolution du portefeuille</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Graphiques Recharts à connecter aux données</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display">Répartition par formule</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Graphiques Recharts à connecter aux données</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
