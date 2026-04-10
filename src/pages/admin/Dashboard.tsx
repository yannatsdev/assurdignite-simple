import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Users, CreditCard, AlertTriangle, TrendingUp, Shield, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['hsl(275, 82%, 27%)', 'hsl(93, 47%, 48%)', 'hsl(40, 80%, 55%)', 'hsl(215, 58%, 26%)'];

const portfolioData = [
  { month: 'Jan', polices: 2200 }, { month: 'Fév', polices: 2350 }, { month: 'Mar', polices: 2400 },
  { month: 'Avr', polices: 2500 }, { month: 'Mai', polices: 2650 }, { month: 'Jun', polices: 2847 },
];
const formulaData = [
  { name: 'Dignité Simple', value: 35, color: COLORS[0] },
  { name: 'Serein', value: 30, color: COLORS[1] },
  { name: 'Prestige', value: 22, color: COLORS[2] },
  { name: 'Excellence', value: 13, color: COLORS[3] },
];
const ageData = [
  { tranche: '18-30', sinistres: 3 }, { tranche: '31-40', sinistres: 5 }, { tranche: '41-50', sinistres: 8 },
  { tranche: '51-60', sinistres: 12 }, { tranche: '61-70', sinistres: 15 }, { tranche: '71+', sinistres: 7 },
];
const channelData = [
  { canal: 'Wave', montant: 45000000 }, { canal: 'Orange', montant: 32000000 },
  { canal: 'MTN', montant: 18000000 }, { canal: 'Moov', montant: 12000000 }, { canal: 'Virement', montant: 21500000 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ contracts: 0, primes: 0, sinistres: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: contracts }, { data: primeData }, { count: sinistres }, { count: users }] = await Promise.all([
        supabase.from('contracts').select('*', { count: 'exact', head: true }),
        supabase.from('contracts').select('prime_annuelle'),
        supabase.from('sinistres').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);
      const totalPrimes = primeData?.reduce((s, c) => s + (c.prime_annuelle || 0), 0) || 0;
      setStats({ contracts: contracts || 0, primes: totalPrimes, sinistres: sinistres || 0, users: users || 0 });
    };
    fetchStats();
  }, []);

  const kpis = [
    { label: 'Polices actives', value: stats.contracts > 0 ? stats.contracts.toLocaleString() : '2 847', icon: FileText, change: '+12%', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Primes émises', value: stats.primes > 0 ? formatCFA(stats.primes) : formatCFA(128500000), icon: CreditCard, change: '+8%', color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Taux de persistance', value: '94.2%', icon: TrendingUp, change: '+1.3%', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Sinistres en cours', value: stats.sinistres > 0 ? String(stats.sinistres) : '23', icon: AlertTriangle, change: '-5', color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Délai moyen paiement', value: '8.4h', icon: Clock, change: '-2.1h', color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Utilisateurs', value: stats.users > 0 ? String(stats.users) : '156', icon: Users, change: '+18', color: 'text-violet-600', bg: 'bg-violet-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Back-office SONAM VIE — AssurDignité</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/admin/contrats')} className="gap-1">
            <FileText className="w-4 h-4" /> Contrats
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/sinistres')} className="gap-1">
            <AlertTriangle className="w-4 h-4" /> Sinistres <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="hover:shadow-md transition-all border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <p className="text-sm sm:text-base font-bold mt-0.5 font-display">{kpi.value}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">{kpi.change}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-sm">Évolution du portefeuille</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="polices" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-sm">Répartition par formule</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formulaData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ value }) => `${value}%`} labelLine={false}>
                  {formulaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-sm">Sinistralité par tranche d'âge</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tranche" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sinistres" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="font-display text-sm">Performance par canal de paiement</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="canal" width={55} tick={{ fontSize: 11 }} />
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
