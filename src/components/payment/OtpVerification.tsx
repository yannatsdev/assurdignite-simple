import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  phone: string;
  operatorName: string;
  onVerified: () => void;
  onBack?: () => void;
}

export const OtpVerification: React.FC<Props> = ({ phone, operatorName, onVerified, onBack }) => {
  const [code] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [input, setInput] = useState('');
  const [seconds, setSeconds] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async () => {
    setError(null);
    if (input.replace(/\s/g, '') !== code) {
      setError('Code incorrect. Réessayez.');
      return;
    }
    setVerifying(true);
    await new Promise(r => setTimeout(r, 800));
    setVerifying(false);
    onVerified();
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-display text-lg font-semibold">Vérification {operatorName}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Un code à 6 chiffres a été envoyé au <span className="font-semibold">{phone}</span>
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
        <p className="text-xs text-amber-700">Mode test — utilisez ce code de simulation :</p>
        <p className="font-mono text-2xl font-bold tracking-[0.4em] text-amber-900 mt-1">{code}</p>
      </div>

      <div>
        <Label>Code de vérification</Label>
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          className={cn('text-center text-2xl tracking-[0.4em] font-mono h-14 mt-1', error && 'border-red-400')}
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{seconds > 0 ? `Renvoi possible dans ${seconds}s` : 'Vous pouvez renvoyer le code'}</span>
        <button
          type="button"
          disabled={seconds > 0}
          onClick={() => setSeconds(60)}
          className="flex items-center gap-1 disabled:opacity-40 hover:text-primary"
        >
          <RotateCcw className="w-3 h-3" /> Renvoyer
        </button>
      </div>

      <div className="flex gap-2">
        {onBack && <Button type="button" variant="outline" onClick={onBack} className="flex-1">Retour</Button>}
        <Button onClick={submit} disabled={input.length !== 6 || verifying} className="flex-1 gap-2">
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Valider
        </Button>
      </div>
    </div>
  );
};
