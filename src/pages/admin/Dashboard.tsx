import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, CreditCard, AlertTriangle, TrendingUp, Shield, Clock, BarChart3 } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const COLORS = ['hsl(270, 80%, 30%)', 'hsl(100, 45%, 49%)', 'hsl(35, 90%, 55%)', 'hsl(215, 60%, 26%)'];

const portfolioData = [
  { month: 'Jan', polices: 2200 }, { month: 'Fév', polices: 2350 }, { month: 'Mar', polices: 2400 },
  { month: 'Avr', polices: 2500 }, { month: 'Mai', polices: 2650 }, { month: 'Jun', polices: 2847 },
];
const formulaData = [
  { name: 'Dignité Simple (A)', value: 35, color: COLORS[0] },
  { name: 'Serein (B)', value: 30, color: COLORS[1] },
  { name: 'Prestige (C)', value: 22, color: COLORS[2] },
  { name: 'Excellence (D)', value: 13, color: COLORS[3] },
];
const ageData = [
  { tranche: '18-30', sinistres: 3 }, { tranche: '31-40', sinistres: 5 }, { tranche: '41-50', sinistres: 8 },
  { tranche: '51-60', sinistres: 12 }, { tranche: '61-70', sinistres: 15 }, { tranche: '71+', sinistres: 7 },
];
const channelData = [
  { canal: 'Wave', montant: 45000000 }, { canal: 'Orange', montant: 32000000 },
  { canal: 'MTN', montant: 18000000 }, { canal: 'Moov', montant: 12000000 }, { canal: 'Virement', montant: 21500000 },
];

const KPI_COLORS = [
  'from-primary/15 to-primary/5',
  'from-secondary/15 to-secondary/5',
  'from-sonam-green/15 to-sonam-green/5',
  'from-sonam-gold/15 to-sonam-gold/5',
  'from-primary/10 to-accent/30',
  'from-secondary/10 to-accent/30',
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ contracts: 0, primes: 0, sinistres: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: contracts }, { data: primeData }, { count: sinistres }] = await Promise.all([
        supabase.from('contracts').select('*', { count: 'exact', head: true }),
        supabase.from('contracts').select('prime_annuelle'),
        supabase.from('sinistres').select('*', { count: 'exact', head: true }),
      ]);
      const totalPrimes = primeData?.reduce((s, c) => s + (c.prime_annuelle || 0), 0) || 0;
      setStats({ contracts: contracts || 0, primes: totalPrimes, sinistres: sinistres || 0 });
    };
    fetchStats();
  }, []);

  const kpis = [
    { label: 'Polices actives', value: stats.contracts > 0 ? stats.contracts.toLocaleString() : '2 847', icon: FileText, change: '+12%', color: 'text-primary' },
    { label: 'Primes émises (mois)', value: stats.primes > 0 ? formatCFA(stats.primes) : formatCFA(128500000), icon: CreditCard, change: '+8%', color: 'text-secondary' },
    { label: 'Taux de persistance', value: '94.2%', icon: TrendingUp, change: '+1.3%', color: 'text-sonam-green' },
    { label: 'Sinistres en cours', value: stats.sinistres > 0 ? String(stats.sinistres) : '23', icon: AlertTriangle, change: '-5', color: 'text-sonam-gold' },
    { label: 'Délai moyen paiement', value: '8.4h', icon: Clock, change: '-2.1h', color: 'text-primary' },
    { label: 'Bonus distribués', value: formatCFA(4200000), icon: Shield, change: '+15%', color: 'text-secondary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Tableau de bord Général</h1>
        <p className="text-muted-foreground">Back-office SONAM VIE – AssurDignité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className={`hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${KPI_COLORS[i]} border-0`}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-lg sm:text-xl font-bold mt-1 font-display">{kpi.value}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{kpi.change}</Badge>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center shadow-sm`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader><CardTitle className="font-display text-sm">Évolution du portefeuille</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="polices" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle className="font-display text-sm">Répartition par formule</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formulaData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${value}%`}>
                  {formulaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle className="font-display text-sm">Sinistralité par tranche d'âge</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tranche" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sinistres" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader><CardTitle className="font-display text-sm">Performance par canal de paiement</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="canal" width={60} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCFA(v)} />
                <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
