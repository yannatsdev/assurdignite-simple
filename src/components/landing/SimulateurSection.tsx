import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Plus, Minus, AlertCircle, ChevronDown, ChevronUp, TrendingUp, Users, UserPlus, Shield, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { simulatePrime, formatCFA, OPTIONS_CAPITALS, type OptionKey, type SimulationResult } from '@/lib/actuarial-engine';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const formuleNames: Record<string, string> = { A: 'Dignité Simple', B: 'Serein', C: 'Prestige', D: 'Excellence' };
const formuleDescs: Record<string, string> = {
  A: 'Couverture essentielle à moindre coût',
  B: 'Protection élargie et capital confortable',
  C: 'Couverture premium complète et digne',
  D: 'Formule complète avec rapatriement, idéale pour la diaspora',
};

interface SimulateurSectionProps {
  /** Force-show the actuarial breakdown (PAP/PAI/PAC/Frais). When false, hidden for non-admins. */
  showActuarialBreakdown?: boolean;
}

export function SimulateurSection({ showActuarialBreakdown }: SimulateurSectionProps = {}) {
  const { role, user } = useAuth();
  const canSeeBreakdown = showActuarialBreakdown ?? role === 'admin';
  const [option, setOption] = useState<OptionKey>('D');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [principalDob, setPrincipalDob] = useState('');
  const [conjointIncluded, setConjointIncluded] = useState(false);
  const [conjointDob, setConjointDob] = useState('');
  const [enfants, setEnfants] = useState<{ dob: string; included: boolean }[]>([]);
  const [ascendants, setAscendants] = useState<{ dob: string; included: boolean; label: string }[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showFormules, setShowFormules] = useState(false);

  const addEnfant = () => { if (enfants.length < 4) setEnfants([...enfants, { dob: '', included: true }]); };
  const addAscendant = () => { if (ascendants.length < 2) setAscendants([...ascendants, { dob: '', included: true, label: ascendants.length === 0 ? 'Père/Mère' : 'Oncle/Tante' }]); };

  const handleSimulate = () => {
    if (!principalDob) return;
    const res = simulatePrime({ quoteDate, option, principal: { dob: principalDob }, conjoint: conjointIncluded ? { dob: conjointDob, included: true } : undefined, enfants, ascendants });
    setResult(res);
  };

  const pieData = [
    { name: 'Nature (70%)', value: 70, color: 'hsl(var(--primary))' },
    { name: 'Espèces (30%)', value: 30, color: 'hsl(var(--secondary))' },
  ];

  const barData = result?.persons.filter(p => p.eligible).map(p => ({
    name: p.label.length > 12 ? p.label.slice(0, 12) + '…' : p.label,
    prime: Math.round(p.primeAffichee),
  })) || [];

  return (
    <section id="simulateur" className="py-20 bg-gradient-to-b from-accent/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Simulateur</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 font-display">Calculez votre prime annuelle</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-4 max-w-2xl mx-auto">Estimez votre prime annuelle en quelques secondes selon votre situation familiale.</p>
        </motion.div>

        {/* Formule info accordion */}
        <div className="max-w-6xl mx-auto mb-8">
          <Button variant="outline" className="w-full gap-2 justify-between" onClick={() => setShowFormules(!showFormules)}>
            <span className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Découvrir les 4 formules AssurDignité</span>
            {showFormules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <AnimatePresence>
            {showFormules && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {(['A','B','C','D'] as OptionKey[]).map(k => {
                    const cap = OPTIONS_CAPITALS[k];
                    return (
                      <Card key={k} className={`${k === 'D' ? 'border-primary border-2 shadow-lg' : ''}`}>
                        <CardContent className="pt-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={k === 'D' ? 'default' : 'outline'}>Formule {k}</Badge>
                            {k === 'D' && <Badge className="bg-secondary text-xs">⭐ Populaire</Badge>}
                          </div>
                          <p className="font-bold font-display">{formuleNames[k]}</p>
                          <p className="text-xs text-muted-foreground">{formuleDescs[k]}</p>
                          <div className="space-y-1 text-xs pt-2 border-t">
                            <div className="flex justify-between"><span>Principal</span><span className="font-semibold">{formatCFA(cap.principal)}</span></div>
                            <div className="flex justify-between"><span>Conjoint</span><span className="font-semibold">{formatCFA(cap.conjoint)}</span></div>
                            <div className="flex justify-between"><span>Enfant</span><span className="font-semibold">{formatCFA(cap.enfant)}</span></div>
                            <div className="flex justify-between"><span>Ascendant</span><span className="font-semibold">{formatCFA(cap.ascendant)}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">Chaque formule inclut 70% de prestations en nature (cercueil, conservation, transport, inhumation) et 30% en capital espèces versé au(x) bénéficiaire(s).</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display"><Calculator className="w-5 h-5 text-primary" /> Paramètres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Date de souscription</Label><DateInput value={quoteDate} onChange={e => setQuoteDate(e)} /></div>
                <div>
                  <Label>Formule</Label>
                  <Select value={option} onValueChange={v => setOption(v as OptionKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['A','B','C','D'] as OptionKey[]).map(k => (
                        <SelectItem key={k} value={k}>{k} – {formuleNames[k]} {k === 'D' ? '⭐' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-accent/50 space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Assuré Principal *</Label>
                <DateInput value={principalDob} onChange={e => setPrincipalDob(e)} />
              </div>

              <div className="p-4 rounded-xl bg-accent/50 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Conjoint(e)</Label>
                  <Switch checked={conjointIncluded} onCheckedChange={setConjointIncluded} />
                </div>
                {conjointIncluded && <DateInput value={conjointDob} onChange={e => setConjointDob(e)} />}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4" /> Enfants ({enfants.length}/4)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addEnfant} disabled={enfants.length >= 4}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                </div>
                {enfants.map((e, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Label className="text-xs">Enfant {i + 1}</Label><DateInput value={e.dob} onChange={ev => { const n = [...enfants]; n[i].dob = ev; setEnfants(n); }} /></div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setEnfants(enfants.filter((_, j) => j !== i))}><Minus className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Ascendants ({ascendants.length}/2)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addAscendant} disabled={ascendants.length >= 2}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                </div>
                {ascendants.map((a, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Label className="text-xs">{a.label}</Label><DateInput value={a.dob} onChange={ev => { const n = [...ascendants]; n[i].dob = ev; setAscendants(n); }} /></div>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setAscendants(ascendants.filter((_, j) => j !== i))}><Minus className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>

              <Button className="w-full text-lg gap-2" size="lg" onClick={handleSimulate} disabled={!principalDob}>
                <Calculator className="w-5 h-5" /> Calculer ma prime
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {result ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {result.eligibilityErrors.length > 0 && (
                  <Card className="border-destructive"><CardContent className="pt-4 space-y-2">
                    {result.eligibilityErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{err}</div>
                    ))}
                  </CardContent></Card>
                )}

                <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl">
                  <CardContent className="pt-8 text-center">
                    <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Prime annuelle à payer</p>
                    <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl sm:text-5xl font-bold text-primary font-display">{formatCFA(result.primeAnnuelle)}</motion.p>
                    <div className="flex justify-center gap-3 mt-3">
                      <Badge variant="outline">Formule {option} – {formuleNames[option]}</Badge>
                      <Badge variant="outline" className="bg-secondary/10">{result.persons.filter(p => p.eligible).length} assuré(s)</Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Répartition couverture</CardTitle></CardHeader>
                    <CardContent className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ value }) => `${value}%`}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  {barData.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Prime par assuré</CardTitle></CardHeader>
                      <CardContent className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} layout="vertical">
                            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: number) => formatCFA(v)} />
                            <Bar dataKey="prime" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Tabs defaultValue="resume" className="w-full">
                  <TabsList className={`grid w-full ${canSeeBreakdown ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <TabsTrigger value="resume">Résumé</TabsTrigger>
                    {canSeeBreakdown && (
                      <TabsTrigger value="admin" className="gap-1"><Lock className="w-3 h-3" /> Détails administratifs</TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="resume">
                    <Card><CardContent className="pt-4 space-y-2">
                      {result.persons.map((p, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                          <div><p className="font-medium text-sm">{p.label}</p><p className="text-xs text-muted-foreground">{p.age} ans – Capital : {formatCFA(p.capital)}</p></div>
                          {p.eligible ? <p className="font-semibold text-sm text-primary">{formatCFA(Math.round(p.primeAffichee))}</p> : <Badge variant="destructive" className="text-xs">Non éligible</Badge>}
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 border-b border-border text-sm">
                        <div><p className="font-medium">Frais additionnels</p><p className="text-xs text-muted-foreground">Forfait annuel</p></div>
                        <p className="font-semibold text-primary">{formatCFA(result.accessoires)}</p>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-bold text-primary text-base">
                        <span>PRIME ANNUELLE TOTALE</span><span>{formatCFA(result.primeAnnuelle)}</span>
                      </div>
                    </CardContent></Card>
                  </TabsContent>
                  {canSeeBreakdown && (
                    <TabsContent value="admin">
                      <Card className="border-amber-300 bg-amber-50/30">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-amber-700 mb-2">
                            <Lock className="w-3 h-3" /> Section visible uniquement par les administrateurs SONAM VIE
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Σ PC (Prime Annuelle Commerciale, sans accessoire)</span><span className="font-mono">{formatCFA(result.papTotal)}</span></div>
                            <div className="flex justify-between"><span>Frais additionnels annuels</span><span className="font-mono">{formatCFA(result.accessoires)}</span></div>
                            <div className="flex justify-between font-bold text-primary pt-2 border-t border-amber-200"><span>= Prime annuelle TTC</span><span className="font-mono">{formatCFA(result.primeAnnuelle)}</span></div>
                            <div className="flex justify-between text-xs text-muted-foreground pt-1"><span>Engagement global Assureur</span><span className="font-mono">{formatCFA(result.engagementGlobal)}</span></div>
                            <div className="flex justify-between text-xs text-muted-foreground"><span>Durée du contrat</span><span className="font-mono">{result.duree} an(s)</span></div>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic pt-2">Modèle CIMA H · taux 3,5% · fc=0,15% du capital · fa=18% · accessoire annuel 2 500 FCFA (Note Technique 26/05/2026).</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>

                <Button className="w-full bg-secondary hover:bg-secondary/90 text-lg gap-2" size="lg" asChild>
                  <Link to={user ? '/client/adhesion' : '/login'} state={{ simResult: result }}>
                    <TrendingUp className="w-5 h-5" /> Souscrire maintenant
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-muted-foreground py-20">
                  <Calculator className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-display">Remplissez le formulaire pour voir votre simulation</p>
                  <p className="text-sm mt-2">Calcul basé sur la table CIMA H officielle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
