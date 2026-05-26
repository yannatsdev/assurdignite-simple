import { motion } from 'framer-motion';
import { Shield, ArrowRight, Calendar, FileText, Sparkles as SparkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatCFA } from '@/lib/actuarial-engine';
import { Sparkles } from '@/components/ui/sparkles';
import familyUnited from '@/assets/banners/family-united.jpg';

const FORMULE_NAMES: Record<string, string> = {
  A: 'Dignité Simple',
  B: 'Serein',
  C: 'Prestige',
  D: 'Excellence',
};

interface PolicyHeroCardProps {
  contract: any | null;
}

/**
 * Premium policy card inspired by image 5 (insurance app dashboard).
 * Animated gradient, decorative concentric circles, glassmorphism, sparkles overlay.
 */
export function PolicyHeroCard({ contract }: PolicyHeroCardProps) {
  const navigate = useNavigate();

  if (!contract) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl shadow-xl"
      >
        <img src={familyUnited} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        <Sparkles className="opacity-60" density={25} color="hsl(var(--secondary))" />
        <div className="relative z-10 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-white/20">
              <SparkIcon className="w-3 h-3" /> AssurDignité
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight max-w-md drop-shadow-lg">
            Protégez votre famille dès aujourd'hui
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/85 max-w-md drop-shadow">
            Souscrivez en quelques minutes et offrez à vos proches une couverture obsèques digne et complète.
          </p>
          <Button
            onClick={() => navigate('/client/adhesion')}
            className="mt-5 bg-secondary hover:bg-secondary/90 text-white gap-2 shadow-lg"
            size="lg"
          >
            Souscrire maintenant <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl shadow-xl"
    >
      {/* Animated brand gradient */}
      <div
        className="absolute inset-0 animate-gradient-x bg-[length:200%_200%]"
        style={{
          backgroundImage:
            'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--sonam-blue)) 45%, hsl(var(--primary)) 100%)',
        }}
      />
      {/* Decorative concentric rings (mimics image 5 car insurance card) */}
      <svg
        className="absolute -right-12 -top-12 h-64 w-64 text-white/10"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden
      >
        {[40, 60, 80, 100].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <Sparkles className="opacity-50" density={20} color="hsl(var(--secondary))" />

      <div className="relative z-10 p-6 sm:p-8 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/70 font-medium">
              Contrat actif · AssurDignité
            </p>
            <h2 className="text-xl sm:text-2xl font-bold font-display drop-shadow">
              {FORMULE_NAMES[contract.formule] || contract.formule}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-white/85">{contract.police_number}</p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
          {[
            { label: 'Capital garanti', value: formatCFA(contract.capital_total) },
            { label: 'Prime annuelle', value: formatCFA(contract.prime_annuelle) },
            {
              label: 'Expiration',
              value: contract.date_expiration,
              icon: <Calendar className="w-3 h-3" />,
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-3 py-2.5"
            >
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/70">
                {s.label}
              </p>
              <p className="text-xs sm:text-sm font-bold mt-1 flex items-center gap-1 truncate">
                {s.icon}
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/client/contrats')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20"
          >
            Voir détails
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/client/documents')}
            className="bg-secondary hover:bg-secondary/90 text-white border-0 gap-1"
          >
            <FileText className="w-3 h-3" /> Documents
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
