import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Shield, User } from 'lucide-react';

export default function AdminUtilisateurs() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*, user_roles(role)')
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Utilisateurs & Rôles</h1>
        <p className="text-muted-foreground">Gestion des comptes et permissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total utilisateurs</p><p className="text-xl font-bold font-display">{users.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Shield className="w-8 h-8 text-secondary" /><div><p className="text-xs text-muted-foreground">Admins</p><p className="text-xl font-bold font-display">{users.filter(u => u.user_roles?.some((r: any) => r.role === 'admin')).length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><User className="w-8 h-8 text-sonam-gold" /><div><p className="text-xs text-muted-foreground">Clients</p><p className="text-xl font-bold font-display">{users.filter(u => u.user_roles?.some((r: any) => r.role === 'client')).length}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Téléphone</TableHead><TableHead>Rôle</TableHead><TableHead>Inscrit le</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.phone || '—'}</TableCell>
                      <TableCell>{u.user_roles?.map((r: any, i: number) => <Badge key={i} className={r.role === 'admin' ? 'bg-primary mr-1' : 'bg-secondary mr-1'}>{r.role}</Badge>)}</TableCell>
                      <TableCell className="text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
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
