import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCFA } from '@/lib/actuarial-engine';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { generateAdminReportPdf, exportAdminReportCsv } from '@/lib/admin-report';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--sonam-gold))', 'hsl(var(--sonam-blue))'];
const FORMULE_LABELS: Record<string, string> = { A: 'Formule A', B: 'Formule B', C: 'Formule C', D: 'Formule D' };

function monthKey(date: string) { return (date || '').slice(0, 7); }
function monthLabel(key: string) { return new Date(`${key}-01`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }); }
function lastMonths(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return d.toISOString().slice(0, 7);
  });
}

export default function AdminReporting() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [c, p, s] = await Promise.all([
      supabase.from('contracts').select('*').order('created_at', { ascending: true }),
      supabase.from('paiements').select('*').order('date_paiement', { ascending: true }),
      supabase.from('sinistres').select('*').order('created_at', { ascending: true }),
    ]);
    setContracts(c.data || []); setPaiements(p.data || []); setSinistres(s.data || []); setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel('admin-reporting-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sinistres' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const data = useMemo(() => {
    const months = lastMonths(12);
    const monthlyData = months.map(k => ({ month: monthLabel(k), contrats: 0, primes: 0, sinistres: 0 }));
    contracts.forEach(c => { const idx = months.indexOf(monthKey(c.created_at)); if (idx >= 0) monthlyData[idx].contrats += 1; });
    paiements.filter(p => p.status === 'paid').forEach(p => { const idx = months.indexOf(monthKey(p.date_paiement)); if (idx >= 0) monthlyData[idx].primes += p.montant || 0; });
    sinistres.forEach(s => { const idx = months.indexOf(monthKey(s.created_at)); if (idx >= 0) monthlyData[idx].sinistres += 1; });

    const fmap: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    contracts.forEach(c => { if (c.formule) fmap[c.formule] = (fmap[c.formule] || 0) + 1; });
    const formulaData = Object.entries(fmap).filter(([, value]) => value > 0).map(([k, value], i) => ({ name: FORMULE_LABELS[k] || k, value, color: COLORS[i % COLORS.length] }));

    const paid = paiements.filter(p => p.status === 'paid');
    const pending = paiements.filter(p => p.status === 'pending');
    const failed = paiements.filter(p => p.status === 'failed');
    const stats = {
      contracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'active').length,
      primes: paid.reduce((sum, p) => sum + (p.montant || 0), 0),
      paid: paid.length,
      pending: pending.length,
      sinistres: sinistres.length,
    };
    const paymentsByStatus = ['paid', 'pending', 'failed'].map(status => ({ status, count: paiements.filter(p => p.status === status).length, amount: paiements.filter(p => p.status === status).reduce((sum, p) => sum + (p.montant || 0), 0) }));
    return { monthlyData, formulaData, stats, paymentsByStatus };
  }, [contracts, paiements, sinistres]);

  const handlePdf = () => { generateAdminReportPdf(data); toast.success('Rapport PDF généré'); };
  const handleCsv = () => { exportAdminReportCsv(data); toast.success('Export CSV généré'); };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Reporting & Statistiques</h1>
          <p className="text-muted-foreground">Tableaux de bord analytiques live, sans données fictives</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleCsv} className="gap-2"><FileDown className="w-4 h-4" /> CSV</Button>
          <Button onClick={handlePdf} className="gap-2"><Download className="w-4 h-4" /> Générer rapport PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Contrats actifs</p><p className="text-2xl font-bold font-display">{data.stats.activeContracts}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Primes encaissées</p><p className="text-2xl font-bold font-display">{formatCFA(data.stats.primes)}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground">Sinistres déclarés</p><p className="text-2xl font-bold font-display">{data.stats.sinistres}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-sm">Contrats par mois</CardTitle></CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [v, 'Contrats']} />
                <Bar dataKey="contrats" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-sm">Répartition réelle par formule</CardTitle></CardHeader>
          <CardContent className="h-72 min-w-0">
            {data.formulaData.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée de formule</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.formulaData} cx="50%" cy="50%" innerRadius={48} outerRadius={88} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {data.formulaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="font-display text-sm">Primes encaissées par mois</CardTitle></CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatCFA(Number(v))} />
                <Area type="monotone" dataKey="primes" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.18)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
