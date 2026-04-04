import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { simulatePrime, formatCFA, type OptionKey, type SimulationResult } from '@/lib/actuarial-engine';

export function SimulateurSection() {
  const [option, setOption] = useState<OptionKey>('B');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [principalDob, setPrincipalDob] = useState('');
  const [conjointIncluded, setConjointIncluded] = useState(false);
  const [conjointDob, setConjointDob] = useState('');
  const [enfants, setEnfants] = useState<{ dob: string; included: boolean }[]>([]);
  const [ascendants, setAscendants] = useState<{ dob: string; included: boolean; label: string }[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const addEnfant = () => { if (enfants.length < 4) setEnfants([...enfants, { dob: '', included: true }]); };
  const addAscendant = () => { if (ascendants.length < 2) setAscendants([...ascendants, { dob: '', included: true, label: ascendants.length === 0 ? 'Père/Mère' : 'Oncle/Tante' }]); };

  const handleSimulate = () => {
    if (!principalDob) return;
    const res = simulatePrime({
      quoteDate,
      option,
      principal: { dob: principalDob },
      conjoint: conjointIncluded ? { dob: conjointDob, included: true } : undefined,
      enfants,
      ascendants,
    });
    setResult(res);
  };

  return (
    <section id="simulateur" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Simulateur</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 font-display">Calculez votre prime annuelle</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Moteur actuariel CIMA H intégré. Résultats instantanés et détaillés.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display"><Calculator className="w-5 h-5 text-primary" /> Paramètres de simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de souscription</Label>
                  <Input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} />
                </div>
                <div>
                  <Label>Formule</Label>
                  <Select value={option} onValueChange={v => setOption(v as OptionKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A – Dignité Simple</SelectItem>
                      <SelectItem value="B">B – Serein</SelectItem>
                      <SelectItem value="C">C – Prestige</SelectItem>
                      <SelectItem value="D">D – Excellence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Principal */}
              <div className="p-4 rounded-xl bg-accent/50 space-y-3">
                <Label className="text-base font-semibold">Assuré Principal *</Label>
                <Input type="date" value={principalDob} onChange={e => setPrincipalDob(e.target.value)} />
              </div>

              {/* Conjoint */}
              <div className="p-4 rounded-xl bg-accent/50 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Conjoint(e)</Label>
                  <Switch checked={conjointIncluded} onCheckedChange={setConjointIncluded} />
                </div>
                {conjointIncluded && <Input type="date" value={conjointDob} onChange={e => setConjointDob(e.target.value)} />}
              </div>

              {/* Enfants */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Enfants ({enfants.length}/4)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addEnfant} disabled={enfants.length >= 4}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                </div>
                {enfants.map((e, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Enfant {i + 1} – Date de naissance</Label>
                      <Input type="date" value={e.dob} onChange={ev => { const n = [...enfants]; n[i].dob = ev.target.value; setEnfants(n); }} />
                    </div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEnfants(enfants.filter((_, j) => j !== i))}><Minus className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Ascendants */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Ascendants ({ascendants.length}/2)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addAscendant} disabled={ascendants.length >= 2}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                </div>
                {ascendants.map((a, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">{a.label} – Date de naissance</Label>
                      <Input type="date" value={a.dob} onChange={ev => { const n = [...ascendants]; n[i].dob = ev.target.value; setAscendants(n); }} />
                    </div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setAscendants(ascendants.filter((_, j) => j !== i))}><Minus className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>

              <Button className="w-full text-lg gap-2" size="lg" onClick={handleSimulate} disabled={!principalDob}>
                <Calculator className="w-5 h-5" /> Calculer ma prime
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Errors */}
                {result.eligibilityErrors.length > 0 && (
                  <Card className="border-destructive mb-4">
                    <CardContent className="pt-4 space-y-2">
                      {result.eligibilityErrors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{err}</div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Prime */}
                <Card className="border-2 border-primary bg-primary/5">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Prime annuelle à payer</p>
                    <p className="text-4xl md:text-5xl font-bold text-primary font-display">{formatCFA(result.primeAnnuelle)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Formule {option} – Paiement annuel</p>
                  </CardContent>
                </Card>

                {/* Détails */}
                <Card>
                  <CardHeader><CardTitle className="text-lg font-display">Ventilation détaillée</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {result.persons.map((p, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium text-sm">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.age} ans – Capital : {formatCFA(p.capital)}</p>
                        </div>
                        <div className="text-right">
                          {p.eligible ? (
                            <p className="font-semibold text-sm">{formatCFA(Math.round(p.pap))}</p>
                          ) : (
                            <span className="text-xs text-destructive">Non éligible</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Calcul */}
                <Card>
                  <CardHeader><CardTitle className="text-lg font-display">Détail du calcul</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>PAP Total (Prime Pure)</span><span className="font-medium">{formatCFA(result.papTotal)}</span></div>
                    <div className="flex justify-between"><span>PAI (Prime Inventaire) × 1.002</span><span className="font-medium">{formatCFA(result.pai)}</span></div>
                    <div className="flex justify-between"><span>PAC (Prime Commerciale) ÷ 0.85</span><span className="font-medium">{formatCFA(result.pac)}</span></div>
                    <div className="flex justify-between"><span>Frais fixes annuels</span><span className="font-medium">{formatCFA(2500)}</span></div>
                    <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
                      <span>Prime Annuelle Due</span><span className="text-primary">{formatCFA(result.primeAnnuelle)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full bg-secondary hover:bg-secondary/90 text-lg" size="lg" asChild>
                  <a href="/souscrire">Souscrire maintenant</a>
                </Button>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground py-20">
                  <Calculator className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Remplissez le formulaire pour voir votre simulation</p>
                  <p className="text-sm mt-2">Le calcul est basé sur la table CIMA H officielle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
