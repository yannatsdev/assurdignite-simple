import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Loader2, Banknote, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast as sonnerToast } from 'sonner';

export default function PaiementsPage() {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [methode, setMethode] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
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
              <p className="text-sm text-muted-foreground">Paiement annuel — Mobile Money, virement bancaire ou agence.</p>
              <p className="text-xs text-muted-foreground mt-1">Indiquez la référence après votre paiement, validation sous 24h.</p>
            </div>
            {renewAmount > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Prime annuelle</p>
                <p className="text-2xl font-bold text-primary font-display">{formatCFA(renewAmount)}</p>
              </div>
            )}
          </div>
          {renewAmount > 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-primary/30 p-4 sm:p-5 bg-accent/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-primary">Coordonnées bancaires SONAM VIE</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Banque</p>
                    <p className="font-semibold">SGBCI – SONAM VIE</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground">RIB</p>
                    <p className="font-mono text-xs sm:text-sm break-all">CI93 CI108 01001 1234567890 12</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Mobile Money</p>
                    <p className="font-semibold">+225 27 20 31 71 82</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Référence à indiquer</p>
                    <p className="font-semibold">AD-{(user?.id || '').slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 space-y-3 bg-card">
                <Label>Méthode utilisée</Label>
                <Select value={methode} onValueChange={setMethode}>
                  <SelectTrigger><SelectValue placeholder="Choisir un mode de paiement" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virement">Virement bancaire</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="orange_money">Orange Money</SelectItem>
                    <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                    <SelectItem value="moov_money">Moov Money</SelectItem>
                    <SelectItem value="especes">Espèces (agence)</SelectItem>
                  </SelectContent>
                </Select>
                <Label>Référence / numéro de transaction</Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Ex : TXN-987654" />
                <Button
                  className="w-full gap-2"
                  disabled={!methode || !reference.trim() || submitting}
                  onClick={async () => {
                    if (!user) return;
                    setSubmitting(true);
                    const ref = reference.trim();
                    const { error } = await supabase.from('paiements').insert({
                      user_id: user.id,
                      contract_id: contract?.id || null,
                      montant: renewAmount,
                      methode,
                      status: 'pending',
                      reference: ref,
                    });
                    setSubmitting(false);
                    if (error) {
                      sonnerToast.error('Erreur', { description: error.message });
                      return;
                    }
                    await supabase.from('notifications').insert({
                      user_id: user.id,
                      title: 'Paiement déclaré',
                      message: `Référence ${ref} — ${formatCFA(renewAmount)}. En attente de validation.`,
                      type: 'info',
                      link: '/client/paiements',
                      contract_id: contract?.id || null,
                    });
                    sonnerToast.success('Paiement enregistré ✓', { description: 'Validation sous 24h ouvrées.' });
                    setMethode(''); setReference('');
                  }}
                >
                  <Check className="w-4 h-4" /> Déclarer mon paiement
                </Button>
              </div>
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
