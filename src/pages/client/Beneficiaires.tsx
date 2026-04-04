import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function BeneficiairesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', lien_parente: '', telephone: '' });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from('beneficiaires').select('*').eq('user_id', user.id);
    setBeneficiaires(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAdd = async () => {
    if (!user || !form.nom) return;
    const { error } = await supabase.from('beneficiaires').insert({ ...form, user_id: user.id });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Bénéficiaire ajouté' });
    setForm({ nom: '', lien_parente: '', telephone: '' });
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('beneficiaires').delete().eq('id', id);
    toast({ title: 'Bénéficiaire supprimé' });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Mes Bénéficiaires</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajouter un bénéficiaire</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nom complet</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
              <div><Label>Lien de parenté</Label><Input value={form.lien_parente} onChange={e => setForm({ ...form, lien_parente: e.target.value })} /></div>
              <div><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
              <Button onClick={handleAdd} className="w-full">Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Lien de parenté</TableHead><TableHead>Téléphone</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {beneficiaires.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" />Aucun bénéficiaire</TableCell></TableRow>
                ) : beneficiaires.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.nom}</TableCell>
                    <TableCell>{b.lien_parente || '-'}</TableCell>
                    <TableCell>{b.telephone || '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
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
