import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCFA } from '@/lib/actuarial-engine';
import { FileText, Search, Loader2 } from 'lucide-react';

export default function AdminContrats() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFormule, setFilterFormule] = useState('all');

  useEffect(() => {
    supabase.from('contracts').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setContracts(data || []); setLoading(false); });
  }, []);

  const filtered = contracts.filter(c => {
    const matchSearch = !search || c.police_number?.toLowerCase().includes(search.toLowerCase()) || c.principal_name?.toLowerCase().includes(search.toLowerCase());
    const matchFormule = filterFormule === 'all' || c.formule === filterFormule;
    return matchSearch && matchFormule;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Gestion des Contrats</h1>
        <p className="text-muted-foreground">Tous les contrats AssurDignité</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par n° police ou nom..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterFormule} onValueChange={setFilterFormule}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes formules</SelectItem>
            <SelectItem value="A">Formule A</SelectItem>
            <SelectItem value="B">Formule B</SelectItem>
            <SelectItem value="C">Formule C</SelectItem>
            <SelectItem value="D">Formule D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Aucun contrat trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Police</TableHead>
                    <TableHead>Assuré</TableHead>
                    <TableHead>Formule</TableHead>
                    <TableHead>Prime</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date effet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.police_number}</TableCell>
                      <TableCell>{c.principal_name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">Formule {c.formule}</Badge></TableCell>
                      <TableCell>{formatCFA(c.prime_annuelle)}</TableCell>
                      <TableCell><Badge className={c.status === 'active' ? 'bg-secondary' : ''}>{c.status}</Badge></TableCell>
                      <TableCell className="text-sm">{c.date_effet}</TableCell>
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
