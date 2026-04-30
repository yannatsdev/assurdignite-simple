import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Search, ArrowRight, History as HistoryIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumCard } from '@/components/ui/premium-card';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusPill } from '@/components/ui/status-pill';

export default function SinistresHistoriquePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('sinistres')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = items.filter(s => {
    const matchQ = !q || `${s.reference} ${s.nom_decede || ''}`.toLowerCase().includes(q.toLowerCase());
    const matchS = statusFilter === 'all' || s.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Historique des sinistres"
        subtitle="Tous vos dossiers et leur statut en temps réel"
        icon={<HistoryIcon className="w-6 h-6" />}
        action={<Button asChild><Link to="/client/sinistre">Déclarer un sinistre</Link></Button>}
      />

      <PremiumCard variant="solid" className="!p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher par référence ou nom…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="declared">Déclaré</SelectItem>
              <SelectItem value="processing">En traitement</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PremiumCard>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <PremiumCard variant="outline" className="text-center py-12">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun sinistre trouvé.</p>
        </PremiumCard>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <PremiumCard key={s.id} variant="solid" hoverable className="!p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{s.reference}</span>
                    <StatusPill status={s.status} />
                  </div>
                  <p className="font-semibold mt-1 truncate">{s.nom_decede}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Déclaré le {new Date(s.created_at).toLocaleDateString('fr-FR')} {s.date_deces && `• Décès ${new Date(s.date_deces).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1">
                  <Link to={`/client/sinistre/${s.id}`}>Suivre <ArrowRight className="w-3 h-3" /></Link>
                </Button>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}
    </div>
  );
}
