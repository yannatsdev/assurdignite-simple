import { motion } from 'framer-motion';
import { CreditCard, BookOpen, Car, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type DocType = 'cni' | 'passport' | 'permis' | 'sejour';

const OPTIONS: { id: DocType; label: string; icon: React.ElementType }[] = [
  { id: 'cni', label: "Carte d'identité nationale", icon: CreditCard },
  { id: 'passport', label: 'Passeport', icon: BookOpen },
  { id: 'permis', label: 'Permis de conduire', icon: Car },
  { id: 'sejour', label: 'Permis de séjour', icon: Home },
];

interface Props {
  value: DocType;
  onChange: (v: DocType) => void;
  onNext: () => void;
}

export function DocumentTypeStep({ value, onChange, onNext }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display leading-tight">
          Quel document allez-vous utiliser ?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous devez avoir une pièce d'identité officielle du gouvernement.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all ${
                selected
                  ? 'border-primary bg-primary/5 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.35)]'
                  : 'border-border bg-muted/40 hover:border-primary/40'
              }`}
            >
              <Icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-foreground'}`} />
              <span className="flex-1 text-left font-medium">{opt.label}</span>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected ? 'border-primary' : 'border-muted-foreground/40'
                }`}
              >
                {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Pays du document</p>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/60">
          <span className="text-2xl">🇨🇮</span>
          <span className="font-medium">Côte d'Ivoire</span>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full h-14 rounded-2xl text-base font-semibold">
        Continuer
      </Button>
    </motion.div>
  );
}
