import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, FileText } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';

const contracts = [
  { id: 'AD-2026-001234', formule: 'B – Serein', status: 'Actif', dateEffet: '15/06/2025', dateExpiration: '15/06/2026', prime: 45000, nbAssures: 4 },
];

export default function ContratsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Mes Contrats</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Police</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d'effet</TableHead>
                <TableHead>Prime annuelle</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.id}</TableCell>
                  <TableCell>{c.formule}</TableCell>
                  <TableCell><Badge className="bg-secondary">{c.status}</Badge></TableCell>
                  <TableCell>{c.dateEffet}</TableCell>
                  <TableCell>{formatCFA(c.prime)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost"><Download className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
