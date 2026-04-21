import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Users, AlertTriangle, FolderOpen, Calculator, HeadphonesIcon, CreditCard, Shield, ArrowRight, Calendar, TrendingUp, Gift, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';

const quickActions = [
  { icon: AlertTriangle, label: 'Déclarer un sinistre', path: '/client/sinistre', color: 'bg-red-500/10 text-red-600', border: 'border-red-200' },
  { icon: FolderOpen, label: 'Mes documents', path: '/client/documents', color: 'bg-blue-500/10 text-blue-600', border: 'border-blue-200' },
  { icon: Users, label: 'Bénéficiaires', path: '/client/beneficiaires', color: 'bg-emerald-500/10 text-emerald-600', border: 'border-emerald-200' },
  { icon: Calculator, label: 'Simuler une prime', path: '/client/souscrire', color: 'bg-amber-500/10 text-amber-600', border: 'border-amber-200' },
];

const FORMULE_NAMES: Record<string, string> = { A: 'Dignité Simple', B: 'Serein', C: 'Prestige', D: 'Excellence' };

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: prof }, { data: contracts }, { data: pays }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('contracts').select('*').eq('user_id', user.id).eq('status', 'active').limit(1),
        supabase.from('paiements').select('*').eq('user_id', user.id).order('date_paiement', { ascending: false }).limit(5),
      ]);
      setProfile(prof);
      setContract(contracts?.[0] || null);
      setPaiements(pays || []);
      setLoading(false);
    };
    fetchData();
    const channel = supabase.channel('client-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const userName = profile?.full_name || user?.user_metadata?.full_name || 'Assuré';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  const fields = [profile?.full_name, profile?.phone, profile?.email, contract];
  const completionPct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg font-display">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-secondary flex items-center justify-center">
            <span className="text-[10px] font-bold text-secondary">{completionPct}%</span>
          </div>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">Bonjour, {userName.split(' ')[0]} !</h1>
          <p className="text-sm text-muted-foreground">
            {completionPct < 100 ? 'Complétez votre profil pour profiter de tous les avantages.' : 'Bienvenue dans votre espace AssurDignité.'}
          </p>
        </div>
      </div>

      {/* Profile completion */}
      {completionPct < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary">Profil complété à {completionPct}%</span>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/client/profil')}>Compléter →</Button>
            </div>
            <Progress value={completionPct} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Hero policy card */}
      {contract ? (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-[hsl(var(--sonam-blue))] p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-white/70 uppercase tracking-wider">Contrat Actif</p>
                <h2 className="text-xl font-bold font-display">{FORMULE_NAMES[contract.formule] || contract.formule}</h2>
                <p className="text-sm text-white/80 font-mono">{contract.police_number}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-xs text-white/60">Capital garanti</p>
                <p className="text-sm font-bold">{formatCFA(contract.capital_total)}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Prime annuelle</p>
                <p className="text-sm font-bold">{formatCFA(contract.prime_annuelle)}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Expiration</p>
                <p className="text-sm font-bold flex items-center gap-1"><Calendar className="w-3 h-3" />{contract.date_expiration}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => navigate('/client/contrats')}>
                Voir détails
              </Button>
              <Button size="sm" variant="secondary" className="bg-secondary hover:bg-secondary/90 text-white border-0" onClick={() => navigate('/client/documents')}>
                <FileText className="w-3 h-3 mr-1" /> Documents
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-primary/80 to-[hsl(var(--sonam-blue))] p-6 text-white text-center space-y-3">
            <Shield className="w-12 h-12 mx-auto text-white/80" />
            <h2 className="text-xl font-bold font-display">Protégez votre famille dès aujourd'hui</h2>
            <p className="text-sm text-white/70">Souscrivez à AssurDignité et offrez à vos proches une couverture obsèques complète.</p>
            <Button onClick={() => navigate('/client/adhesion')} className="bg-secondary hover:bg-secondary/90 text-white gap-2">
              Souscrire maintenant <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Card key={i} className={`cursor-pointer hover:shadow-md transition-all border ${action.border} hover:scale-[1.02]`} onClick={() => navigate(action.path)}>
              <CardContent className="pt-4 pb-4 text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mx-auto`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium leading-tight">{action.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold font-display text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Derniers paiements</h3>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/client/paiements')}>Voir tout →</Button>
            </div>
            {paiements.length > 0 ? (
              <div className="space-y-3">
                {paiements.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.methode || 'Paiement'}</p>
                        <p className="text-xs text-muted-foreground">{p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCFA(p.montant)}</p>
                      <Badge variant={p.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                        {p.status === 'paid' ? 'Payé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement pour le moment.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Bonus */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm font-display">Bonus Fidélité-Santé</h3>
                  <p className="text-xs text-muted-foreground">3 ans sans sinistre = 30% des primes</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span>Progression</span><span className="font-medium">1/3 an</span></div>
                <Progress value={33} className="h-2" />
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-700">
                <TrendingUp className="w-3 h-3" />
                <span>Continuez ainsi ! Vous êtes sur la bonne voie.</span>
              </div>
            </CardContent>
          </Card>

          {/* Assistance */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <HeadphonesIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm font-display">Besoin d'aide ?</h3>
                    <p className="text-xs text-muted-foreground">Notre équipe est à votre écoute</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/client/assistance')}>
                  Contacter <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
