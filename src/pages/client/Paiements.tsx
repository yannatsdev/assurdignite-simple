import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { History as HistoryIcon, Loader2, ArrowRight, Eye, CreditCard, Sparkles } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusPill } from '@/components/ui/status-pill';
import { TransactionSummaryDialog } from '@/components/payment/TransactionSummaryDialog';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast as sonnerToast } from 'sonner';

const METHODE_LABELS: Record<string, string> = {
  orange_money: 'Orange Money', wave: 'Wave', mtn_momo: 'MTN MoMo',
  moov_money: 'Moov Money', virement: 'Virement bancaire', especes: 'Espèces',
};

export default function PaiementsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryFor, setSummaryFor] = useState<any | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('paiements').select('*').eq('user_id', user.id).order('date_paiement', { ascending: false }),
      supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    ]);
    setPaiements(p || []);
    setContract(c?.[0] || null);
    (p || []).forEach(x => knownIds.current.add(x.id));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`paiements-rt-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new?.status === 'paid' && !knownIds.current.has(payload.new.id)) {
          sonnerToast.success('Paiement confirmé', { description: `${formatCFA(payload.new.montant)} reçu — votre contrat est actif ✓` });
        } else if (payload.eventType === 'UPDATE' && payload.old?.status !== 'paid' && payload.new?.status === 'paid') {
          sonnerToast.success('Paiement validé', { description: 'Votre paiement vient d\'être confirmé.' });
        }
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const cancelAndRestart = async (p: any) => {
    await supabase.from('paiements').update({ status: 'cancelled' }).eq('id', p.id);
    setSummaryFor(null);
    sonnerToast.info('Transaction annulée. Vous pouvez relancer un nouveau paiement.');
    navigate('/client/paiement');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const renewAmount = contract?.prime_annuelle || 0;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Paiements"
        subtitle="Réglez votre prime annuelle en toute simplicité"
        icon={<CreditCard className="w-6 h-6" />}
      />

      <PremiumCard variant="gradient">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>Mode test — paiements simulés</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prime annuelle</p>
            <p className="text-3xl font-bold font-display text-primary">
              {renewAmount > 0 ? formatCFA(renewAmount) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {contract ? `Contrat ${contract.police_number || contract.id.slice(0, 8)}` : 'Aucun contrat actif'}
            </p>
          </div>
          {renewAmount > 0 ? (
            <Button asChild size="lg" className="gap-2">
              <Link to="/client/paiement">
                Payer ma prime <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <Link to="/client/souscrire">Souscrire d'abord</Link>
            </Button>
          )}
        </div>
      </PremiumCard>

      <Card>
        <CardContent className="pt-6">
          <SectionHeader title="Historique" icon={<HistoryIcon className="w-5 h-5" />} className="mb-3" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paiements.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun paiement enregistré</TableCell></TableRow>
                ) : paiements.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.reference || p.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-xs font-medium">{formatCFA(p.montant)}</TableCell>
                    <TableCell className="text-xs">{METHODE_LABELS[p.methode] || p.methode || '—'}</TableCell>
                    <TableCell><StatusPill status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      {p.status === 'pending' ? (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setSummaryFor(p)}>
                          <Eye className="w-3 h-3" /> Résumer
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TransactionSummaryDialog
        open={!!summaryFor}
        onOpenChange={(o) => !o && setSummaryFor(null)}
        paiement={summaryFor}
        onResume={() => {
          const id = summaryFor?.id;
          setSummaryFor(null);
          navigate(`/client/paiement?resume=${id}`);
        }}
        onCancelAndRestart={() => cancelAndRestart(summaryFor)}
      />
    </div>
  );
}
