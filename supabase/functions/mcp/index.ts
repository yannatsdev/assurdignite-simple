// To take ownership, delete this banner line; the plugin then leaves the file alone.
// supabase function: mcp
// Bundled from src/lib/mcp/index.ts by @lovable.dev/mcp-js.
// src/lib/mcp/index.ts
import { defineMcp } from "npm:@lovable.dev/mcp-js@0.20.0";

// src/lib/mcp/tools/list-formules.ts
import { defineTool } from "npm:@lovable.dev/mcp-js@0.20.0";
var list_formules_default = defineTool({
  name: "list_formules",
  title: "Lister les formules AssurDignit\xE9",
  description: "Retourne les formules d'assurance obs\xE8ques AssurDignit\xE9 (SONAM Vie): A Dignit\xE9 Simple, B Serein, C Prestige, D Excellence.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const formules = [
      {
        code: "A",
        nom: "Dignit\xE9 Simple",
        capital_fcfa: 15e5,
        cible: "Budget ma\xEEtris\xE9, couverture essentielle"
      },
      {
        code: "B",
        nom: "Serein",
        capital_fcfa: 2e6,
        cible: "\xC9quilibre couverture / prime"
      },
      {
        code: "C",
        nom: "Prestige",
        capital_fcfa: 3e6,
        cible: "Prestations \xE9largies, famille"
      },
      {
        code: "D",
        nom: "Excellence",
        capital_fcfa: 5e6,
        cible: "Diaspora \u2014 capital vers\xE9 \xE0 100% en esp\xE8ces, rapatriement inclus"
      }
    ];
    return {
      content: [{ type: "text", text: JSON.stringify(formules, null, 2) }],
      structuredContent: { formules }
    };
  }
});

// src/lib/mcp/tools/contact-info.ts
import { defineTool as defineTool2 } from "npm:@lovable.dev/mcp-js@0.20.0";
var contact_info_default = defineTool2({
  name: "contact_info",
  title: "Coordonn\xE9es AssurDignit\xE9",
  description: "Retourne les coordonn\xE9es commerciales SONAM Vie / AssurDignit\xE9 (t\xE9l\xE9phones, email).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const contact = {
      marque: "AssurDignit\xE9",
      porteur_de_risque: "SONAM Vie",
      concepteur: "AIF SARL",
      telephones: ["+225 27 20 31 71 82", "+225 05 95 45 21 65"],
      email: "servicecommercialsonamvie@sonam.ci",
      site: "https://sonam-assurdignite-beta.lovable.app"
    };
    return {
      content: [{ type: "text", text: JSON.stringify(contact, null, 2) }],
      structuredContent: contact
    };
  }
});

