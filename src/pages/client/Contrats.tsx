import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Shield, Calendar, ArrowRight, Sparkles as SparkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClientHeroBanner } from '@/components/client/ClientHeroBanner';
import familyUnited from '@/assets/banners/family-united.jpg';

const FORMULE_NAMES: Record<string, string> = {
  A: 'Dignité Simple',
  B: 'Serein',
  C: 'Prestige',
  D: 'Excellence',
};

export default function ContratsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setContracts(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Mes Contrats</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Retrouvez ici tous vos contrats AssurDignité actifs et passés.
        </p>
      </div>

      {contracts.length === 0 ? (
        <ClientHeroBanner
          image={familyUnited}
          title="Aucun contrat pour le moment"
          subtitle="Souscrivez à AssurDignité et offrez à votre famille la sérénité d'une couverture obsèques complète."
          height="h-60 sm:h-72"
          cta={
            <Button
              size="lg"
              onClick={() => navigate('/client/adhesion')}
              className="bg-secondary hover:bg-secondary/90 text-white gap-2 shadow-lg"
            >
              Souscrire maintenant <ArrowRight className="w-4 h-4" />
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contracts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5">
                {/* Gradient header */}
                <div
                  className="relative h-24 animate-gradient-x bg-[length:200%_200%]"
                  style={{
                    backgroundImage:
                      'linear-gradient(120deg, hsl(var(--primary)), hsl(var(--sonam-blue)), hsl(var(--primary)))',
                  }}
                >
                  <svg
                    className="absolute -right-6 -top-6 h-32 w-32 text-white/15"
                    viewBox="0 0 200 200"
                    fill="none"
                    aria-hidden
                  >
                    {[40, 60, 80].map((r) => (
                      <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="1" />
                    ))}
                  </svg>
                  <div className="absolute inset-0 p-4 flex items-start justify-between text-white">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/80">Contrat</p>
                      <p className="font-mono text-sm font-semibold drop-shadow">{c.police_number}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="font-bold font-display text-base truncate">
                        {FORMULE_NAMES[c.formule] || `Formule ${c.formule}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{c.principal_name}</p>
                    </div>
                    <Badge
                      variant={c.status === 'active' ? 'default' : 'outline'}
                      className={c.status === 'active' ? 'bg-secondary' : ''}
                    >
                      {c.status === 'active' ? 'Actif' : c.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        Prime annuelle
                      </p>
                      <p className="font-bold text-primary font-display">
                        {formatCFA(c.prime_annuelle)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        Capital
                      </p>
                      <p className="font-bold font-display">{formatCFA(c.capital_total)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Effet : {new Date(c.date_effet).toLocaleDateString('fr-FR')}
                    <span className="mx-1">·</span>
                    Expire : {new Date(c.date_expiration).toLocaleDateString('fr-FR')}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 flex-1"
                      onClick={() => navigate('/client/documents')}
                    >
                      <FileText className="w-3 h-3" /> Documents
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => navigate('/client/paiements')}
                    >
                      <SparkIcon className="w-3 h-3" /> Paiements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
