import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ContratsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setContracts(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-display">Mes Contrats</h1>
      {contracts.length === 0 ? (
        <Card className="border-dashed border-2"><CardContent className="py-12 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Aucun contrat pour le moment</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map(c => (
            <Card key={c.id} className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="font-bold font-display text-lg">{c.police_number}</p>
                    <p className="text-sm text-muted-foreground">{c.principal_name}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-secondary">Formule {c.formule}</Badge>
                      <Badge variant={c.status === 'active' ? 'default' : 'outline'}>{c.status === 'active' ? 'Actif' : c.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prime annuelle</p>
                    <p className="text-xl font-bold text-primary font-display">{formatCFA(c.prime_annuelle)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Effet : {new Date(c.date_effet).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