// src/lib/mcp/tools/simuler-prime.ts
import { defineTool as defineTool3 } from "npm:@lovable.dev/mcp-js@0.20.0";
import { z } from "npm:zod@^3.25.76";
// --- inlined src/lib/actuarial-engine.ts ---
// CIMA H Commutation Table (ages 0-106) — recomputed from official lx,dx with v=1/1.035
// Source: ASSUR_DIGNITE Excel macro (Module_TD.bas)
const CIMA_H_TABLE: { age: number; D: number; N: number; M: number }[] = [{age:0,D:1000000.0,N:26565815.978933837,M:103402.46001895212},{age:1,D:960997.3469237671,N:25565815.978933837,M:98126.25361470634},{age:2,D:927822.0466348749,N:24604818.63201007,M:97436.68856511709},{age:3,D:895945.4421351147,N:23676996.585375194,M:96927.0170841547},{age:4,D:865235.5602165774,N:22781051.14324008,M:96507.6554861801},{age:5,D:835636.1076092726,N:21915815.583023503,M:96161.47274184627},{age:6,D:807078.1433647503,N:21080179.47541423,M:95856.53404818407},{age:7,D:779524.8477828511,N:20273101.33204948,M:95591.21135409402},{age:8,D:752926.379228906,N:19493576.48426663,M:95349.36203727068},{age:9,D:727235.4637848985,N:18740650.105037726,M:95115.741032761},{age:10,D:702434.6074127663,N:18013414.641252827,M:94903.77345109705},{age:11,D:678466.5006019995,N:17310980.03384006,M:94685.77630237995},{age:12,D:655316.1998110942,N:16632513.533238059,M:94475.19596784406},{age:13,D:632920.5159281014,N:15977197.333426965,M:94235.8821173776},{age:14,D:611246.8227919625,N:15344276.817498865,M:93960.60372080204},{age:15,D:590255.7047597757,N:14733029.994706903,M:93634.10003016156},{age:16,D:569886.8108404727,N:14142774.289947126,M:93218.45571034958},{age:17,D:550115.8586702683,N:13572887.479106653,M:92710.37356352489},{age:18,D:530913.5934439776,N:13022771.620436385,M:92100.6622919364},{age:19,D:512274.1650287289,N:12491858.026992407,M:91402.93487278567},{age:20,D:494214.0213976614,N:11979583.861963678,M:90653.28798737715},{age:21,D:476748.126579007,N:11485369.840566017,M:89886.8744880545},{age:22,D:459874.2274585083,N:11008621.71398701,M:89121.84618520732},{age:23,D:443583.33850778954,N:10548747.4865285,M:88369.42815693814},{age:24,D:427859.09911793587,N:10105164.14802071,M:87633.03331663016},{age:25,D:412679.03036654025,N:9677305.048902774,M:86909.28725846755},{age:26,D:398024.78023114137,N:9264626.018536234,M:86198.24073108558},{age:27,D:383872.7264931505,N:8866601.238305094,M:85493.95148484987},{age:28,D:370206.33616742544,N:8482728.511811944,M:84796.87682011595},{age:29,D:357009.5952433848,N:8112522.175644519,M:84107.43322942541},{age:30,D:344264.93049504014,N:7755512.580401134,M:83423.90000633098},{age:31,D:331960.06245300686,N:7411247.649906093,M:82749.33747114957},{age:32,D:320081.0885388102,N:7079287.587453086,M:82084.73222288379},{age:33,D:308605.32089730864,N:6759206.498914275,M:81421.65487161546},{age:34,D:297511.9092763888,N:6450601.178016967,M:80752.76497887025},{age:35,D:286777.9005193782,N:6153089.268740579,M:80067.86540348736},{age:36,D:276393.6334863307,N:5866311.3682212,M:79369.4919705681},{age:37,D:266342.6116558221,N:5589917.73473487,M:78652.89415991533},{age:38,D:256613.032798896,N:5323575.123079048,M:77917.52965555759},{age:39,D:247190.62101867827,N:5066962.090280152,M:77159.93352317471},{age:40,D:238059.32979812715,N:4819771.469261474,M:76374.34835347129},{age:41,D:229204.76518271258,N:4581712.139463346,M:75556.1459204916},{age:42,D:220608.7340078895,N:4352507.374280633,M:74696.33767689063},{age:43,D:212265.3996932904,N:4131898.640272744,M:73797.88013834746},{age:44,D:204164.29709039468,N:3919633.2405794538,M:72858.82015246367},{age:45,D:196298.20619045652,N:3715468.943489059,M:71880.14597436713},{age:46,D:188660.35817048186,N:3519170.7372986022,M:70863.05648193383},{age:47,D:181248.3638124986,N:3330510.3791281204,M:69812.97327335725},{age:48,D:174061.3091003803,N:3149262.0153156216,M:68736.73654612717},{age:49,D:167097.58629833302,N:2975200.7062152415,M:67640.44929736889},{age:50,D:160353.29738017512,N:2808103.1199169084,M:66527.82918730046},{age:51,D:153824.35833553944,N:2647749.8225367335,M:65402.27056094751},{age:52,D:147501.89653565062,N:2493925.4642011942,M:64262.155562093234},{age:53,D:141379.2206511444,N:2346423.5676655434,M:63107.78023224036},{age:54,D:135450.01274594024,N:2205044.3470143992,M:61939.59028173349},{age:55,D:129706.96286039763,N:2069594.3342684591,M:60756.80482951419},{age:56,D:124145.83929866731,N:1939887.3714080616,M:59561.52317920376},{age:57,D:118762.00274044833,N:1815741.5321093942,M:58355.284354339215},{age:58,D:113530.19615081564,N:1696979.5293689459,M:57118.4923497383},{age:59,D:108438.79153744804,N:1583449.3332181303,M:55844.547738981084},{age:60,D:103466.64995900342,N:1475010.5416806822,M:54516.77509718948},{age:61,D:98615.62136708821,N:1371543.891721679,M:53141.15949257268},{age:62,D:93869.07103469278,N:1272928.2703545906,M:51704.94425895183},{age:63,D:89230.36322643518,N:1179059.199319898,M:50215.146407669294},{age:64,D:84702.699668972,N:1089828.8360934628,M:48678.7333333638},{age:65,D:80272.95092000808,N:1005126.1364244907,M:47086.168073544286},{age:66,D:75946.41404175555,N:924853.1855044826,M:45446.20816700069},{age:67,D:71724.23364955685,N:848906.771462727,M:43763.56889827019},{age:68,D:67624.29584540139,N:777182.5378131701,M:42060.036873259705},{age:69,D:63644.437435022104,N:709558.2419677688,M:40337.61689417353},{age:70,D:59783.43128244345,N:645913.8045327467,M:38599.191641009835},{age:71,D:56039.30688352611,N:586130.3732503032,M:36846.845311228884},{age:72,D:52410.885604765215,N:530091.066366777,M:35083.39991998648},{age:73,D:48899.522584925544,N:477680.1807620118,M:33314.21466571009},{age:74,D:45505.99046754299,N:428780.65817708627,M:31544.102766604552},{age:75,D:42230.53283767438,N:383274.66770954325,M:29777.36578484754},{age:76,D:39071.80298454186,N:341044.1348718689,M:28016.69577603525},{age:77,D:36028.216825515934,N:301972.331887327,M:26264.496974573165},{age:78,D:33099.94674484318,N:265944.11506181106,M:24524.90605817078},{age:79,D:30285.606982819554,N:232844.16831696784,M:22800.48045812887},{age:80,D:27580.708732933894,N:202558.56133414828,M:21090.573048176728},{age:81,D:24980.835113597892,N:174977.8526012144,M:19394.45544586473},{age:82,D:22485.202287237636,N:149997.0174876165,M:17714.943389724598},{age:83,D:20098.853353744056,N:127511.81520037889,M:16060.75368372912},{age:84,D:17831.672131079406,N:107412.96184663483,M:14445.701332334727},{age:85,D:15695.556110658346,N:89581.28971555542,M:12885.989983878793},{age:86,D:13698.883464655084,N:73885.73360489708,M:11394.652219899723},{age:87,D:11847.496962413128,N:60186.850140241986,M:9982.429466428935},{age:88,D:10146.55488977089,N:48339.35317782886,M:8659.567800060895},{age:89,D:8599.652881692957,N:38192.79828805797,M:7434.90099645154},{age:90,D:7209.119910619878,N:29593.145406365016,M:6316.097893846874},{age:91,D:5974.482030688547,N:22384.02549574514,M:5308.055906890769},{age:92,D:4845.368319165412,N:16409.543465056595,M:4364.893480664889},{age:93,D:3786.468178597313,N:11564.175145891182,M:3454.317757551},{age:94,D:2828.821700345203,N:7777.706967293869,M:2610.3229250216127},{age:95,D:2001.238735642731,N:4948.885266948665,M:1865.702112960695},{age:96,D:1325.240089467569,N:2947.6465313059343,M:1246.824092565239},{age:97,D:810.044103267719,N:1622.4064418383655,M:768.2821128456148},{age:98,D:449.3321647403528,N:812.3623385706466,M:429.18005045722964},{age:99,D:221.58184794701992,N:363.03017383029373,M:212.93680989678876},{age:100,D:94.74954662893434,N:141.4483258832738,M:91.52713948029351},{age:101,D:34.08541318999599,N:46.69877925433946,M:33.07019412842055},{age:102,D:9.944833606796669,N:12.613366064343476,M:9.683432286832922},{age:103,D:2.251023207246851,N:2.6685324575468066,M:2.198271478042343},{age:104,D:0.374579199902838,N:0.41750925029995595,M:0.3667143386487828},{age:105,D:0.04293005039711795,N:0.04293005039711795,M:0.04219793738919592},{age:106,D:0.0,N:0.0,M:0.0}];

