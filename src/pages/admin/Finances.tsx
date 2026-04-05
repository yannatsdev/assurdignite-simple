import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCFA } from '@/lib/actuarial-engine';
import { CreditCard, Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import waveIcon from '@/assets/wave.svg';
import orangeIcon from '@/assets/orange.svg';
import mtnIcon from '@/assets/mtn.svg';
import moovIcon from '@/assets/moov.svg';

const methodIcons: Record<string, string> = { wave: waveIcon, orange: orangeIcon, mtn: mtnIcon, moov: moovIcon };

export default function AdminFinances() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('paiements').select('*').order('date_paiement', { ascending: false })
      .then(({ data }) => { setPaiements(data || []); setLoading(false); });
  }, []);

  const totalEncaisse = paiements.filter(p => p.status === 'paid').reduce((s, p) => s + p.montant, 0);
  const totalPending = paiements.filter(p => p.status === 'pending').reduce((s, p) => s + p.montant, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Encaissements & Finances</h1>
        <p className="text-muted-foreground">Suivi des paiements et réconciliation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-secondary" /><div><p className="text-xs text-muted-foreground">Total encaissé</p><p className="text-xl font-bold font-display">{formatCFA(totalEncaisse)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertCircle className="w-8 h-8 text-sonam-gold" /><div><p className="text-xs text-muted-foreground">En attente</p><p className="text-xl font-bold font-display">{formatCFA(totalPending)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Transactions</p><p className="text-xl font-bold font-display">{paiements.length}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-sm">Historique des paiements</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Référence</TableHead><TableHead>Montant</TableHead><TableHead>Méthode</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {paiements.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.reference || '—'}</TableCell>
                      <TableCell className="font-semibold">{formatCFA(p.montant)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {methodIcons[p.methode] && <img src={methodIcons[p.methode]} alt={p.methode} className="w-6 h-6" />}
                          <span className="capitalize text-sm">{p.methode || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={p.status === 'paid' ? 'bg-secondary' : ''}>{p.status}</Badge></TableCell>
                      <TableCell className="text-sm">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</TableCell>
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
