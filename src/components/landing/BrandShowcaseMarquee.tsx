import { motion } from 'framer-motion';
import { Smartphone, Stethoscope, HandHeart, Banknote, Plane, FileSignature, LucideIcon } from 'lucide-react';
import imgMobile from '@/assets/marquee/souscription-mobile.jpg';
import imgConseil from '@/assets/marquee/conseiller-agence.jpg';
import imgAssist from '@/assets/marquee/assistance-recueillie.jpg';
import imgFamille from '@/assets/marquee/famille-serenite.jpg';
import imgDiaspora from '@/assets/marquee/diaspora-avion.jpg';
import imgSignature from '@/assets/marquee/signature-contrat.jpg';

type Card = {
  image: string;
  icon: LucideIcon;
  title: string;
  text: string;
};

const cards: Card[] = [
  { image: imgMobile, icon: Smartphone, title: 'Souscription 100 % mobile', text: 'Scan CNI, signature et paiement MoMo en moins de 10 minutes.' },
  { image: imgConseil, icon: HandHeart, title: 'Accompagnement humain', text: 'Un conseiller dédié pour chaque famille, 6 jours sur 7.' },
  { image: imgAssist, icon: Stethoscope, title: 'Assistance renforcée', text: 'Soins du dernier souffle, transport médicalisé, soutien psychologique.' },
  { image: imgFamille, icon: Banknote, title: 'Capital jusqu’à 5 M FCFA', text: 'Formules A à D Excellence — adaptez la couverture à votre budget.' },
  { image: imgDiaspora, icon: Plane, title: 'Rapatriement international', text: 'Spécial diaspora : retour au pays organisé et pris en charge.' },
  { image: imgSignature, icon: FileSignature, title: 'Contrat clair & sans surprise', text: 'CGV transparentes, certifiées CIMA, lisibles en 2 minutes.' },
];

interface Props {
  className?: string;
  variant?: 'default' | 'compact';
  speed?: number; // seconds
}

export function BrandShowcaseMarquee({ className = '', variant = 'default', speed = 45 }: Props) {
  const isCompact = variant === 'compact';
  const cardW = isCompact ? 'w-[260px] sm:w-[300px]' : 'w-[300px] sm:w-[380px]';
  const cardH = isCompact ? 'h-[200px] sm:h-[220px]' : 'h-[240px] sm:h-[280px]';
  const titleSize = isCompact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-background to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="group flex gap-6"
        style={{ ['--gap' as any]: '1.5rem', ['--duration' as any]: `${speed}s` }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="flex shrink-0 gap-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          >
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <article
                  key={`${copy}-${i}`}
                  className={`relative shrink-0 ${cardW} ${cardH} rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-card`}
                >
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[6s] ease-out hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-secondary/15" />

                  <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                      AssurDignité
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-white">
                    <h3 className={`${titleSize} font-bold font-display leading-tight drop-shadow-lg`}>
                      {c.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-white/85 leading-snug drop-shadow">
                      {c.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default BrandShowcaseMarquee;