// Actuarial parameters — Note Technique ASSUR DIGNITE (Actualisation PM Ristourne 26/05/2026)
const TAUX = 0.035;            // taux garanti 3,5%
const FC = 0.0015;             // chargement de gestion : 0,15% du capital
const FA = 0.18;               // chargement d'acquisition : 18% de la prime commerciale
const FI = 0.0;                // chargement d'incitation (non utilisé dans la note 26/05/2026)
const ENC_A = 2500;            // accessoire annuel
const ENC_S = 1500;            // accessoire semestriel
const ENC_T = 1000;            // accessoire trimestriel
const ENC_M = 500;             // accessoire mensuel

// Periodicity coefficients (Excel macro PCP_TD)
const PERIODICITY = {
  annuel:      { coef: 1,    enc: ENC_A, periods: 1,  label: 'Annuel' },
  semestriel:  { coef: 0.51, enc: ENC_S, periods: 2,  label: 'Semestriel' },
  trimestriel: { coef: 0.26, enc: ENC_T, periods: 4,  label: 'Trimestriel' },
  mensuel:     { coef: 0.09, enc: ENC_M, periods: 12, label: 'Mensuel' },
  unique:      { coef: 1,    enc: ENC_A, periods: 1,  label: 'Unique' },
} as const;
type PeriodicityKey = keyof typeof PERIODICITY;

