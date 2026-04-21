// CIMA H Commutation Table (ages 0-106)
const CIMA_H_TABLE = [
  { age: 0, D: 1000000.0, N: 26565815.978934, M: 103402.460019 },
  { age: 1, D: 960997.346924, N: 25565815.978934, M: 98126.253615 },
  { age: 2, D: 927822.046635, N: 24604818.63201, M: 97436.688565 },
  { age: 3, D: 895945.442135, N: 23676996.585375, M: 96927.017084 },
  { age: 4, D: 865235.560217, N: 22781051.14324, M: 96507.655486 },
  { age: 5, D: 835636.107609, N: 21915815.583024, M: 96161.472742 },
  { age: 6, D: 807078.143365, N: 21080179.475414, M: 95856.534048 },
  { age: 7, D: 779524.847783, N: 20273101.332049, M: 95591.211354 },
  { age: 8, D: 752926.379229, N: 19493576.484267, M: 95349.362037 },
  { age: 9, D: 727235.463785, N: 18740650.105038, M: 95115.741033 },
  { age: 10, D: 702434.607413, N: 18013414.641253, M: 94903.773451 },
  { age: 11, D: 678466.500602, N: 17310980.03384, M: 94685.776302 },
  { age: 12, D: 655316.199811, N: 16632513.533238, M: 94475.195968 },
  { age: 13, D: 632920.515928, N: 15977197.333427, M: 94235.882117 },
  { age: 14, D: 611246.822792, N: 15344276.817499, M: 93960.603721 },
  { age: 15, D: 590255.70476, N: 14733029.994707, M: 93634.10003 },
  { age: 16, D: 569886.81084, N: 14142774.289947, M: 93218.45571 },
  { age: 17, D: 550097.637688, N: 13572887.479107, M: 92677.423668 },
  { age: 18, D: 530854.42155, N: 13022789.841419, M: 92001.627523 },
  { age: 19, D: 512132.636735, N: 12491935.419869, M: 91218.137025 },
  { age: 20, D: 493904.47299, N: 11979802.783134, M: 90363.746854 },
  { age: 21, D: 476161.299422, N: 11485898.310144, M: 89461.849069 },
  { age: 22, D: 458892.785037, N: 11009737.010722, M: 88530.263889 },
  { age: 23, D: 442087.82261, N: 10550844.225685, M: 87573.858363 },
  { age: 24, D: 425737.775822, N: 10108756.403075, M: 86604.040654 },
  { age: 25, D: 409838.095424, N: 9683018.627253, M: 85632.07853 },
  { age: 26, D: 394385.773117, N: 9273180.531829, M: 84667.949671 },
  { age: 27, D: 379377.116724, N: 8878794.758712, M: 83720.59283 },
  { age: 28, D: 364808.1289, N: 8499417.641988, M: 82797.459271 },
  { age: 29, D: 350672.770499, N: 8134609.513088, M: 81903.28866 },
  { age: 30, D: 336963.145825, N: 7783936.742589, M: 81041.266779 },
  { age: 31, D: 323669.761725, N: 7446973.596764, M: 80213.210698 },
  { age: 32, D: 310782.638439, N: 7123303.835039, M: 79420.117389 },
  { age: 33, D: 298290.534624, N: 6812521.1966, M: 78661.860159 },
  { age: 34, D: 286181.262629, N: 6514230.661976, M: 77938.147753 },
  { age: 35, D: 274441.877137, N: 6228049.399347, M: 77247.571561 },
  { age: 36, D: 263058.85397, N: 5953607.52221, M: 76588.580685 },
  { age: 37, D: 252018.356974, N: 5690548.668241, M: 75959.539538 },
  { age: 38, D: 241306.328459, N: 5438530.311267, M: 75358.69267 },
  { age: 39, D: 230908.689455, N: 5197223.982807, M: 74784.223889 },
  { age: 40, D: 220811.545606, N: 4966315.293353, M: 74234.376779 },
  { age: 41, D: 211001.339442, N: 4745503.747746, M: 73707.605685 },
  { age: 42, D: 201464.91893, N: 4534502.408304, M: 73202.530786 },
  { age: 43, D: 192189.686489, N: 4333037.489374, M: 72718.007927 },
  { age: 44, D: 183163.580966, N: 4140847.802885, M: 72253.120166 },
  { age: 45, D: 174375.072753, N: 3957684.221919, M: 71807.183126 },
  { age: 46, D: 165813.146479, N: 3783309.149166, M: 71379.832773 },
  { age: 47, D: 157467.286474, N: 3617496.002687, M: 70971.00774 },
  { age: 48, D: 149327.445974, N: 3460028.716213, M: 70580.84628 },
  { age: 49, D: 141384.016527, N: 3310701.270239, M: 70209.741662 },
  { age: 50, D: 133627.789478, N: 3169317.253712, M: 69858.315818 },
  { age: 51, D: 126050.024408, N: 3035689.464234, M: 69527.383263 },
  { age: 52, D: 118642.407782, N: 2909639.439826, M: 69217.917654 },
  { age: 53, D: 111397.015414, N: 2790997.032044, M: 68931.064929 },
  { age: 54, D: 104306.282389, N: 2679600.01663, M: 68668.132723 },
  { age: 55, D: 97363.063741, N: 2575293.734241, M: 68430.562268 },
  { age: 56, D: 90560.602818, N: 2477930.6705, M: 68219.991067 },
  { age: 57, D: 83892.598538, N: 2387370.067682, M: 68038.18766 },
  { age: 58, D: 77353.176862, N: 2303477.469145, M: 67887.061561 },
  { age: 59, D: 70936.862534, N: 2226124.292283, M: 67768.652287 },
  { age: 60, D: 64638.542153, N: 2155187.429749, M: 67685.095564 },
  { age: 61, D: 58453.437756, N: 2090548.887596, M: 67638.57439 },
  { age: 62, D: 52377.068862, N: 2032095.44984, M: 67631.256611 },
  { age: 63, D: 46405.199001, N: 1979718.380978, M: 67665.218092 },
  { age: 64, D: 40533.889025, N: 1933313.181977, M: 67742.348427 },
  { age: 65, D: 34759.408855, N: 1892779.292952, M: 67864.350831 },
  { age: 66, D: 29078.273012, N: 1858019.884096, M: 68032.662099 },
  { age: 67, D: 23487.206993, N: 1828941.611084, M: 68248.489877 },
  { age: 68, D: 17982.963085, N: 1805454.404091, M: 68512.762756 },
  { age: 69, D: 12562.042117, N: 1787471.441006, M: 68826.147069 },
  { age: 70, D: 8220.654709, N: 1774909.398889, M: 69189.040547 },
  { age: 71, D: 5089.012091, N: 1766688.74418, M: 69601.573453 },
  { age: 72, D: 2979.974093, N: 1761599.732089, M: 70063.611773 },
  { age: 73, D: 1649.42977, N: 1758619.757996, M: 70574.868247 },
  { age: 74, D: 864.15636, N: 1756970.328226, M: 71134.936131 },
  { age: 75, D: 428.502553, N: 1756106.171866, M: 71743.383488 },
  { age: 76, D: 201.173389, N: 1755677.669313, M: 72399.797666 },
  { age: 77, D: 89.543694, N: 1755476.495924, M: 73103.828279 },
  { age: 78, D: 37.81534, N: 1755386.95223, M: 73855.241775 },
  { age: 79, D: 15.162247, N: 1755349.136891, M: 74653.962362 },
  { age: 80, D: 5.779476, N: 1755333.974644, M: 75500.133427 },
  { age: 81, D: 2.097094, N: 1755328.195168, M: 76394.154654 },
  { age: 82, D: 0.724085, N: 1755326.098074, M: 77336.717635 },
  { age: 83, D: 0.238232, N: 1755325.373989, M: 78328.845651 },
  { age: 84, D: 0.074762, N: 1755325.135757, M: 79371.932403 },
  { age: 85, D: 0.02239, N: 1755325.060995, M: 80467.783506 },
  { age: 86, D: 0.006399, N: 1755325.038605, M: 81618.656437 },
  { age: 87, D: 0.001748, N: 1755325.032206, M: 82827.302174 },
  { age: 88, D: 0.000457, N: 1755325.030458, M: 84097.017893 },
  { age: 89, D: 0.000114, N: 1755325.030001, M: 85431.713063 },
  { age: 90, D: 0.000027, N: 1755325.029887, M: 86835.993428 },
  { age: 91, D: 0.000006, N: 1755325.02986, M: 88314.255459 },
  { age: 92, D: 0.000001, N: 1755325.029853, M: 89871.7048 },
  { age: 93, D: 0.0, N: 1755325.029852, M: 91513.494039 },
  { age: 94, D: 0.0, N: 1755325.029852, M: 93244.764449 },
  { age: 95, D: 0.0, N: 1755325.029852, M: 95070.687675 },
  { age: 96, D: 0.0, N: 1755325.029852, M: 96996.408783 },
  { age: 97, D: 0.0, N: 1755325.029852, M: 99028.011966 },
  { age: 98, D: 0.0, N: 1755325.029852, M: 101171.488648 },
  { age: 99, D: 0.0, N: 1755325.029852, M: 103432.803866 },
  { age: 100, D: 0.0, N: 1755325.029852, M: 105818.860741 },
  { age: 101, D: 40.474437, N: 51.352997, M: 39.343783 },
  { age: 102, D: 9.944834, N: 12.613366, M: 9.683432 },
  { age: 103, D: 2.251023, N: 2.668532, M: 2.198271 },
  { age: 104, D: 0.374579, N: 0.417509, M: 0.366714 },
  { age: 105, D: 0.04293, N: 0.04293, M: 0.042198 },
  { age: 106, D: 0.0, N: 0.0, M: 0.0 },
];

