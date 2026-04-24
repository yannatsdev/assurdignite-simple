import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Shield, User, Search, Ban, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type AdminUser = { id: string; email: string; full_name?: string; phone?: string; created_at?: string; status?: string; roles: string[] };

export default function AdminUtilisateurs() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-users', { body: { action: 'list' } });
    if (error) toast.error('Chargement impossible', { description: error.message });
    setUsers(data?.users || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel('admin-users-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const action = async (body: any, success: string) => {
    setBusy(body.user_id || 'action');
    const { error } = await supabase.functions.invoke('admin-users', { body });
    setBusy(null);
    if (error) return toast.error('Action impossible', { description: error.message });
    toast.success(success); await load();
  };

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [u.full_name, u.email, u.phone].some(v => String(v || '').toLowerCase().includes(q));
    const matchesRole = roleFilter === 'all' || u.roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }), [users, search, roleFilter, statusFilter]);

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    clients: users.filter(u => u.roles.includes('client')).length,
    disabled: users.filter(u => (u.status || 'active') !== 'active').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Utilisateurs & Rôles</h1>
        <p className="text-muted-foreground">Gestion des comptes, permissions et statuts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold font-display">{stats.total}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Shield className="w-8 h-8 text-secondary" /><div><p className="text-xs text-muted-foreground">Admins</p><p className="text-xl font-bold font-display">{stats.admins}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><User className="w-8 h-8 text-sonam-gold" /><div><p className="text-xs text-muted-foreground">Clients</p><p className="text-xl font-bold font-display">{stats.clients}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3"><Ban className="w-8 h-8 text-destructive" /><div><p className="text-xs text-muted-foreground">Désactivés</p><p className="text-xl font-bold font-display">{stats.disabled}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
        <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-10" placeholder="Rechercher nom, email, téléphone..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous rôles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="client">Client</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem><SelectItem value="active">Actif</SelectItem><SelectItem value="disabled">Désactivé</SelectItem><SelectItem value="deleted">Supprimé</SelectItem></SelectContent></Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Téléphone</TableHead><TableHead>Rôles</TableHead><TableHead>Statut</TableHead><TableHead>Inscrit le</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Aucun utilisateur trouvé</TableCell></TableRow> : filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell><p className="font-medium">{u.full_name || '—'}</p><p className="text-xs text-muted-foreground break-all">{u.email}</p></TableCell>
                      <TableCell className="text-sm">{u.phone || '—'}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{u.roles.map(r => <Badge key={r} className={r === 'admin' ? 'bg-primary' : 'bg-secondary'}>{r}</Badge>)}</div></TableCell>
                      <TableCell><Badge variant={(u.status || 'active') === 'active' ? 'outline' : 'destructive'}>{u.status || 'active'}</Badge></TableCell>
                      <TableCell className="text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => action({ action: u.roles.includes('admin') ? 'remove_role' : 'add_role', user_id: u.id, role: 'admin' }, u.roles.includes('admin') ? 'Rôle admin retiré' : 'Rôle admin ajouté')}>{u.roles.includes('admin') ? 'Retirer admin' : 'Admin'}</Button>
                          {(u.status || 'active') === 'active' ? <Button size="icon" variant="outline" disabled={busy === u.id} onClick={() => action({ action: 'deactivate', user_id: u.id }, 'Compte désactivé')}><Ban className="w-4 h-4" /></Button> : <Button size="icon" variant="outline" disabled={busy === u.id} onClick={() => action({ action: 'reactivate', user_id: u.id }, 'Compte réactivé')}><RotateCcw className="w-4 h-4" /></Button>}
                          <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="destructive" disabled={busy === u.id}><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle><AlertDialogDescription>Cette action supprime l’accès utilisateur et marque le profil comme supprimé.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => action({ action: 'delete', user_id: u.id }, 'Compte supprimé')}>Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </div>
                      </TableCell>
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