// Option capitals (ascendant = principal × 0.7)
const OPTIONS_CAPITALS = {
  A: { principal: 1500000, conjoint: 1500000, enfant: 500000, ascendant: 1050000 },
  B: { principal: 2000000, conjoint: 2000000, enfant: 500000, ascendant: 1400000 },
  C: { principal: 3000000, conjoint: 3000000, enfant: 500000, ascendant: 2100000 },
  D: { principal: 5000000, conjoint: 5000000, enfant: 500000, ascendant: 3500000 },
} as const;
type OptionKey = keyof typeof OPTIONS_CAPITALS;

// Default contract duration (years)
const DEFAULT_DUREE = 2;

interface SimulationInput {
  quoteDate: string;
  option: OptionKey;
  duree?: number; // années — défaut 2
  periodicite?: PeriodicityKey; // défaut 'annuel'
  principal: { dob: string };
  conjoint?: { dob: string; included: boolean };
  enfants: { dob: string; included: boolean }[];
  ascendants: { dob: string; included: boolean; label?: string }[];
}

interface PersonResult {
  role: string;
  label: string;
  age: number;
  capital: number;
  pap: number;       // prime annuelle commerciale (PC) — sans accessoire
  primeAffichee: number; // prime pour la périodicité choisie + accessoire de période (comme dans le tableau Excel)
  eligible: boolean;
  reason?: string;
}