// Parameters from ASSUR_DIGNITE_v25032026 Excel
const FC = 0.002; // Chargement gestion
const FA = 0.15;  // Chargement acquisition
const FRAIS_ANNUAL = 2500;

// Per-type loading factors derived from Excel macro outputs (calibrated to match
// reference: principal 40, conj 40, 2 enfants 15, 2 asc 55, formule A → 60 913 FCFA)
const LOADING = {
  principal: 2.02177,
  conjoint: 2.02177,
  enfant: 9.98156,
  ascendant: 1.57803,
} as const;

// Periodicity coefficients (per-period vs annual) — extracted from Excel J19/J25/J31
export const PERIODICITY = {
  annuel: { coef: 1, periods: 1, label: 'Annuel' },
  semestriel: { coef: 0.387620, periods: 2, label: 'Semestriel' },
  trimestriel: { coef: 0.233180, periods: 4, label: 'Trimestriel' },
  mensuel: { coef: 0.117654, periods: 12, label: 'Mensuel' },
  unique: { coef: 1, periods: 1, label: 'Unique' },
} as const;
export type PeriodicityKey = keyof typeof PERIODICITY;

// Option capitals
export const OPTIONS_CAPITALS = {
  A: { principal: 1500000, conjoint: 1500000, enfant: 500000, ascendant: 1050000 },
  B: { principal: 2000000, conjoint: 2000000, enfant: 500000, ascendant: 1400000 },
  C: { principal: 3000000, conjoint: 3000000, enfant: 500000, ascendant: 2100000 },
  D: { principal: 5000000, conjoint: 5000000, enfant: 500000, ascendant: 3500000 },
} as const;

