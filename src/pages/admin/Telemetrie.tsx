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

  /** Per-kind daily series: latency p95 + error rate (%) per kind. */
  const perKindSeries = useMemo(() => {
    const kinds = ['ocr', 'pdf', 'kyc'] as const;
    const dayMap = new Map<string, Record<string, { dur: number[]; err: number; total: number }>>();
    filtered.forEach((r) => {
      if (!kinds.includes(r.kind as any)) return;
      const day = r.created_at.slice(0, 10);
      if (!dayMap.has(day)) dayMap.set(day, {});
      const bucket = dayMap.get(day)!;
      if (!bucket[r.kind]) bucket[r.kind] = { dur: [], err: 0, total: 0 };
      bucket[r.kind].total += 1;
      if (!r.success) bucket[r.kind].err += 1;
      if (r.duration_ms != null) bucket[r.kind].dur.push(r.duration_ms);
    });
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, kinds]) => ({
        date,
        ocr_p95: Math.round(p95(kinds.ocr?.dur || [])),
        pdf_p95: Math.round(p95(kinds.pdf?.dur || [])),
        kyc_p95: Math.round(p95(kinds.kyc?.dur || [])),
        ocr_err: kinds.ocr ? +((kinds.ocr.err / kinds.ocr.total) * 100).toFixed(1) : 0,
        pdf_err: kinds.pdf ? +((kinds.pdf.err / kinds.pdf.total) * 100).toFixed(1) : 0,
        kyc_err: kinds.kyc ? +((kinds.kyc.err / kinds.kyc.total) * 100).toFixed(1) : 0,
      }));
  }, [filtered]);

  const exportCsv = async () => {
    // Resolve user emails for traceability
    const uniqueUserIds = Array.from(new Set(filtered.map(r => r.user_id).filter(Boolean))) as string[];
    let emailMap = new Map<string, string>();
    if (uniqueUserIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id,email').in('id', uniqueUserIds);
      (profs || []).forEach((p: any) => emailMap.set(p.id, p.email || ''));
    }
    const header = ['date_iso', 'user_id', 'user_email', 'kind', 'name', 'duration_ms', 'success', 'error_message', 'meta_json'];
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const detail = [header.join(',')].concat(
      filtered.map((r) => [
        r.created_at,
        r.user_id ?? '',
        emailMap.get(r.user_id || '') ?? '',
        r.kind,
        r.name,
        r.duration_ms ?? '',
        r.success,
        r.error_message ?? '',
        r.meta ? JSON.stringify(r.meta) : '',
      ].map(escape).join(',')),
    );
    // Summary section per kind
    const kinds = Array.from(new Set(filtered.map((r) => r.kind)));
    const summary: string[] = ['', 'RESUME', ['kind', 'count', 'avg_ms', 'p95_ms', 'error_rate_pct'].join(',')];
    kinds.forEach((k) => {
      const list = filtered.filter((r) => r.kind === k);
      const durs = list.filter((r) => r.duration_ms != null).map((r) => r.duration_ms!);
      const errs = list.filter((r) => !r.success).length;
      summary.push([
        k,
        list.length,
        Math.round(avg(durs)),
        Math.round(p95(durs)),
        list.length ? ((errs / list.length) * 100).toFixed(2) : '0.00',
      ].map(escape).join(','));
    });
    const blob = new Blob([detail.concat(summary).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetrie_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">Télémétrie & qualité</h1>
            <p className="text-muted-foreground text-sm">OCR, PDF, KYC, paiements — performance et erreurs en temps réel.</p>
          </div>
          <Button onClick={exportCsv} variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto">
            <Download className="h-4 w-4" /> Exporter CSV ({filtered.length})
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={range} onValueChange={(v) => { setRange(v as keyof typeof RANGES); setFromDate(''); setToDate(''); }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(RANGES).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={kind} onValueChange={(v) => setKind(v as typeof KINDS[number])}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k === 'all' ? 'Tous' : k}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" aria-label="Du" />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" aria-label="Au" />
          <Input placeholder="Filtrer par user_id…" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-48" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Activity className="h-4 w-4" />} label="Événements" value={kpis.total.toString()} loading={loading} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Taux de succès" value={`${kpis.successRate.toFixed(1)}%`} loading={loading} />
        <KpiCard icon={<Timer className="h-4 w-4 text-primary" />} label="p95 latence" value={`${Math.round(kpis.p95)} ms`} loading={loading} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4 text-destructive" />} label="Erreurs" value={kpis.errors.toString()} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Latence p95 par catégorie (ms)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perKindSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="ocr_p95" name="OCR" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pdf_p95" name="PDF" stroke="hsl(var(--sonam-blue))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="kyc_p95" name="KYC" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Taux d'erreur par catégorie (%)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perKindSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Bar dataKey="ocr_err" name="OCR" fill="hsl(var(--primary))" />
                  <Bar dataKey="pdf_err" name="PDF" fill="hsl(var(--sonam-blue))" />
                  <Bar dataKey="kyc_err" name="KYC" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Latence globale (p50 / p95) par jour</CardTitle></CardHeader>
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
