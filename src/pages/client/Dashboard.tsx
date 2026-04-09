import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard, AlertTriangle, Heart, Gift, ArrowRight, Loader2, Calculator, Users, Calendar, TrendingUp } from 'lucide-react';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('paiements').select('*').eq('user_id', user.id).order('date_paiement', { ascending: false }).limit(5),
    ]).then(([contractsRes, profileRes, paiementsRes]) => {
      setContracts(contractsRes.data || []);
      setProfile(profileRes.data);
      setPaiements(paiementsRes.data || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const activeContract = contracts.find(c => c.status === 'active');
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Client';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Bonjour, {displayName} ! 👋</h1>
        <p className="text-muted-foreground">Bienvenue sur votre espace AssurDignité</p>
      </div>

      {activeContract ? (
        <>
          {/* Hero contract card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-white/70 text-sm mb-1">Contrat actif</p>
                  <p className="text-2xl font-bold font-display">{activeContract.police_number}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">Formule {activeContract.formule}</Badge>
                    <Badge className="bg-secondary/80 text-white border-0">✓ Actif</Badge>
                  </div>
                  <p className="text-white/60 text-xs mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expire le {new Date(activeContract.date_expiration).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-white/70 text-sm">Capital couvert</p>
                  <p className="text-3xl font-bold font-display">{formatCFA(activeContract.capital_total)}</p>
                  <p className="text-white/60 text-sm mt-1">Prime : {formatCFA(activeContract.prime_annuelle)}/an</p>
                  <Button size="sm" className="mt-3 bg-white text-primary hover:bg-white/90 gap-1" asChild>
                    <Link to="/client/paiements"><CreditCard className="w-3 h-3" /> Renouveler</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: AlertTriangle, label: 'Déclarer un sinistre', to: '/client/sinistre', color: 'text-destructive' },
              { icon: FileText, label: 'Mes documents', to: '/client/documents', color: 'text-primary' },
              { icon: Users, label: 'Mes bénéficiaires', to: '/client/beneficiaires', color: 'text-secondary' },
              { icon: Calculator, label: 'Simuler une prime', to: '/client/adhesion', color: 'text-sonam-gold' },
            ].map(action => (
              <Card key={action.to} className="hover:shadow-md transition-all group cursor-pointer">
                <CardContent className="pt-5 pb-4 text-center">
                  <Link to={action.to} className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center group-hover:scale-110 transition-transform ${action.color}`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-5 text-center">
                <FileText className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold font-display">{contracts.length}</p>
                <p className="text-xs text-muted-foreground">Contrat(s)</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <CardContent className="pt-5 text-center">
                <CreditCard className="w-6 h-6 text-secondary mx-auto mb-1" />
                <p className="text-lg font-bold font-display">{formatCFA(activeContract.prime_annuelle)}</p>
                <p className="text-xs text-muted-foreground">Prochaine échéance</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sonam-gold/5 to-sonam-gold/10 border-sonam-gold/20">
              <CardContent className="pt-5 text-center">
                <Gift className="w-6 h-6 text-sonam-gold mx-auto mb-1" />
                <p className="text-2xl font-bold font-display">30%</p>
                <p className="text-xs text-muted-foreground">Bonus Fidélité</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sonam-green/5 to-sonam-green/10 border-sonam-green/20">
              <CardContent className="pt-5 text-center">
                <Heart className="w-6 h-6 text-sonam-green mx-auto mb-1" />
                <p className="text-lg font-bold font-display">{formatCFA(activeContract.capital_total)}</p>
                <p className="text-xs text-muted-foreground">Capital couvert</p>
              </CardContent>
            </Card>
          </div>

          {/* Bonus Fidélité Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sonam-gold" />
                  <span className="font-semibold font-display">Bonus Fidélité-Santé</span>
                </div>
                <Badge variant="outline" className="text-sonam-gold border-sonam-gold/30">30%</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Aucun sinistre pendant 3 ans = 30% des primes remboursées</p>
              <div className="w-full bg-accent rounded-full h-3">
                <div className="bg-gradient-to-r from-sonam-gold to-secondary h-3 rounded-full transition-all" style={{ width: '33%' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Année 1/3 — Continuez ainsi !</p>
            </CardContent>
          </Card>

          {/* Recent payments */}
          {paiements.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold font-display">Paiements récents</h3>
                  <Button variant="ghost" size="sm" asChild><Link to="/client/paiements">Voir tout <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>
                </div>
                <div className="space-y-2">
                  {paiements.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="text-sm font-medium">{p.reference || 'Paiement'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCFA(p.montant)}</p>
                        <Badge variant={p.status === 'paid' ? 'default' : 'outline'} className={`text-xs ${p.status === 'paid' ? 'bg-sonam-green' : ''}`}>
                          {p.status === 'paid' ? 'Payé' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
    </div>
  );
}
