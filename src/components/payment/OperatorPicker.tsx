import * as React from 'react';
import orange from '@/assets/orange.svg';
import wave from '@/assets/wave.svg';
import mtn from '@/assets/mtn.svg';
import moov from '@/assets/moov.svg';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type Operator = {
  id: 'orange_money' | 'wave' | 'mtn_momo' | 'moov_money';
  name: string;
  logo: string;
  ring: string; // tailwind class for selected ring
};

export const OPERATORS: Operator[] = [
  { id: 'orange_money', name: 'Orange Money', logo: orange, ring: 'ring-orange-500' },
  { id: 'wave',         name: 'Wave',         logo: wave,   ring: 'ring-cyan-500' },
  { id: 'mtn_momo',     name: 'MTN MoMo',     logo: mtn,    ring: 'ring-yellow-500' },
  { id: 'moov_money',   name: 'Moov Money',   logo: moov,   ring: 'ring-blue-600' },
];

interface Props {
  value?: Operator['id'];
  onChange: (op: Operator) => void;
}

export const OperatorPicker: React.FC<Props> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {OPERATORS.map(op => {
      const selected = value === op.id;
      return (
        <button
          key={op.id}
          type="button"
          onClick={() => onChange(op)}
          className={cn(
            'relative group flex flex-col items-center gap-2 p-4 rounded-2xl border bg-white transition-all duration-200',
            'hover:shadow-lg hover:-translate-y-0.5',
            selected ? `border-transparent ring-2 ${op.ring} shadow-lg` : 'border-border'
          )}
        >
          {selected && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <Check className="w-3 h-3" />
            </span>
          )}
          <img src={op.logo} alt={op.name} className="w-14 h-14 rounded-full object-contain" />
          <span className="text-xs font-medium text-center">{op.name}</span>
        </button>
      );
    })}
  </div>
);
