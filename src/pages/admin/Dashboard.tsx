import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Users, CreditCard, AlertTriangle, TrendingUp, Clock, ArrowRight, Activity, Zap, AlertCircle } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { BrandShowcaseMarquee } from '@/components/landing/BrandShowcaseMarquee';

const COLORS = ['hsl(275, 82%, 27%)', 'hsl(93, 47%, 48%)', 'hsl(40, 80%, 55%)', 'hsl(215, 58%, 26%)'];

const FORMULE_LABELS: Record<string, string> = { A: 'Dignité Simple', B: 'Serein', C: 'Prestige', D: 'Excellence' };

function buildPortfolio(contracts: any[]) {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    map.set(d.toISOString().slice(0, 7), 0);
  }
  contracts.forEach(c => {
    const k = (c.created_at || '').slice(0, 7);
    if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).map(([k, v]) => ({ month: new Date(k + '-01').toLocaleDateString('fr-FR', { month: 'short' }), polices: v }));
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ contracts: 0, primes: 0, sinistres: 0, users: 0, paid: 0, pending: 0 });
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [formulaData, setFormulaData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [pendingSinistres, setPendingSinistres] = useState<any[]>([]);
  const [livePresence, setLivePresence] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      const [
        { data: contracts },
        { count: usersCount },
        { data: sinistres },
        { data: paiements },
      ] = await Promise.all([
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sinistres').select('*').order('created_at', { ascending: false }),
        supabase.from('paiements').select('*'),
      ]);

      const c = contracts || [];
      const s = sinistres || [];
      const p = paiements || [];
      const totalPrimes = p.filter(x => x.status === 'paid').reduce((sum, x) => sum + (x.montant || 0), 0);
      const pendingPay = p.filter(x => x.status !== 'paid').length;

      setStats({
        contracts: c.filter(x => x.status === 'active').length,
        primes: totalPrimes,
        sinistres: s.filter(x => x.status !== 'paid').length,
        users: usersCount || 0,
        paid: p.filter(x => x.status === 'paid').length,
        pending: pendingPay,
      });
      setPortfolioData(buildPortfolio(c));

      const fmap: Record<string, number> = {};
      c.forEach(x => { fmap[x.formule] = (fmap[x.formule] || 0) + 1; });
      const fdata = Object.entries(fmap).map(([k, v], i) => ({ name: FORMULE_LABELS[k] || k, value: v, color: COLORS[i % COLORS.length] }));
      setFormulaData(fdata);

      const chmap: Record<string, number> = {};
      p.filter(x => x.status === 'paid').forEach(x => {
        const k = (x.methode || 'autre').toLowerCase();
        chmap[k] = (chmap[k] || 0) + (x.montant || 0);
      });
      setChannelData(Object.entries(chmap).map(([canal, montant]) => ({ canal, montant })));

      setRecentContracts(c.slice(0, 5));
      setPendingSinistres(s.filter(x => x.status !== 'paid').slice(0, 5));
    };
    fetchAll();
    const channel = supabase.channel('admin-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sinistres' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements' }, () => fetchAll())
      .subscribe();
    const presence = supabase.channel('client-presence', { config: { presence: { key: 'admin-watcher' } } });
    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        setLivePresence(Object.keys(state).length);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); supabase.removeChannel(presence); };
  }, []);

  const kpis = [
    { label: 'Polices actives', value: stats.contracts.toLocaleString('fr-FR'), icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Primes encaissées', value: formatCFA(stats.primes), icon: CreditCard, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Paiements payés', value: stats.paid.toString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Sinistres en cours', value: stats.sinistres.toString(), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'En ligne maintenant', value: livePresence.toString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Utilisateurs', value: stats.users.toString(), icon: Users, color: 'text-violet-600', bg: 'bg-violet-100' },
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
      <BrandShowcaseMarquee variant="compact" speed={55} />

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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className={`border-l-4 ${stats.sinistres > 0 ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-emerald-500 bg-emerald-50/30'}`}>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.sinistres > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <AlertCircle className={`w-5 h-5 ${stats.sinistres > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Sinistres à traiter</p>
              <p className="font-bold text-sm">{stats.sinistres > 0 ? `${stats.sinistres} en attente` : 'Tout est à jour ✓'}</p>
            </div>
            {stats.sinistres > 0 && <Button size="sm" variant="outline" onClick={() => navigate('/admin/sinistres')}>Ouvrir</Button>}
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${stats.pending > 0 ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-emerald-500 bg-emerald-50/30'}`}>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.pending > 0 ? 'bg-orange-100' : 'bg-emerald-100'}`}>
              <Clock className={`w-5 h-5 ${stats.pending > 0 ? 'text-orange-600' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Paiements en attente</p>
              <p className="font-bold text-sm">{stats.pending}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/finances')}>Voir</Button>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Rapport mensuel</p>
              <p className="font-bold text-sm">Export PDF disponible</p>
            </div>
            <Button size="sm" onClick={() => navigate('/admin/reporting')}>Générer</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent contracts + sinistres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-sm">Derniers contrats</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate('/admin/contrats')}>Voir tout →</Button>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun contrat encore.</p>
            ) : (
              <div className="space-y-2">
                {recentContracts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="text-sm font-medium">{c.principal_name || 'Sans nom'}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{c.police_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCFA(c.prime_annuelle)}</p>
                      <Badge variant="outline" className="text-[10px]">{FORMULE_LABELS[c.formule] || c.formule}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-sm">Sinistres en cours</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate('/admin/sinistres')}>Voir tout →</Button>
          </CardHeader>
          <CardContent>
            {pendingSinistres.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun sinistre en attente ✓</p>
            ) : (
              <div className="space-y-2">
                {pendingSinistres.map((s, i) => (
                  <div key={i} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="text-sm font-medium">{s.nom_decede}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{s.reference}</p>
                    </div>
                    <Badge className="text-[10px]" variant={s.status === 'declared' ? 'secondary' : 'default'}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
          <CardHeader className="pb-2"><CardTitle className="font-display text-sm">Performance par canal de paiement</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            {channelData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucun paiement encore enregistré</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <YAxis type="category" dataKey="canal" width={55} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCFA(v)} />
                <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