interface SimulationResult {
  persons: PersonResult[];
  nbEnfants: number;
  nbAscendants: number;
  agesMoyens: { e?: number; z?: number };
  papTotal: number;       // somme PC pure (sans accessoires), base annuelle
  pai: number;            // = papTotal × (1+fc) — kept for compat
  pac: number;            // = pai/(1-fa-fi) — kept for compat
  primeAnnuelle: number;  // PRIME TOTALE ANNUELLE de référence = somme(PC) + accessoire annuel (toujours en base annuelle, quelle que soit la périodicité choisie)
  primePeriodique: number; // Montant total réellement dû par échéance, pour la périodicité choisie (= primeAnnuelle si périodicité = annuel)
  periodicite: PeriodicityKey;
  periodsPerYear: number;
  accessoires: number;    // 2500 FCFA (accessoire global, constant quelle que soit la périodicité — cf. macro Excel PCP_TD)
  engagementGlobal: number; // somme des capitaux assurés
  duree: number;
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

function row(age: number) {
  if (age < 0 || age >= CIMA_H_TABLE.length) return null;
  return CIMA_H_TABLE[age];
}
const Dx  = (x: number) => row(x)?.D ?? 0;
const Nx  = (x: number) => row(x)?.N ?? 0;
const Mx  = (x: number) => row(x)?.M ?? 0;
const Mxn = (x: number, n: number) => row(x + n)?.M ?? 0;
const Nxn = (x: number, n: number) => row(x + n)?.N ?? 0;

// Excel Module_TD.bas exact formulas
const A_xn    = (x: number, n: number) => (Mx(x) - Mxn(x, n)) / Dx(x);
const na_x2p  = (x: number, n: number) => (Nx(x) - Nxn(x, n)) / Dx(x);

/** Prime Unique Pure */
function PUP(x: number, n: number, C: number): number {
  if (Dx(x) <= 0) return 0;
  return C * A_xn(x, n);
}
/** Prime Unique d'Inventaire */
function PUI(x: number, n: number, C: number): number {
  if (Dx(x) <= 0) return 0;
  return PUP(x, n, C) + FC * na_x2p(x, n) * C;
}
/** Prime Unique Commerciale */
function PUC(x: number, n: number, C: number): number {
  return PUI(x, n, C) / (1 - FA - FI);
}
/** Prime Annuelle Commerciale (sans accessoire) — PC dans le VBA */
function PC(x: number, n: number, C: number): number {
  const a = na_x2p(x, n);
  if (a <= 0) return 0;
  return PUC(x, n, C) / a;
}
/** Prime Annuelle Pure */
function PAP(x: number, n: number, C: number): number {
  const a = na_x2p(x, n);
  if (a <= 0) return 0;
  return PUP(x, n, C) / a;
}
/** Prime Annuelle d'Inventaire */
function PAI(x: number, n: number, C: number): number {
  const a = na_x2p(x, n);
  if (a <= 0) return 0;
  return PUI(x, n, C) / a;
}

function simulatePrime(input: SimulationInput): SimulationResult {
  const cap = OPTIONS_CAPITALS[input.option];
  const n = Math.max(1, Math.floor(input.duree ?? DEFAULT_DUREE));
  const periodKey: PeriodicityKey = input.periodicite ?? 'annuel';
  const cfg = PERIODICITY[periodKey];
  const persons: PersonResult[] = [];
  const errors: string[] = [];

  const buildPerson = (
    role: string,
    label: string,
    dob: string,
    capital: number,
    maxAge: number,
  ): PersonResult => {
    const age = getAge(dob, input.quoteDate);
    const elig = age >= 0 && age <= maxAge;
    if (!elig) errors.push(`${label} (${age} ans) doit avoir ≤ ${maxAge} ans`);
    // Base annuelle pure (PC), utilisée pour papTotal / primeAnnuelle de référence, indépendante de la périodicité.
    const pc = elig ? PC(age, n, capital) : 0;
    // Montant pour la périodicité choisie : Prime Unique Commerciale pour "unique",
    // sinon coefficient de fractionnement × PC + accessoire de la période (macro Excel PCP_TD).
    const periodBase = elig ? (periodKey === 'unique' ? PUC(age, n, capital) : pc * cfg.coef) : 0;
    return {
      role, label, age, capital,
      pap: pc,
      primeAffichee: elig ? periodBase + cfg.enc : 0,
      eligible: elig,
      reason: elig ? undefined : `Âge > ${maxAge} ans`,
    };
  };

  // Principal
  const pPrinc = buildPerson('Principal', 'Assuré principal', input.principal.dob, cap.principal, 64);
  persons.push(pPrinc);

  // Conjoint
  if (input.conjoint?.included && input.conjoint.dob) {
    persons.push(buildPerson('Conjoint', 'Conjoint(e)', input.conjoint.dob, cap.conjoint, 64));
  }

  // Enfants
  const includedEnfants = input.enfants.filter(e => e.included && e.dob);
  const enfantAges: number[] = [];
  includedEnfants.forEach((e, i) => {
    const p = buildPerson('Enfant', `Enfant ${i + 1}`, e.dob, cap.enfant, 21);
    enfantAges.push(p.age);
    persons.push(p);
  });
  const eMoyen = enfantAges.length ? Math.round(enfantAges.reduce((s,a)=>s+a,0)/enfantAges.length) : undefined;

  // Ascendants
  const includedAsc = input.ascendants.filter(a => a.included && a.dob);
  const ascAges: number[] = [];
  includedAsc.forEach((a, i) => {
    const p = buildPerson('Ascendant', a.label || `Ascendant ${i + 1}`, a.dob, cap.ascendant, 89);
    ascAges.push(p.age);
    persons.push(p);
  });
  const zMoyen = ascAges.length ? Math.round(ascAges.reduce((s,a)=>s+a,0)/ascAges.length) : undefined;

  // Chaque assuré (principal, conjoint, CHAQUE enfant, CHAQUE ascendant individuellement — pas un montant
  // "par tête" multiplié par un effectif) contribue sa propre prime de période + accessoire de période.
  // Le total dû = Σ(primes de période par assuré) + un accessoire global unique de 2 500 FCFA,
  // constant quelle que soit la périodicité (cf. macro Excel PCP_TD, lignes I7/I13/I19/I25/I31 = 2 500).
  const sumDisplayed = persons.reduce((s, p) => s + (p.eligible ? p.primeAffichee : 0), 0);
  const sumPC = persons.reduce((s, p) => s + p.pap, 0);
  const primePeriodique = sumDisplayed + ENC_A;

  // Référence annuelle indépendante de la périodicité choisie (utile pour comparer les formules
  // et pour les champs "prime_annuelle" stockés en base, quelle que soit la périodicité retenue).
  const primeAnnuelle = sumPC + persons.filter(p => p.eligible).length * ENC_A + ENC_A;

  const engagementGlobal = persons.reduce((s, p) => s + (p.eligible ? p.capital : 0), 0);

  return {
    persons,
    nbEnfants: includedEnfants.length,
    nbAscendants: includedAsc.length,
    agesMoyens: { e: eMoyen, z: zMoyen },
    papTotal: Math.round(sumPC),
    pai: Math.round(sumPC * (1 + FC)),
    pac: Math.round((sumPC * (1 + FC)) / (1 - FA - FI)),
    primeAnnuelle: Math.round(primeAnnuelle),
    primePeriodique: Math.round(primePeriodique),
    periodicite: periodKey,
    periodsPerYear: cfg.periods,
    accessoires: ENC_A,
    engagementGlobal,
    duree: n,
    eligibilityErrors: errors,
    capitaux: cap,
  };
}

function formatCFA(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

// --- end inlined actuarial-engine ---
var CAPITAUX = {
  A: 15e5,
  B: 2e6,
  C: 3e6,
  D: 5e6
};
var simuler_prime_default = defineTool3({
  name: "simuler_prime",
  title: "Simuler une prime annuelle",
  description: "Estimation indicative de la prime annuelle commerciale AssurDignit\xE9 (assur\xE9 principal seul) selon la formule (A/B/C/D) et l'\xE2ge de l'assur\xE9 principal (18-64 ans), calcul\xE9e avec le m\xEAme moteur actuariel (table CIMA H, taux technique 3,5%) que le simulateur officiel. Paiement annuel, dur\xE9e de r\xE9f\xE9rence 2 ans. Une ristourne de 30% de la prime de l'assur\xE9 principal est restitu\xE9e si aucun sinistre n'est survenu sur les 3 premi\xE8res ann\xE9es. R\xE9sultat indicatif, hors accessoires et hors conjoint/enfants/ascendants \u2014 non contractuel.",
  inputSchema: {
    formule: z.enum(["A", "B", "C", "D"]).describe("Code formule: A, B, C ou D"),
    age: z.number().int().min(18).max(64).describe("\xC2ge de l'assur\xE9 principal (18-64 ans)")
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ formule, age }) => {
    const capital = CAPITAUX[formule];
    const prime = Math.round(PC(age, DEFAULT_DUREE, capital));
    const result = {
      formule,
      capital_fcfa: capital,
      age,
      prime_annuelle_indicative_fcfa: prime,
      periodicite: "annuelle",
      ristourne: "30% de la prime de l'assur\xE9 principal restitu\xE9e si aucun sinistre sur 3 ans",
      limites_age: { principal: "18-64", conjoint: "18-64", enfants: "0-21", ascendants: "0-89" },
      note: "Estimation indicative pour l'assur\xE9 principal seul, hors accessoires d'encaissement. Tarification d\xE9finitive (avec conjoint/enfants/ascendants) apr\xE8s simulation compl\xE8te et adh\xE9sion."
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result
    };
  }
});

// src/lib/mcp/index.ts
var mcp_default = defineMcp({
  name: "assurdignite-mcp",
  title: "AssurDignit\xE9 MCP",
  version: "0.1.0",
  instructions: "Outils publics AssurDignit\xE9 (SONAM Vie): consulter les formules d'assurance obs\xE8ques, obtenir les coordonn\xE9es commerciales, et simuler une prime annuelle indicative.",
  tools: [list_formules_default, contact_info_default, simuler_prime_default]
});

// lovable-mcp-supabase-entry.ts
import { createSupabaseHandler } from "npm:@lovable.dev/mcp-js@0.20.0/stacks/supabase";
Deno.serve(createSupabaseHandler(mcp_default, { functionName: "mcp" }));
