import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const beneficiaires = [
  { id: 1, nom: 'Kouamé Jean', lienParente: 'Fils aîné', telephone: '05 55 12 34 56', option: 'B – Serein' },
  { id: 2, nom: 'Kouamé Marie', lienParente: 'Fille', telephone: '07 08 90 12 34', option: 'B – Serein' },
];

export default function BeneficiairesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-display">Mes Bénéficiaires</h1>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Ajouter</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Lien de parenté</TableHead><TableHead>Téléphone</TableHead><TableHead>Option</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {beneficiaires.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.nom}</TableCell>
                  <TableCell>{b.lienParente}</TableCell>
                  <TableCell>{b.telephone}</TableCell>
                  <TableCell>{b.option}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
