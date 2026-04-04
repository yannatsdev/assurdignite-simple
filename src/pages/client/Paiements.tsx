import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, History, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import waveLogo from '@/assets/wave.svg';
import orangeLogo from '@/assets/orange.svg';
import mtnLogo from '@/assets/mtn.svg';
import moovLogo from '@/assets/moov.svg';

const paymentMethods = [
  { name: 'Wave', logo: waveLogo },
  { name: 'Orange Money', logo: orangeLogo },
  { name: 'MTN MoMo', logo: mtnLogo },
  { name: 'Moov Money', logo: moovLogo },
];

export default function PaiementsPage() {
  const { user } = useAuth();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('paiements').select('*').eq('user_id', user.id).order('date_paiement', { ascending: false })
      .then(({ data }) => { setPaiements(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">Paiements</h1>

      <Card className="border-2 border-primary/30">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm mb-4">Choisissez votre mode de paiement</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {paymentMethods.map(m => (
              <button key={m.name} className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:border-primary hover:shadow-md transition-all">
                <img src={m.logo} alt={m.name} className="h-8 w-auto object-contain" />
                <span className="text-xs font-medium">{m.name}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 gap-2"><CreditCard className="w-4 h-4" /> Payer par virement</Button>
          </div>
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