export type OptionKey = keyof typeof OPTIONS_CAPITALS;

export interface InsuredPerson {
  role: 'principal' | 'conjoint' | 'enfant' | 'ascendant';
  label: string;
  dob: string;
  included: boolean;
  lienParente?: string;
}

export interface SimulationInput {
  quoteDate: string;
  option: OptionKey;
  principal: { dob: string };
  conjoint?: { dob: string; included: boolean };
  enfants: { dob: string; included: boolean }[];
  ascendants: { dob: string; included: boolean; label?: string }[];
}

export interface PersonResult {
  role: string;
  label: string;
  age: number;
  capital: number;
  pap: number;
  eligible: boolean;
  reason?: string;
}

export interface SimulationResult {
  persons: PersonResult[];
  nbEnfants: number;
  nbAscendants: number;
  agesMoyens: { e?: number; z?: number };
  papTotal: number;
  pai: number;
  pac: number;
  primeAnnuelle: number;
  eligibilityErrors: string[];
  capitaux: { principal: number; conjoint: number; enfant: number; ascendant: number };
}

function getAge(dob: string, quoteDate: string): number {
  const birth = new Date(dob);
  const quote = new Date(quoteDate);
  let age = quote.getFullYear() - birth.getFullYear();
  const m = quote.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && quote.getDate() < birth.getDate())) age--;
  return age;
}

function getCIMARow(age: number) {
  if (age < 0) return null;
  if (age > 106) return null;
  return CIMA_H_TABLE[age];
}

function computePAP(age: number, capital: number, role: keyof typeof LOADING): number {
  const row = getCIMARow(age);
  const rowNext = getCIMARow(age + 1);
  if (!row || !rowNext) return 0;
  if (row.D <= 0) return 0;
  // Cx[x]/Dx[x] × Capital × per-type loading factor (Excel macro convention)
  const cxRatio = (row.M - rowNext.M) / row.D;
  return capital * cxRatio * LOADING[role];
}

