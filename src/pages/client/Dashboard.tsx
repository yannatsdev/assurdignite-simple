import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard, AlertTriangle, Heart, Gift, ArrowRight, Loader2 } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setContracts(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const activeContract = contracts.find(c => c.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur votre espace AssurDignité</p>
      </div>

      {activeContract ? (
        <>
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contrat actif</p>
                  <p className="text-xl font-bold font-display">{activeContract.police_number}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-secondary">Formule {activeContract.formule}</Badge>
                    <Badge variant="outline">Actif</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Prime annuelle</p>
                  <p className="text-2xl font-bold text-primary font-display">{formatCFA(activeContract.prime_annuelle)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><FileText className="w-8 h-8 text-primary mx-auto mb-2" /><p className="font-bold font-display">{contracts.length}</p><p className="text-xs text-muted-foreground">Contrat(s)</p></CardContent></Card>
            <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><CreditCard className="w-8 h-8 text-secondary mx-auto mb-2" /><p className="font-bold font-display text-sm">{formatCFA(activeContract.prime_annuelle)}</p><p className="text-xs text-muted-foreground">Prochaine échéance</p></CardContent></Card>
            <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><Gift className="w-8 h-8 text-sonam-gold mx-auto mb-2" /><p className="font-bold font-display">30%</p><p className="text-xs text-muted-foreground">Bonus Fidélité</p></CardContent></Card>
            <Card className="hover:shadow-lg transition-all"><CardContent className="pt-6 text-center"><Heart className="w-8 h-8 text-sonam-green mx-auto mb-2" /><p className="font-bold font-display text-sm">{formatCFA(activeContract.capital_total)}</p><p className="text-xs text-muted-foreground">Capital couvert</p></CardContent></Card>
          </div>
        </>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-bold font-display mb-2">Aucun contrat actif</h3>
            <p className="text-muted-foreground mb-4">Souscrivez à AssurDignité pour protéger votre famille</p>
            <Button asChild className="gap-2"><Link to="/client/adhesion"><ArrowRight className="w-4 h-4" /> Souscrire</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/client/paiements"><CreditCard className="w-5 h-5" /><span className="text-sm">Payer</span></Link></Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/client/sinistre"><AlertTriangle className="w-5 h-5" /><span className="text-sm">Sinistre</span></Link></Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/client/documents"><FileText className="w-5 h-5" /><span className="text-sm">Documents</span></Link></Button>
      </div>
    </div>
  );
}
