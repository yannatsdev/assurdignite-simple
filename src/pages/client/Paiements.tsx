import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCFA } from '@/lib/actuarial-engine';

const payments = [
  { id: 'PAY-001', date: '15/06/2025', amount: 45000, method: 'Orange Money', status: 'Payé' },
  { id: 'PAY-002', date: '15/06/2024', amount: 45000, method: 'Wave', status: 'Payé' },
];

export default function PaiementsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Paiements</h1>
      <Card className="border-2 border-primary">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Prime annuelle à payer</p>
            <p className="text-3xl font-bold font-display text-primary">{formatCFA(45000)}</p>
            <p className="text-sm text-muted-foreground">Échéance : 15 juin 2026</p>
          </div>
          <Button size="lg" className="gap-2"><CreditCard className="w-5 h-5" /> Payer maintenant</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><History className="w-5 h-5" /> Historique des paiements</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Réf</TableHead><TableHead>Date</TableHead><TableHead>Montant</TableHead><TableHead>Méthode</TableHead><TableHead>Statut</TableHead><TableHead>Reçu</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell>{p.date}</TableCell>
                  <TableCell>{formatCFA(p.amount)}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell><Badge className="bg-secondary">{p.status}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="ghost"><Download className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
