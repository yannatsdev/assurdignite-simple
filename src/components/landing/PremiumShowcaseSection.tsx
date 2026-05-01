import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, HeartHandshake, Sparkles as SparklesIcon, Clock, Award, Users2 } from 'lucide-react';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import { Marquee } from '@/components/ui/marquee';
import { Sparkles } from '@/components/ui/sparkles';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import familyUnited from '@/assets/banners/family-united.jpg';
import familyMother from '@/assets/banners/family-mother.jpg';
import familyElderly from '@/assets/banners/family-elderly.jpg';
import familyPro from '@/assets/banners/family-pro.jpg';
import fastPayout from '@/assets/banners/fast-payout.jpg';
import orangeLogo from '@/assets/operators/orange-money.svg';
import waveLogo from '@/assets/operators/wave.svg';
import mtnLogo from '@/assets/operators/mtn-momo.svg';
import moovLogo from '@/assets/operators/moov-money.svg';

const partners = [
  { name: 'Orange Money', logo: orangeLogo },
  { name: 'Wave', logo: waveLogo },
  { name: 'MTN MoMo', logo: mtnLogo },
  { name: 'Moov Money', logo: moovLogo },
];

export function PremiumShowcaseSection() {
  const beamContainer = useRef<HTMLDivElement>(null);
  const beamFrom = useRef<HTMLDivElement>(null);
  const beamTo = useRef<HTMLDivElement>(null);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-background via-accent/30 to-background">
      {/* Sparkles background */}
      <Sparkles className="opacity-60" density={45} />
      {/* Soft gradient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/20 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/15 text-secondary font-bold text-sm uppercase tracking-wider">
            <SparklesIcon className="w-4 h-4" /> Pourquoi AssurDignité
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mt-4">
            Une protection <span className="bg-gradient-to-r from-primary via-sonam-blue to-secondary bg-clip-text text-transparent animate-gradient-x bg-[length:200%_200%]">premium</span> pour votre famille
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mt-4">
            La sérénité d'une couverture conçue avec dignité, pour chaque génération de votre foyer.
          </p>
        </motion.div>

        {/* Bento grid */}
        <BentoGrid className="max-w-6xl mx-auto sm:auto-rows-[16rem]">
          <BentoCard
            span="sm:col-span-2 sm:row-span-2"
            title="Familles unies, protégées ensemble"
            description="Couverture étendue pour le principal, le conjoint, jusqu'à 4 enfants et 2 ascendants. Une seule prime annuelle, toute la famille protégée."
            icon={<HeartHandshake className="w-5 h-5" />}
            background={
              <img src={familyUnited} alt="Famille africaine unie protégée par AssurDignité" className="h-full w-full object-cover" loading="lazy" />
            }
            delay={0}
          />
          <BentoCard
            title="Délai < 12h"
            description="Versement express après dépôt et analyse des pièces requises."
            icon={<Clock className="w-5 h-5" />}
            background={
              <img src={fastPayout} alt="Conseiller AssurDignité — versement express" className="h-full w-full object-cover" loading="lazy" />
            }
            delay={0.1}
          />
          <BentoCard
            title="Bonus Fidélité"
            description="Jusqu'à 30% de vos primes restituées après 3 années consécutives sans sinistre."
            icon={<Award className="w-5 h-5" />}
            background={
              <img src={familyPro} alt="Professionnel africain rassuré" className="h-full w-full object-cover" loading="lazy" />
            }
            delay={0.15}
          />
          <BentoCard
            span="sm:col-span-3"
            title="Dignité jusqu'au dernier souffle"
            description="Prestations en nature 70% (cercueil, conservation, transport, inhumation) + 30% en capital espèces aux bénéficiaires."
            icon={<Users2 className="w-5 h-5" />}
            background={
              <img src={familyElderly} alt="Personnes âgées africaines respectées" className="h-full w-full object-cover" loading="lazy" />
            }
            delay={0.25}
          />
        </BentoGrid>

        {/* Partner marquee */}
        <div className="mt-16 max-w-5xl mx-auto">
          <p className="text-center text-sm text-muted-foreground uppercase tracking-wider mb-5">
            Paiement Mobile Money — sécurisé & instantané
          </p>
          <div className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-md py-6 overflow-hidden">
            {/* Edge fade */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-card to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-card to-transparent z-10" />
            <Marquee speed={28} pauseOnHover>
              {[...partners, ...partners].map((p, i) => (
                <div key={`${p.name}-${i}`} className="flex items-center gap-3 px-8">
                  <img src={p.logo} alt={p.name} className="h-12 w-12 object-contain" loading="lazy" />
                  <span className="font-semibold text-foreground/80">{p.name}</span>
                </div>
              ))}
            </Marquee>
          </div>
        </div>

        {/* Animated beam diagram */}
        <div ref={beamContainer} className="relative mt-16 max-w-3xl mx-auto h-40 sm:h-48 hidden sm:flex items-center justify-between rounded-3xl border border-border bg-card/60 backdrop-blur-md px-8 sm:px-16">
          <div ref={beamFrom} className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-sonam shadow-premium flex items-center justify-center text-white">
            <Users2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card border-2 border-primary/30 shadow-soft flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div ref={beamTo} className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary shadow-premium flex items-center justify-center text-white">
            <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <AnimatedBeam containerRef={beamContainer} fromRef={beamFrom} toRef={beamTo} curvature={40} duration={3} />
        </div>
      </div>
    </section>
  );
}
