import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  FolderOpen,
  Users,
  Calculator,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Gift,
  Loader2,
  HeadphonesIcon,
  Heart,
  Baby,
  UserCog,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';
import { PolicyHeroCard } from '@/components/client/PolicyHeroCard';
import { MarketingCarousel } from '@/components/client/MarketingCarousel';
import { TrustMarquee } from '@/components/client/TrustMarquee';
import { BrandShowcaseMarquee } from '@/components/landing/BrandShowcaseMarquee';

const quickActions = [
  { icon: AlertTriangle, label: 'Déclarer un sinistre', path: '/client/sinistre', color: 'bg-red-500/10 text-red-600', border: 'border-red-200' },
  { icon: FolderOpen, label: 'Mes documents', path: '/client/documents', color: 'bg-blue-500/10 text-blue-600', border: 'border-blue-200' },
  { icon: Users, label: 'Bénéficiaires', path: '/client/beneficiaires', color: 'bg-emerald-500/10 text-emerald-600', border: 'border-emerald-200' },
  { icon: Calculator, label: 'Simuler une prime', path: '/client/souscrire', color: 'bg-amber-500/10 text-amber-600', border: 'border-amber-200' },
];

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
        supabase.from('paiements').select('*').eq('user_id', user.id).neq('status', 'cancelled').order('date_paiement', { ascending: false }).limit(5),
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

  const yearsSinceEffet = contract?.date_effet
    ? Math.floor((Date.now() - new Date(contract.date_effet).getTime()) / (365.25 * 24 * 3600 * 1000))
    : 0;
  const bonusYears = Math.min(yearsSinceEffet, 3);
  const bonusPct = Math.round((bonusYears / 3) * 100);

  // Garanties par profil (image-5 inspired horizontal cards)
  const garanties = contract
    ? [
        { icon: Heart, label: 'Principal', value: contract.principal_name || 'Vous', tone: 'from-rose-500/15 to-rose-500/5 text-rose-600 ring-rose-200' },
        { icon: Heart, label: 'Conjoint', value: contract.conjoint_name || '—', tone: 'from-pink-500/15 to-pink-500/5 text-pink-600 ring-pink-200' },
        { icon: Baby, label: 'Enfants', value: `${contract.nb_enfants || 0} couvert${(contract.nb_enfants || 0) > 1 ? 's' : ''}`, tone: 'from-amber-500/15 to-amber-500/5 text-amber-600 ring-amber-200' },
        { icon: UserCog, label: 'Ascendants', value: `${contract.nb_ascendants || 0} couvert${(contract.nb_ascendants || 0) > 1 ? 's' : ''}`, tone: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-emerald-200' },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg font-display shadow-lg ring-2 ring-white">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-secondary flex items-center justify-center">
            <span className="text-[10px] font-bold text-secondary">{completionPct}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-display truncate">Salut, {userName.split(' ')[0]} !</h1>
          <p className="text-sm text-muted-foreground">
            {completionPct < 100 ? "Complétez votre profil pour profiter de tous les avantages." : 'Bienvenue dans votre espace AssurDignité.'}
          </p>
        </div>
      </motion.div>

      {/* Trust marquee */}
      <TrustMarquee />

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
      <PolicyHeroCard contract={contract} />

      {/* Mes garanties (image-5 horizontal cards) */}
      {contract && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mes garanties</h2>
            <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => navigate('/client/contrats')}>
              Voir tout →
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {garanties.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`shrink-0 w-40 sm:w-auto snap-start rounded-2xl border ring-1 ring-inset bg-gradient-to-br p-4 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer ${g.tone}`}
                onClick={() => navigate('/client/contrats')}
              >
                <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur flex items-center justify-center mb-3">
                  <g.icon className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">{g.label}</p>
                <p className="text-sm font-bold mt-0.5 truncate text-foreground">{g.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Marketing carousel */}
      <MarketingCarousel />

      <BrandShowcaseMarquee variant="compact" />

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`cursor-pointer hover:shadow-md transition-all border ${action.border} hover:-translate-y-0.5`} onClick={() => navigate(action.path)}>
                <CardContent className="pt-4 pb-4 text-center space-y-2">
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mx-auto`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium leading-tight">{action.label}</p>
                </CardContent>
              </Card>
            </motion.div>
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
          {/* Ristourne fidélité */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm font-display">Ristourne Fidélité</h3>
                  <p className="text-xs text-muted-foreground">3 ans sans sinistre = 30% de la prime de l'assuré principal</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs"><span>Progression</span><span className="font-medium">{bonusYears}/3 an{bonusYears > 1 ? 's' : ''}</span></div>
                <Progress value={bonusPct} className="h-2" />
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-700">
                <TrendingUp className="w-3 h-3" />
                <span>{bonusYears >= 3 ? 'Bonus disponible ! Contactez-nous.' : contract ? 'Continuez ainsi ! Vous êtes sur la bonne voie.' : 'Souscrivez pour démarrer votre bonus.'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assistance */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <HeadphonesIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm font-display">Besoin d'aide ?</h3>
                    <p className="text-xs text-muted-foreground truncate">Notre équipe est à votre écoute</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => navigate('/client/assistance')}>
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
