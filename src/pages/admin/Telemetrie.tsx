import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, Timer, Download } from 'lucide-react';


type Row = {
  id: string; user_id: string | null; kind: string; name: string;
  duration_ms: number | null; success: boolean; error_message: string | null;
  meta: any; created_at: string;
};

const KINDS = ['all', 'ocr', 'pdf', 'kyc', 'payment', 'adhesion'] as const;
const RANGES: Record<string, number> = { '24h': 1, '7j': 7, '30j': 30, '90j': 90 };

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, i)] ?? 0;
}
function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function AdminTelemetrie() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<keyof typeof RANGES>('7j');
  const [kind, setKind] = useState<typeof KINDS[number]>('all');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sinceRange = new Date(Date.now() - RANGES[range] * 24 * 3600 * 1000).toISOString();
      const since = fromDate ? new Date(fromDate).toISOString() : sinceRange;
      let q = supabase.from('telemetry_events').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(5000);
      if (toDate) q = q.lte('created_at', new Date(toDate + 'T23:59:59').toISOString());
      if (kind !== 'all') q = q.eq('kind', kind);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) console.error('telemetry load', error);
      setRows((data || []) as Row[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range, kind, fromDate, toDate]);

  const filtered = useMemo(
    () => rows.filter((r) => (userFilter ? (r.user_id || '').toLowerCase().includes(userFilter.trim().toLowerCase()) : true)),
    [rows, userFilter],
  );


  const kpis = useMemo(() => {
    const total = filtered.length;
    const ok = filtered.filter((r) => r.success).length;
    const successRate = total ? (ok / total) * 100 : 100;
    const durations = filtered.filter((r) => r.duration_ms != null).map((r) => r.duration_ms!) as number[];
    return { total, successRate, p95: p95(durations), avg: avg(durations), errors: total - ok };
  }, [filtered]);

  const perName = useMemo(() => {
    const map = new Map<string, Row[]>();
    filtered.forEach((r) => { const k = `${r.kind}:${r.name}`; map.set(k, [...(map.get(k) || []), r]); });
    return Array.from(map.entries())
      .map(([k, list]) => {
        const durations = list.filter((r) => r.duration_ms != null).map((r) => r.duration_ms!) as number[];
        const ok = list.filter((r) => r.success).length;
        const lastError = list.find((r) => !r.success)?.error_message ?? null;
        return { key: k, count: list.length, successRate: list.length ? (ok / list.length) * 100 : 100, avg: avg(durations), p95: p95(durations), lastError };
      })
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const series = useMemo(() => {
    const buckets = new Map<string, number[]>();
    filtered.forEach((r) => {
      if (r.duration_ms == null) return;
      const d = r.created_at.slice(0, 10);
      buckets.set(d, [...(buckets.get(d) || []), r.duration_ms]);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, p50: Math.round(p95(vals.filter((_, i) => i < Math.ceil(vals.length / 2)))), p95: Math.round(p95(vals)) }));
  }, [filtered]);

  const errors = useMemo(() => filtered.filter((r) => !r.success).slice(0, 50), [filtered]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Télémétrie & qualité</h1>
          <p className="text-muted-foreground text-sm">OCR, PDF, KYC, paiements — performance et erreurs en temps réel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as keyof typeof RANGES)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(RANGES).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={kind} onValueChange={(v) => setKind(v as typeof KINDS[number])}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k === 'all' ? 'Tous' : k}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Filtrer par user_id…" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-48" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Activity className="h-4 w-4" />} label="Événements" value={kpis.total.toString()} loading={loading} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Taux de succès" value={`${kpis.successRate.toFixed(1)}%`} loading={loading} />
        <KpiCard icon={<Timer className="h-4 w-4 text-primary" />} label="p95 latence" value={`${Math.round(kpis.p95)} ms`} loading={loading} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4 text-destructive" />} label="Erreurs" value={kpis.errors.toString()} loading={loading} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Latence (p50 / p95) par jour</CardTitle></CardHeader>
        <CardContent className="h-64">
          {loading ? <Skeleton className="w-full h-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="p50" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Performance par opération</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opération</TableHead><TableHead>Volume</TableHead><TableHead>Succès</TableHead>
                <TableHead>Moy. (ms)</TableHead><TableHead>p95 (ms)</TableHead><TableHead>Dernière erreur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perName.length === 0 && !loading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Aucun événement sur cette période.</TableCell></TableRow>
              )}
              {perName.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-mono text-xs">{r.key}</TableCell>
                  <TableCell>{r.count}</TableCell>
                  <TableCell><Badge variant={r.successRate >= 95 ? 'default' : 'destructive'}>{r.successRate.toFixed(1)}%</Badge></TableCell>
                  <TableCell>{Math.round(r.avg)}</TableCell>
                  <TableCell>{Math.round(r.p95)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={r.lastError ?? ''}>{r.lastError ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">50 dernières erreurs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quand</TableHead><TableHead>Opération</TableHead><TableHead>Durée</TableHead>
                <TableHead>User</TableHead><TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucune erreur 🎉</TableCell></TableRow>
              )}
              {errors.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{new Date(e.created_at).toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="font-mono text-xs">{e.kind}:{e.name}</TableCell>
                  <TableCell>{e.duration_ms ?? '—'} ms</TableCell>
                  <TableCell className="font-mono text-xs">{(e.user_id || '—').slice(0, 8)}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-md truncate" title={e.error_message ?? ''}>{e.error_message ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
        {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold font-display">{value}</p>}
      </CardContent>
    </Card>
  );
}
