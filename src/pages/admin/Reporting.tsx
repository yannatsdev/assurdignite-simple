import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCFA } from '@/lib/actuarial-engine';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const COLORS = ['hsl(270, 80%, 30%)', 'hsl(100, 45%, 49%)', 'hsl(35, 90%, 55%)', 'hsl(215, 60%, 26%)'];

export default function AdminReporting() {
  const [stats, setStats] = useState({ contracts: 0, primes: 0, sinistres: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('prime_annuelle'),
      supabase.from('sinistres').select('*', { count: 'exact', head: true }),
    ]).then(([c, p, s]) => {
      setStats({
        contracts: c.count || 0,
        primes: p.data?.reduce((sum, x) => sum + (x.prime_annuelle || 0), 0) || 0,
        sinistres: s.count || 0,
      });
    });
  }, []);

  const monthlyData = [
    { month: 'Jan', contrats: 45, primes: 12500000, sinistres: 2 },
    { month: 'Fév', contrats: 52, primes: 14200000, sinistres: 3 },
    { month: 'Mar', contrats: 61, primes: 16800000, sinistres: 1 },
    { month: 'Avr', contrats: 48, primes: 13100000, sinistres: 4 },
  ];

  const formulaData = [
    { name: 'A', value: 35 }, { name: 'B', value: 30 }, { name: 'C', value: 22 }, { name: 'D', value: 13 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Reporting & Statistiques</h1>
        <p className="text-muted-foreground">Tableaux de bord analytiques</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Contrats actifs</p><p className="text-2xl font-bold font-display">{stats.contracts || '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Primes totales</p><p className="text-2xl font-bold font-display">{stats.primes ? formatCFA(stats.primes) : '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Sinistres</p><p className="text-2xl font-bold font-display">{stats.sinistres || '—'}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-sm">Contrats par mois</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip />
                <Bar dataKey="contrats" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-sm">Répartition par formule</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formulaData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {formulaData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
