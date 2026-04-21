import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { KkiapayWidget } from '@/components/KkiapayWidget';
import { toast as sonnerToast } from 'sonner';

export default function PaiementsPage() {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('paiements').select('*').eq('user_id', user.id).order('date_paiement', { ascending: false }),
        supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      ]);
      setPaiements(p || []);
      setContract(c?.[0] || null);
      (p || []).forEach(x => knownIds.current.add(x.id));
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel(`paiements-rt-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new?.status === 'paid' && !knownIds.current.has(payload.new.id)) {
          sonnerToast.success('Paiement confirmé', { description: `${formatCFA(payload.new.montant)} reçu — votre contrat est actif ✓` });
        } else if (payload.eventType === 'UPDATE' && payload.old?.status !== 'paid' && payload.new?.status === 'paid') {
          sonnerToast.success('Paiement validé', { description: 'Votre paiement vient d\'être confirmé.' });
        } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'failed') {
          sonnerToast.error('Paiement échoué', { description: 'Une nouvelle tentative est nécessaire.' });
        }
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const renewAmount = contract?.prime_annuelle || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">Paiements</h1>

      <Card className="border-2 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Paiement sécurisé via <strong>KkiaPay</strong></p>
              <p className="text-xs text-muted-foreground mt-1">Mobile Money (Wave, Orange, MTN, Moov), carte bancaire, virement.</p>
            </div>
            {renewAmount > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Prime annuelle</p>
                <p className="text-2xl font-bold text-primary font-display">{formatCFA(renewAmount)}</p>
              </div>
            )}
          </div>
          {renewAmount > 0 ? (
            <div className="flex justify-center py-2">
              <KkiapayWidget
                amount={renewAmount}
                email={user?.email}
                name={user?.user_metadata?.full_name || user?.email}
                onSuccess={async (resp: any) => {
                  const ref = resp?.transactionId || `KKP-${Date.now()}`;
                  const { error } = await supabase.from('paiements').insert({
                    user_id: user!.id,
                    contract_id: contract?.id || null,
                    montant: renewAmount,
                    methode: 'kkiapay',
                    status: 'paid',
                    reference: ref,
                  });
                  if (error) {
                    sonnerToast.error('Erreur enregistrement', { description: error.message });
                  } else {
                    sonnerToast.success('Paiement réussi 🎉', { description: `Référence ${ref} — Contrat actif.` });
                    await supabase.from('notifications').insert({
                      user_id: user!.id,
                      title: 'Paiement confirmé',
                      message: `Votre paiement de ${formatCFA(renewAmount)} a été reçu.`,
                      type: 'success',
                      link: '/client/paiements',
                      contract_id: contract?.id || null,
                    });
                  }
                }}
                onFailed={() => sonnerToast.error('Paiement échoué', { description: 'Veuillez réessayer.' })}
              />
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Aucun contrat actif. Souscrivez d'abord pour effectuer un paiement.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><History className="w-5 h-5" /> Historique</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Réf</TableHead><TableHead>Date</TableHead><TableHead>Montant</TableHead><TableHead>Méthode</TableHead><TableHead>Statut</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {paiements.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun paiement enregistré</TableCell></TableRow>
                ) : paiements.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-xs">{p.reference || p.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-xs">{formatCFA(p.montant)}</TableCell>
                    <TableCell className="text-xs capitalize">{p.methode || '-'}</TableCell>
                    <TableCell><Badge className={p.status === 'paid' ? 'bg-secondary' : 'bg-sonam-gold'}>{p.status === 'paid' ? 'Payé' : 'En attente'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
