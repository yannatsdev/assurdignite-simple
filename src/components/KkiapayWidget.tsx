import { useEffect, useRef, useState } from 'react';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCFA } from '@/lib/actuarial-engine';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    addSuccessListener?: (cb: (response: any) => void) => void;
    addFailedListener?: (cb: (response: any) => void) => void;
    removeKkiapayListener?: (event: string, cb: any) => void;
    openKkiapayWidget?: (opts: any) => void;
  }
}

interface Props {
  amount: number;
  publicKey?: string;
  email?: string;
  phone?: string;
  name?: string;
  onSuccess?: (resp: any) => void;
  onFailed?: (resp: any) => void;
  sandbox?: boolean;
  label?: string;
  disabled?: boolean;
}

const KKIAPAY_SCRIPT = 'https://cdn.kkiapay.me/k.js';

function loadKkiapayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    if (typeof window.openKkiapayWidget === 'function') return resolve();
    const existing = document.querySelector(`script[src="${KKIAPAY_SCRIPT}"]`) as HTMLScriptElement | null;
    if (existing) {
      const start = Date.now();
      const tick = () => {
        if (typeof window.openKkiapayWidget === 'function') return resolve();
        if (Date.now() - start > 8000) return reject(new Error('KkiaPay timeout'));
        setTimeout(tick, 100);
      };
      tick();
      return;
    }
    const s = document.createElement('script');
    s.src = KKIAPAY_SCRIPT;
    s.async = true;
    s.onload = () => {
      const start = Date.now();
      const tick = () => {
        if (typeof window.openKkiapayWidget === 'function') return resolve();
        if (Date.now() - start > 5000) return reject(new Error('KkiaPay function not exposed'));
        setTimeout(tick, 80);
      };
      tick();
    };
    s.onerror = () => reject(new Error('KkiaPay script failed to load'));
    document.head.appendChild(s);
  });
}

export function KkiapayWidget({
  amount,
  publicKey = 'c0270ce321b4edc06e0127ac06829afd3c45f6c6',
  email,
  phone,
  name,
  onSuccess,
  onFailed,
  sandbox = true,
  label,
  disabled,
}: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const successCb = useRef(onSuccess);
  const failedCb = useRef(onFailed);
  successCb.current = onSuccess;
  failedCb.current = onFailed;

  useEffect(() => {
    let cancelled = false;
    loadKkiapayScript()
      .then(() => { if (!cancelled) setScriptReady(true); })
      .catch((e) => { if (!cancelled) setScriptError(e.message); });

    const onSuccessHandler = (resp: any) => {
      setProcessing(false);
      successCb.current?.(resp);
    };
    const onFailedHandler = (resp: any) => {
      setProcessing(false);
      failedCb.current?.(resp);
    };

    const attachListeners = () => {
      if (typeof window.addSuccessListener === 'function') {
        window.addSuccessListener(onSuccessHandler);
        window.addFailedListener?.(onFailedHandler);
        return true;
      }
      return false;
    };

    if (!attachListeners()) {
      const start = Date.now();
      const iv = setInterval(() => {
        if (attachListeners() || Date.now() - start > 8000) clearInterval(iv);
      }, 150);
      return () => { cancelled = true; clearInterval(iv); };
    }

    return () => { cancelled = true; };
  }, []);

  const handleClick = () => {
    if (!scriptReady || !window.openKkiapayWidget) return;
    setProcessing(true);
    try {
      window.openKkiapayWidget({
        amount: Math.round(amount),
        api_key: publicKey,
        key: publicKey,
        sandbox,
        position: 'center',
        theme: '#4A0E78',
        name: name || '',
        email: email || '',
        phone: phone || '',
        data: JSON.stringify({ name, email, phone }),
      });
    } catch (e) {
      setProcessing(false);
      setScriptError(e instanceof Error ? e.message : 'Erreur KkiaPay');
    }
  };

  if (scriptError) {
    return (
      <div className="text-center text-sm text-destructive p-3 rounded-lg border border-destructive/30 bg-destructive/5">
        Impossible de charger le module de paiement. Vérifiez votre connexion et réessayez.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        disabled={!scriptReady || processing || disabled || amount <= 0}
        className="w-full sm:w-auto min-w-[260px] gap-2 bg-gradient-to-r from-primary to-[hsl(var(--sonam-blue))] hover:opacity-95 text-white shadow-lg hover:shadow-xl transition-all"
      >
        {!scriptReady ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</>
        ) : processing ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Paiement en cours…</>
        ) : (
          <><CreditCard className="w-4 h-4" /> {label || `Payer ${formatCFA(amount)}`}</>
        )}
      </Button>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 text-secondary" /> Paiement sécurisé KkiaPay — Wave, Orange, MTN, Moov, Carte bancaire
      </p>
    </div>
  );
}
