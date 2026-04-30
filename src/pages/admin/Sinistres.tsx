import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, Clock, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = { declared: 'bg-sonam-gold', processing: 'bg-blue-500', paid: 'bg-secondary', rejected: 'bg-destructive' };
const statusLabels: Record<string, string> = { declared: 'Déclaré', processing: 'En traitement', paid: 'Payé', rejected: 'Rejeté' };

export default function AdminSinistres() {
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Record<string, { path: string; url: string }[]>>({});
  const { toast } = useToast();

  const loadDocsFor = async (s: any) => {
    const paths: string[] = s.documents_urls || [];
    if (!paths.length) return;
    const signed = await Promise.all(paths.map(async (p) => {
      const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(p, 3600);
      return { path: p, url: data?.signedUrl || '' };
    }));
    setDocs(prev => ({ ...prev, [s.id]: signed.filter(x => x.url) }));
  };

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from('sinistres').select('*').order('created_at', { ascending: false });
      setSinistres(data || []);
      setLoading(false);
      (data || []).forEach(loadDocsFor);
    };
    fetchAll();

    const channel = supabase.channel('admin-sinistres-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sinistres' }, (payload) => {
        const newS = payload.new as any;
        setSinistres(prev => [newS, ...prev]);
        toast({ title: '🚨 Nouveau sinistre', description: `Réf : ${newS.reference}` });
        loadDocsFor(newS);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sinistres' }, (payload) => {
        const upd = payload.new as any;
        setSinistres(prev => prev.map(s => s.id === upd.id ? upd : s));
        loadDocsFor(upd);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('sinistres').update({ status }).eq('id', id);
    toast({ title: 'Statut mis à jour', description: `Sinistre passé en "${statusLabels[status]}"` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Gestion des Sinistres</h1>
        <p className="text-muted-foreground">Workflow temps réel des déclarations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['declared', 'processing', 'paid', 'rejected'].map(s => {
          const count = sinistres.filter(x => x.status === s).length;
          const Icon = s === 'declared' ? Clock : s === 'processing' ? AlertTriangle : s === 'paid' ? CheckCircle : XCircle;
          return (
            <Card key={s}><CardContent className="pt-6 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${s === 'declared' ? 'text-sonam-gold' : s === 'paid' ? 'text-secondary' : s === 'rejected' ? 'text-destructive' : 'text-primary'}`} />
              <div><p className="text-xs text-muted-foreground">{statusLabels[s]}</p><p className="text-xl font-bold font-display">{count}</p></div>
            </CardContent></Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Référence</TableHead><TableHead>Décédé</TableHead><TableHead>Date décès</TableHead><TableHead>Documents</TableHead><TableHead>Statut</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sinistres.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.reference}</TableCell>
                      <TableCell>{s.nom_decede}</TableCell>
                      <TableCell className="text-sm">{s.date_deces || '—'}</TableCell>
                      <TableCell>
                        {(docs[s.id] || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(docs[s.id] || []).map((d, i) => (
                              <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20">
                                <FileText className="w-3 h-3" /> Doc {i + 1} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aucun</span>
                        )}
                      </TableCell>
                      <TableCell><Badge className={statusColors[s.status] || ''}>{statusLabels[s.status] || s.status}</Badge></TableCell>
                      <TableCell>
                        <Select value={s.status} onValueChange={v => updateStatus(s.id, v)}>
                          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="declared">Déclaré</SelectItem>
                            <SelectItem value="processing">En traitement</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="rejected">Rejeté</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sinistres.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun sinistre déclaré.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
