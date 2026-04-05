import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = { declared: 'bg-sonam-gold', processing: 'bg-blue-500', paid: 'bg-secondary', rejected: 'bg-destructive' };
const statusLabels: Record<string, string> = { declared: 'Déclaré', processing: 'En traitement', paid: 'Payé', rejected: 'Rejeté' };

export default function AdminSinistres() {
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('sinistres').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setSinistres(data || []); setLoading(false); });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('sinistres').update({ status }).eq('id', id);
    setSinistres(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast({ title: 'Statut mis à jour', description: `Sinistre passé en "${statusLabels[status]}"` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Gestion des Sinistres</h1>
        <p className="text-muted-foreground">Workflow de traitement des déclarations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  <TableHead>Référence</TableHead><TableHead>Décédé</TableHead><TableHead>Date décès</TableHead><TableHead>Statut</TableHead><TableHead>Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sinistres.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.reference}</TableCell>
                      <TableCell>{s.nom_decede}</TableCell>
                      <TableCell className="text-sm">{s.date_deces || '—'}</TableCell>
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
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
