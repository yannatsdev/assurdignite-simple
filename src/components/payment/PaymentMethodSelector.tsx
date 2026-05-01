import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CreditCard, Landmark, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast as sonnerToast } from 'sonner';
import waveLogo from '@/assets/operators/wave-circle.svg';
import orangeLogo from '@/assets/operators/orange-circle.svg';
import mtnLogo from '@/assets/operators/mtn-circle.svg';
import moovLogo from '@/assets/operators/moov-circle.svg';

export type PaymentMethodKey =
  | 'wave' | 'orange_money' | 'mtn_momo' | 'moov_money'
  | 'card' | 'virement';

interface SubmitPayload {
  method: PaymentMethodKey;
  reference: string;
}

interface Props {
  amount: string;
  rib?: { bank: string; iban: string; reference: string };
  onSubmit: (p: SubmitPayload) => Promise<void> | void;
  loading?: boolean;
}

const operators: { key: PaymentMethodKey; label: string; logo: string }[] = [
  { key: 'wave', label: 'Wave', logo: waveLogo },
  { key: 'orange_money', label: 'Orange Money', logo: orangeLogo },
  { key: 'mtn_momo', label: 'MTN MoMo', logo: mtnLogo },
  { key: 'moov_money', label: 'Moov Money', logo: moovLogo },
];

export function PaymentMethodSelector({ amount, rib, onSubmit, loading }: Props) {
  const [tab, setTab] = useState<'mobile' | 'card' | 'virement'>('mobile');
  const [mobileOp, setMobileOp] = useState<PaymentMethodKey | null>(null);
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const [virementRef, setVirementRef] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    sonnerToast.success('Copié ✓');
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs = [
    { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
    { id: 'card', label: 'Carte bancaire', icon: CreditCard },
    { id: 'virement', label: 'Virement (RIB)', icon: Landmark },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header amount */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border border-primary/20 p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Prime annuelle à régler</p>
        <p className="text-3xl font-bold font-display text-primary mt-1">{amount}</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                active
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {tab === 'mobile' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choisissez votre opérateur :</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {operators.map(op => {
                  const sel = mobileOp === op.key;
                  return (
                    <button
                      key={op.key}
                      type="button"
                      onClick={() => setMobileOp(op.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        sel ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <img src={op.logo} alt={op.label} className="w-14 h-14 rounded-full" />
                      <span className="text-xs font-medium">{op.label}</span>
                    </button>
                  );
                })}
              </div>

              {mobileOp && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 rounded-xl border border-border p-4 bg-card"
                >
                  <Label>Numéro Mobile Money</Label>
                  <Input
                    type="tel"
                    placeholder="+225 07 00 00 00 00"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                  <Button
                    className="w-full gap-2"
                    disabled={!phone.trim() || loading}
                    onClick={() => onSubmit({ method: mobileOp, reference: phone.trim() })}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Payer maintenant
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Vous recevrez une notification de votre opérateur pour confirmer la transaction.
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {tab === 'card' && (
            <div className="space-y-3 rounded-xl border border-border p-4 bg-card">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold tracking-wide">VISA</span>
                <span className="px-2.5 py-1 rounded bg-orange-500 text-white text-xs font-bold tracking-wide">Mastercard</span>
              </div>
              <div>
                <Label>Numéro de carte</Label>
                <Input
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={e => setCard({ ...card, number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiration</Label>
                  <Input placeholder="MM/AA" maxLength={5} value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input inputMode="numeric" maxLength={4} placeholder="123" value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Nom du porteur</Label>
                <Input placeholder="NOM PRÉNOM" value={card.holder} onChange={e => setCard({ ...card, holder: e.target.value.toUpperCase() })} />
              </div>
              <Button
                className="w-full gap-2 mt-2"
                disabled={!card.number || !card.expiry || !card.cvv || !card.holder || loading}
                onClick={() => onSubmit({ method: 'card', reference: `CARD-${card.number.slice(-4)}` })}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Payer {amount}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">🔒 Paiement sécurisé · Vos données ne sont pas stockées.</p>
            </div>
          )}

          {tab === 'virement' && (
            <div className="space-y-3">
              {rib && (
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="space-y-2">
                    {[
                      { l: 'Banque', v: rib.bank },
                      { l: 'IBAN', v: rib.iban },
                      { l: 'Référence à indiquer', v: rib.reference },
                    ].map(row => (
                      <div key={row.l} className="flex items-center justify-between gap-3 bg-card rounded-lg p-3 border border-border">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.l}</p>
                          <p className="font-mono text-sm font-semibold truncate">{row.v}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-1 shrink-0" onClick={() => copy(row.l, row.v)}>
                          {copied === row.l ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-xs">Copier</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-border p-4 bg-card space-y-3">
                <Label>Référence du virement effectué</Label>
                <Input
                  placeholder="Ex : TXN-987654 ou nom du titulaire"
                  value={virementRef}
                  onChange={e => setVirementRef(e.target.value)}
                />
                <Button
                  className="w-full gap-2"
                  disabled={!virementRef.trim() || loading}
                  onClick={() => onSubmit({ method: 'virement', reference: virementRef.trim() })}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  J'ai effectué le virement
                </Button>
                <p className="text-[11px] text-muted-foreground">Notre équipe validera votre paiement sous 24h ouvrées.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
