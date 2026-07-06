import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Check, Users, Baby, Heart, Wallet, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { OPTIONS_CAPITALS, simulatePrime, formatCFA, type OptionKey } from '@/lib/actuarial-engine';

interface Recommendation {
  formule: OptionKey;
  titre: string;
  justification: string;
  points: string[];
  alternative: OptionKey;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-formula`;

const STEPS = [
  { key: 'age', label: 'Quel âge avez-vous ?' },
  { key: 'famille', label: 'Votre situation familiale' },
  { key: 'budget', label: 'Votre budget annuel' },
] as const;

const formuleColor: Record<OptionKey, string> = {
  A: 'from-emerald-500 to-emerald-600',
  B: 'from-sky-500 to-sky-600',
  C: 'from-violet-500 to-violet-600',
  D: 'from-amber-500 to-amber-600',
};

const formuleNom: Record<OptionKey, string> = {
  A: 'Essentielle',
  B: 'Standard',
  C: 'Premium',
  D: 'Excellence Diaspora',
};

export function SmartRecommender() {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(38);
  const [hasConjoint, setHasConjoint] = useState(true);
  const [nbEnfants, setNbEnfants] = useState(2);
  const [nbAscendants, setNbAscendants] = useState(1);
  const [budget, setBudget] = useState(150000);
  const [loading, setLoading] = useState(false);
  const [reco, setReco] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setReco(null);
    setError(null);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          age,
          hasConjoint,
          nbEnfants,
          nbAscendants,
          budgetAnnuel: budget,
        }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || 'Erreur IA');
      }
      const data: Recommendation = await resp.json();
      setReco(data);
      setStep(3);
    } catch (e: any) {
      setError(e?.message || 'Erreur, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // Estimate the prime for recommended formula using the actuarial engine (grounding the AI text with real numbers)
  const estimatedPrime = (() => {
    if (!reco) return null;
    try {
      const today = new Date();
      const principalDob = new Date(today.getFullYear() - age, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      const conjointDob = principalDob; // approx same age for estimate
      const enfants = Array.from({ length: nbEnfants }, () => ({
        dob: new Date(today.getFullYear() - 8, 0, 1).toISOString().slice(0, 10),
        included: true,
      }));
      const ascendants = Array.from({ length: nbAscendants }, (_, i) => ({
        dob: new Date(today.getFullYear() - 70, 0, 1).toISOString().slice(0, 10),
        included: true,
        label: `Ascendant ${i + 1}`,
      }));
      const sim = simulatePrime({
        quoteDate: today.toISOString().slice(0, 10),
        option: reco.formule,
        principal: { dob: principalDob },
        conjoint: hasConjoint ? { dob: conjointDob, included: true } : undefined,
        enfants,
        ascendants,
      });
      return sim.primeAnnuelle;
    } catch {
      return null;
    }
  })();

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> Nouveau · Conseiller IA
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
            Quelle formule pour <span className="text-primary">votre famille</span> ?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Répondez à 3 questions, notre IA vous recommande la formule la plus adaptée en moins de 10 secondes.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress */}
          {!reco && (
            <div className="px-6 sm:px-10 pt-6">
              <div className="flex gap-2">
                {STEPS.map((s, i) => (
                  <div
                    key={s.key}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Étape {step + 1} sur {STEPS.length} — {STEPS[step].label}
              </p>
            </div>
          )}

          <div className="p-6 sm:p-10 min-h-[340px]">
            <AnimatePresence mode="wait">
              {/* STEP 0 — AGE */}
              {step === 0 && !reco && (
                <motion.div
                  key="step-age"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <Users className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="text-2xl font-bold font-display">Quel âge avez-vous ?</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold text-primary font-display">{age}</p>
                    <p className="text-muted-foreground">ans</p>
                  </div>
                  <Slider
                    min={18}
                    max={64}
                    step={1}
                    value={[age]}
                    onValueChange={(v) => setAge(v[0])}
                    className="px-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>18 ans</span>
                    <span>64 ans</span>
                  </div>
                </motion.div>
              )}

              {/* STEP 1 — FAMILY */}
              {step === 1 && !reco && (
                <motion.div
                  key="step-fam"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="text-2xl font-bold font-display">Votre famille</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setHasConjoint(true)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        hasConjoint
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold">En couple</p>
                      <p className="text-sm text-muted-foreground">Conjoint(e) à protéger</p>
                    </button>
                    <button
                      onClick={() => setHasConjoint(false)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        !hasConjoint
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold">Célibataire</p>
                      <p className="text-sm text-muted-foreground">Aucun conjoint à inclure</p>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Baby className="w-4 h-4 text-primary" />
                      <label className="font-semibold text-sm">Nombre d'enfants à charge : <span className="text-primary">{nbEnfants}</span></label>
                    </div>
                    <Slider min={0} max={8} step={1} value={[nbEnfants]} onValueChange={(v) => setNbEnfants(v[0])} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <label className="font-semibold text-sm">Ascendants à protéger : <span className="text-primary">{nbAscendants}</span></label>
                    </div>
                    <Slider min={0} max={4} step={1} value={[nbAscendants]} onValueChange={(v) => setNbAscendants(v[0])} />
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — BUDGET */}
              {step === 2 && !reco && (
                <motion.div
                  key="step-budget"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <Wallet className="w-12 h-12 text-primary mx-auto mb-3" />
                    <h3 className="text-2xl font-bold font-display">Votre budget annuel</h3>
                    <p className="text-sm text-muted-foreground mt-2">Une indication, pas un engagement.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary font-display">{formatCFA(budget)}</p>
                    <p className="text-muted-foreground">par an</p>
                  </div>
                  <Slider
                    min={30000}
                    max={500000}
                    step={5000}
                    value={[budget]}
                    onValueChange={(v) => setBudget(v[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>30 000 FCFA</span>
                    <span>500 000 FCFA</span>
                  </div>
                </motion.div>
              )}

              {/* RESULT */}
              {reco && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${formuleColor[reco.formule]} text-white text-2xl font-bold font-display mb-3 shadow-lg`}
                    >
                      {reco.formule}
                    </motion.div>
                    <p className="text-sm text-primary font-semibold">Formule recommandée par l'IA</p>
                    <h3 className="text-2xl sm:text-3xl font-bold font-display mt-1">
                      {formuleNom[reco.formule]}
                    </h3>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {formatCFA(OPTIONS_CAPITALS[reco.formule].principal)}
                    </p>
                    <p className="text-xs text-muted-foreground">capital principal assuré</p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 sm:p-5">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed italic">
                      « {reco.justification} »
                    </p>
                  </div>

                  {reco.points?.length > 0 && (
                    <ul className="space-y-2">
                      {reco.points.map((p, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  {estimatedPrime && (
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Prime annuelle estimée</p>
                      <p className="text-2xl font-bold text-primary font-display">{formatCFA(estimatedPrime)}</p>
                      <p className="text-xs text-muted-foreground">Calcul actuariel CIMA H · paiement annuel</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild size="lg" className="flex-1 gap-2">
                      <a href={`/client/souscrire?formule=${reco.formule}`}>
                        Souscrire la {reco.formule} <ArrowRight className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="lg" onClick={reset} className="gap-2">
                      <RotateCcw className="w-4 h-4" /> Recommencer
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Alternative à considérer : <a href="#formules" className="text-primary font-semibold hover:underline">Formule {reco.alternative} — {formuleNom[reco.alternative]}</a>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {!reco && (
            <div className="px-6 sm:px-10 py-5 bg-muted/30 border-t border-border flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || loading}
              >
                Précédent
              </Button>
              {error && <p className="text-xs text-destructive flex-1 text-center">{error}</p>}
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="gap-2">
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={loading} className="gap-2 min-w-[180px]">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyse IA…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Recommander ma formule</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