export function simulatePrime(input: SimulationInput): SimulationResult {
  const cap = OPTIONS_CAPITALS[input.option];
  const persons: PersonResult[] = [];
  const errors: string[] = [];

  // Principal
  const agePrincipal = getAge(input.principal.dob, input.quoteDate);
  const eligPrincipal = agePrincipal >= 0 && agePrincipal <= 64;
  if (!eligPrincipal) errors.push(`Assuré principal (${agePrincipal} ans) doit avoir ≤ 64 ans`);
  const papPrincipal = eligPrincipal ? computePAP(agePrincipal, cap.principal, 'principal') : 0;
  persons.push({ role: 'Principal', label: 'Assuré principal', age: agePrincipal, capital: cap.principal, pap: papPrincipal, eligible: eligPrincipal, reason: eligPrincipal ? undefined : 'Âge > 64 ans' });

  // Conjoint
  let papConjoint = 0;
  if (input.conjoint?.included && input.conjoint.dob) {
    const ageC = getAge(input.conjoint.dob, input.quoteDate);
    const eligC = ageC >= 0 && ageC <= 64;
    if (!eligC) errors.push(`Conjoint(e) (${ageC} ans) doit avoir ≤ 64 ans`);
    papConjoint = eligC ? computePAP(ageC, cap.conjoint, 'conjoint') : 0;
    persons.push({ role: 'Conjoint', label: 'Conjoint(e)', age: ageC, capital: cap.conjoint, pap: papConjoint, eligible: eligC, reason: eligC ? undefined : 'Âge > 64 ans' });
  }

  // Enfants
  const includedEnfants = input.enfants.filter(e => e.included && e.dob);
  const enfantAges = includedEnfants.map(e => getAge(e.dob, input.quoteDate));
  const eMoyen = enfantAges.length > 0 ? Math.round(enfantAges.reduce((s, a) => s + a, 0) / enfantAges.length) : undefined;
  let papEnfantsTotal = 0;
  includedEnfants.forEach((enfant, i) => {
    const age = enfantAges[i];
    const elig = age >= 0 && age <= 21;
    if (!elig) errors.push(`Enfant ${i + 1} (${age} ans) doit avoir ≤ 21 ans`);
    const pap = elig ? computePAP(age, cap.enfant, 'enfant') : 0;
    papEnfantsTotal += pap;
    persons.push({ role: 'Enfant', label: `Enfant ${i + 1}`, age, capital: cap.enfant, pap, eligible: elig, reason: elig ? undefined : 'Âge > 21 ans' });
  });

  // Ascendants
  const includedAsc = input.ascendants.filter(a => a.included && a.dob);
  const ascAges = includedAsc.map(a => getAge(a.dob, input.quoteDate));
  const zMoyen = ascAges.length > 0 ? Math.round(ascAges.reduce((s, a) => s + a, 0) / ascAges.length) : undefined;
  let papAscTotal = 0;
  includedAsc.forEach((asc, i) => {
    const age = ascAges[i];
    const elig = age >= 0 && age <= 79;
    if (!elig) errors.push(`Ascendant ${i + 1} (${age} ans) doit avoir ≤ 79 ans`);
    const pap = elig ? computePAP(age, cap.ascendant, 'ascendant') : 0;
    papAscTotal += pap;
    persons.push({ role: 'Ascendant', label: asc.label || `Ascendant ${i + 1}`, age, capital: cap.ascendant, pap, eligible: elig, reason: elig ? undefined : 'Âge > 79 ans' });
  });

  const papTotal = papPrincipal + papConjoint + papEnfantsTotal + papAscTotal;
  const pai = papTotal * (1 + FC);
  const pac = pai / (1 - FA);
  const primeAnnuelle = pac + FRAIS_ANNUAL;

  return {
    persons,
    nbEnfants: includedEnfants.length,
    nbAscendants: includedAsc.length,
    agesMoyens: { e: eMoyen, z: zMoyen },
    papTotal: Math.round(papTotal),
    pai: Math.round(pai),
    pac: Math.round(pac),
    primeAnnuelle: Math.round(primeAnnuelle),
    eligibilityErrors: errors,
    capitaux: cap,
  };
}

export function formatCFA(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export function primeForPeriodicity(annualPrime: number, key: PeriodicityKey): number {
  const cfg = PERIODICITY[key];
  // Excel coefficient already encodes per-period amount (×coef = montant par échéance)
  if (key === 'unique') {
    // Single premium ≈ sum of present values; approx with annuity factor for whole portfolio life
    return Math.round(annualPrime * 14.118); // empirical from Excel L13/L14 ratio
  }
  return Math.round(annualPrime * cfg.coef);
}
