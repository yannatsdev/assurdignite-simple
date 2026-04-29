import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, CheckCircle, Eye, Loader2, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const COLORS = ['hsl(0, 75%, 55%)', 'hsl(40, 80%, 55%)', 'hsl(93, 47%, 48%)'];

type Alert = { id: string; type: 'warning' | 'info' | 'success'; message: string; date: Date; user_id?: string | null; category?: string };

function detectAlerts(_contracts: any[], sinistres: any[], paiements: any[]): Alert[] {
  const alerts: Alert[] = [];
  const benefMap = new Map<string, string[]>();
  sinistres.forEach((s) => {
    if (!s.beneficiaire_nom) return;
    const key = s.beneficiaire_nom.toLowerCase().trim();
    if (!benefMap.has(key)) benefMap.set(key, []);
    benefMap.get(key)!.push(s.reference);
  });
  benefMap.forEach((refs, name) => {
    if (refs.length > 1) {
      alerts.push({
        id: `dup-${name}`,
        type: 'warning',
        message: `Bénéficiaire "${name}" déclaré sur ${refs.length} sinistres : ${refs.join(', ')}`,
        date: new Date(),
        category: 'duplicate_beneficiary',
      });
    }
  });
  paiements.filter((p) => p.montant > 1_000_000 && p.status === 'paid').forEach((p) => {
    alerts.push({
      id: `pay-${p.id}`,
      type: 'warning',
      message: `Paiement élevé détecté : ${p.montant.toLocaleString('fr-FR')} FCFA via ${p.methode || 'N/A'} (réf ${p.reference || p.id.slice(0, 8)})`,
      date: new Date(p.date_paiement || Date.now()),
      user_id: p.user_id,
      category: 'high_payment',
    });
  });
  paiements.filter((p) => p.status === 'failed').slice(0, 5).forEach((p) => {
    alerts.push({
      id: `fail-${p.id}`,
      type: 'info',
      message: `Paiement en échec à investiguer : ${p.montant.toLocaleString('fr-FR')} FCFA`,
      date: new Date(p.date_paiement || Date.now()),
      user_id: p.user_id,
      category: 'failed_payment',
    });
  });
  sinistres.filter((s) => s.status !== 'paid' && s.status !== 'rejected').forEach((s) => {
    const days = (Date.now() - new Date(s.created_at).getTime()) / 86400000;
    if (days > 7) {
      alerts.push({
        id: `stale-${s.id}`,
        type: 'warning',
        message: `Sinistre ${s.reference} en attente depuis ${Math.floor(days)} jours sans traitement`,
        date: new Date(s.created_at),
        user_id: s.user_id,
        category: 'stale_claim',
      });
    }
  });
  return alerts;
}

function buildMonthly(alerts: Alert[]) {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    map.set(d.toLocaleDateString('fr-FR', { month: 'short' }), 0);
  }
  alerts.forEach((a) => {
    const k = a.date.toLocaleDateString('fr-FR', { month: 'short' });
    if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).map(([month, count]) => ({ month, count }));
}

export default function AdminFraude() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({ active: 0, resolved: 0, watching: 0 });
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; email: string }>>({});
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'warning' | 'info' | 'success'>('all');
  const [filterUser, setFilterUser] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [{ data: contracts }, { data: sinistres }, { data: paiements }, { data: profilesData }] = await Promise.all([
        supabase.from('contracts').select('*'),
        supabase.from('sinistres').select('*'),
        supabase.from('paiements').select('*'),
        supabase.from('profiles').select('id, full_name, email'),
      ]);
      if (cancelled) return;
      const detected = detectAlerts(contracts || [], sinistres || [], paiements || []);
      const resolved = (sinistres || []).filter((s: any) => s.status === 'paid' || s.status === 'rejected').length;
      const watching = (sinistres || []).filter((s: any) => s.status === 'investigating' || s.status === 'pending_review').length;
      const pmap: Record<string, { full_name: string | null; email: string }> = {};
      (profilesData || []).forEach((p: any) => { pmap[p.id] = { full_name: p.full_name, email: p.email }; });
      setProfiles(pmap);
      setAlerts(detected);
      setStats({ active: detected.filter((a) => a.type === 'warning').length, resolved, watching });
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel('fraude-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sinistres' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements' }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterUser !== 'all' && a.user_id !== filterUser) return false;
    if (filterFrom && a.date < new Date(filterFrom)) return false;
    if (filterTo) {
      const to = new Date(filterTo); to.setHours(23, 59, 59, 999);
      if (a.date > to) return false;
    }
    return true;
  });

  const monthlyData = buildMonthly(filteredAlerts);
  const distribution = [
    { name: 'Alertes', value: filteredAlerts.filter((a) => a.type === 'warning').length },
    { name: 'Info', value: filteredAlerts.filter((a) => a.type === 'info').length },
    { name: 'Résolus', value: stats.resolved },
  ].filter((x) => x.value > 0);

  const userOptions = Array.from(new Set(alerts.map((a) => a.user_id).filter(Boolean))) as string[];

  const exportCSV = () => {
    if (filteredAlerts.length === 0) {
      toast.error('Aucune alerte à exporter');
      return;
    }
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const header = ['Date', 'Type', 'Catégorie', 'Utilisateur', 'Email', 'Message'].join(',');
    const rows = filteredAlerts.map((a) => {
      const p = a.user_id ? profiles[a.user_id] : null;
      return [
        a.date.toISOString(),
        a.type,
        a.category || '',
        p?.full_name || '',
        p?.email || '',
        a.message,
      ].map(escape).join(',');
    });
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredAlerts.length} alerte(s) exportée(s)`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Anti-fraude & Conformité</h1>
        <p className="text-muted-foreground">Journal d'audit et alertes de conformité (données live)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><ShieldAlert className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Alertes actives</p><p className="text-xl font-bold font-display">{stats.active}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><CheckCircle className="w-8 h-8 text-secondary" /><div><p className="text-xs text-muted-foreground">Cas résolus</p><p className="text-xl font-bold font-display">{stats.resolved}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Eye className="w-8 h-8 text-sonam-gold" /><div><p className="text-xs text-muted-foreground">En surveillance</p><p className="text-xl font-bold font-display">{stats.watching}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="font-display text-sm">Alertes par mois</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" name="Alertes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-sm">Répartition</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" outerRadius={90} label>
                    {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Journal d'audit ({filteredAlerts.length}/{alerts.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Exporter CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="space-y-1">
              <Label className="text-xs">Du</Label>
              <DateInput value={filterFrom} onChange={(e) => setFilterFrom(e)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Au</Label>
              <DateInput value={filterTo} onChange={(e) => setFilterTo(e)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type d'alerte</Label>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="warning">Alerte</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Résolu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Utilisateur</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {userOptions.map((uid) => (
                    <SelectItem key={uid} value={uid}>
                      {profiles[uid]?.full_name || profiles[uid]?.email || uid.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredAlerts.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-secondary" />
              Aucune alerte ne correspond aux filtres.
            </div>
          )}
          {filteredAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${a.type === 'warning' ? 'text-sonam-gold' : a.type === 'success' ? 'text-secondary' : 'text-primary'}`} />
              <div className="flex-1">
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {a.date.toLocaleDateString('fr-FR')}
                  {a.user_id && profiles[a.user_id] && ` • ${profiles[a.user_id].full_name || profiles[a.user_id].email}`}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">{a.type === 'warning' ? 'Alerte' : a.type === 'success' ? 'Résolu' : 'Info'}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
