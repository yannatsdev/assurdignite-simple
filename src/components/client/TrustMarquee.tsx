import { ShieldCheck, Clock, Users, Lock, Award, Heart } from 'lucide-react';
import { Marquee } from '@/components/ui/marquee';

const items = [
  { icon: ShieldCheck, text: 'Agréé CIMA' },
  { icon: Clock, text: 'Versement sous 15j ouvrés' },
  { icon: Users, text: '50 000+ familles protégées' },
  { icon: Lock, text: 'Paiement sécurisé' },
  { icon: Award, text: 'Ristourne Fidélité 30%' },
  { icon: Heart, text: 'Dignité garantie' },
];

export function TrustMarquee({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-background to-secondary/5 py-2.5 ${className || ''}`}
    >
      <Marquee speed={45} pauseOnHover>
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 text-xs sm:text-sm text-foreground/80"
          >
            <it.icon className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium whitespace-nowrap">{it.text}</span>
            <span className="text-primary/40 ml-2">•</span>
          </div>
        ))}
      </Marquee>
      {/* Edge fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
