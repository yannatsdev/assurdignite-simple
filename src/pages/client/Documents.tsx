import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, Receipt, Shield, Loader2, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';
import {
  newPdf, pdfHeader, pdfTitle, pdfSection, pdfKeyValueGrid, pdfTable, pdfFooter,
  pdfSonamStamp, pdfSignatureBlock,
  formatDateFR, FORMULE_NAMES, SONAM_BRAND,
} from '@/lib/pdf-shared';

const FORMULE_TAGLINES: Record<string, string> = {
  A: "L'essentiel pour une cérémonie digne",
  B: "L'équilibre parfait protection / budget",
  C: 'Une cérémonie haut-de-gamme et un capital généreux',
  D: 'La couverture ultime, idéale pour la diaspora',
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [paiement, setPaiement] = useState<any>(null);
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [assures, setAssures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: prof }, { data: contracts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('contracts').select('*').eq('user_id', user.id).eq('status', 'active').limit(1),
      ]);
      setProfile(prof);
      const c = contracts?.[0];
      setContract(c);
      if (c) {
        const [{ data: pays }, { data: bens }, { data: ass }] = await Promise.all([
          supabase.from('paiements').select('*').eq('contract_id', c.id).order('date_paiement', { ascending: false }).limit(1),
          supabase.from('beneficiaires').select('*').eq('contract_id', c.id),
          supabase.from('assures_complementaires').select('*').eq('contract_id', c.id),
        ]);
        setPaiement(pays?.[0]);
        setBeneficiaires(bens || []);
        setAssures(ass || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  /** -- Generators ---------------------------------------------------------- */

  const generatePolice = () => {
    if (!contract) return;
    const doc = newPdf();
    pdfHeader(doc, "Police d'assurance obsèques");
    let y = 52;
    y = pdfTitle(doc, "POLICE D'ASSURANCE", y, `N° ${contract.police_number}`);

    y = pdfSection(doc, '1. Souscripteur', y);
    y = pdfKeyValueGrid(doc, [
      ['Nom & prénom', profile?.full_name || contract.principal_name || '—'],
      ['Email', profile?.email || '—'],
      ['Téléphone', profile?.phone || '—'],
      ['Date de naissance', formatDateFR(contract.principal_dob)],
    ], y);

    y = pdfSection(doc, '2. Formule & garanties', y);
    y = pdfKeyValueGrid(doc, [
      ['Formule', `${contract.formule} — ${FORMULE_NAMES[contract.formule] || ''}`],
      ['Description', FORMULE_TAGLINES[contract.formule] || ''],
      ['Capital garanti', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ["Date d'effet", formatDateFR(contract.date_effet)],
      ["Date d'expiration", formatDateFR(contract.date_expiration)],
      ['Statut', contract.status === 'active' ? 'Actif' : (contract.status || '—')],
      ['Couverture', '70% prestations en nature + 30% capital espèces'],
    ], y);

    y = pdfSection(doc, '3. Assurés complémentaires', y);
    if (assures.length === 0) {
      doc.setFontSize(9.5); doc.setTextColor(110); doc.text('Aucun assuré complémentaire déclaré.', 18, y); y += 10;
    } else {
      y = pdfTable(
        doc,
        ['Nom', 'Lien', 'Type', 'Né(e) le'],
        assures.map(a => [a.nom || '—', a.lien_parente || '—', a.type_assure || '—', formatDateFR(a.dob)]),
        y,
      );
    }

    y = pdfSection(doc, '4. Bénéficiaires', y);
    if (beneficiaires.length === 0) {
      doc.setFontSize(9.5); doc.setTextColor(110); doc.text('Aucun bénéficiaire enregistré.', 18, y); y += 10;
    } else {
      y = pdfTable(
        doc,
        ['Nom', 'Lien de parenté', 'Téléphone'],
        beneficiaires.map(b => [b.nom || '—', b.lien_parente || '—', b.telephone || '—']),
        y,
        [80, 60, 40],
      );
    }

    if (y > 225) { doc.addPage(); pdfHeader(doc); y = 52; }
    y = pdfSection(doc, '5. Signatures', y);
    doc.setFontSize(9); doc.setTextColor(110);
    doc.text("Fait à Abidjan, le " + new Date().toLocaleDateString('fr-FR'), 18, y); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 14, 120);
    doc.text("Le Souscripteur", 30, y);
    doc.text("La Direction Générale", 130, y);
    // Souscripteur signature (captured at adhesion) or fallback line
    pdfSignatureBlock(doc, 30, y + 3, contract.signature_data_url || null, profile?.full_name || contract.principal_name || '—', 55, 18);
    // SONAM VIE official circular stamp on the right
    pdfSonamStamp(doc, 158, y + 14, 17, 'SONAM VIE', new Date().toLocaleDateString('fr-FR'));
    doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 24, 48);
    doc.setFontSize(8);
    doc.text(SONAM_BRAND.name, 130, y + 28);

    pdfFooter(doc);
    doc.save(`Police_AssurDignite_${contract.police_number}.pdf`);
  };

  const generateRecu = () => {
    if (!contract || !paiement) return;
    const doc = newPdf();
    pdfHeader(doc, 'Reçu de paiement');
    let y = 52;
    y = pdfTitle(doc, 'REÇU DE PAIEMENT', y, `Référence ${paiement.reference || '—'}`);

    y = pdfSection(doc, 'Informations souscripteur', y);
    y = pdfKeyValueGrid(doc, [
      ['Nom & prénom', profile?.full_name || contract.principal_name || '—'],
      ['Email', profile?.email || '—'],
      ['Téléphone', profile?.phone || '—'],
      ['N° de police', contract.police_number],
    ], y);

    y = pdfSection(doc, 'Détail du paiement', y);
    y = pdfKeyValueGrid(doc, [
      ['Formule choisie', `${contract.formule} — ${FORMULE_NAMES[contract.formule] || ''}`],
      ['Capital garanti', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ['Montant payé', formatCFA(paiement.montant)],
      ['Méthode', (paiement.methode || '—').toString().replace('simulation_', 'Simulation ')],
      ['Date de paiement', formatDateFR(paiement.date_paiement)],
      ['Statut', paiement.status === 'paid' ? 'Payé' : (paiement.status || '—')],
      ['Période couverte', `Du ${formatDateFR(contract.date_effet)} au ${formatDateFR(contract.date_expiration)}`],
    ], y);

    y = pdfSection(doc, 'Bénéficiaires désignés', y);
    if (beneficiaires.length === 0) {
      doc.setFontSize(9.5); doc.setTextColor(110); doc.text('Aucun bénéficiaire enregistré.', 18, y); y += 10;
    } else {
      y = pdfTable(
        doc,
        ['Nom', 'Lien de parenté', 'Téléphone'],
        beneficiaires.map(b => [b.nom || '—', b.lien_parente || '—', b.telephone || '—']),
        y,
        [80, 60, 40],
      );
    }

    // SONAM VIE official circular stamp
    pdfSonamStamp(doc, 165, y + 18, 18, 'PAYÉ', formatDateFR(paiement.date_paiement));

    doc.setTextColor(33, 24, 48);
    doc.setFontSize(8);
    doc.text('Ce reçu est généré automatiquement par AssurDignité', 18, y + 18);
    doc.text('et fait foi de paiement auprès de SONAM VIE S.A.', 18, y + 23);

    pdfFooter(doc);
    doc.save(`Recu_AssurDignite_${paiement.reference || contract.police_number}.pdf`);
  };

  const generateAttestation = () => {
    if (!contract) return;
    const doc = newPdf();
    pdfHeader(doc, "Attestation d'assurance");
    let y = 56;
    y = pdfTitle(doc, "ATTESTATION D'ASSURANCE", y, `Police N° ${contract.police_number}`);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 24, 48);
    const txt = `Nous, SONAM VIE S.A., attestons par la présente que ${profile?.full_name || contract.principal_name || "l'assuré"} est titulaire du contrat d'assurance obsèques AssurDignité, Formule ${contract.formule} — ${FORMULE_NAMES[contract.formule] || ''}, sous le numéro de police ${contract.police_number}.`;
    const split = doc.splitTextToSize(txt, 175);
    doc.text(split, 18, y); y += split.length * 6 + 6;

    y = pdfSection(doc, 'Détails du contrat', y);
    y = pdfKeyValueGrid(doc, [
      ['Période de validité', `Du ${formatDateFR(contract.date_effet)} au ${formatDateFR(contract.date_expiration)}`],
      ['Capital garanti', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ['Statut', 'Actif'],
    ], y);

    y += 8;
    doc.setFontSize(10);
    doc.text('Fait à Abidjan, le ' + new Date().toLocaleDateString('fr-FR'), 18, y);
    y += 18;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 14, 120);
    doc.text('La Direction Générale', 130, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(33, 24, 48);
    doc.text(SONAM_BRAND.name, 130, y + 6);

    pdfFooter(doc);
    doc.save(`Attestation_AssurDignite_${contract.police_number}.pdf`);
  };

  const generateCG = () => {
    const doc = newPdf();
    pdfHeader(doc, 'Conditions générales');
    let y = 56;
    y = pdfTitle(doc, 'CONDITIONS GÉNÉRALES', y);
    const articles: [string, string][] = [
      ['Article 1 — Objet', "Le présent contrat a pour objet la garantie par SONAM VIE du versement d'un capital décès en cas de décès de l'assuré principal ou de l'un des assurés complémentaires. La garantie se décompose en 70% de prestations en nature et 30% en capital espèces."],
      ["Article 2 — Conditions d'adhésion", "L'adhésion est ouverte à toute personne physique résidant en Côte d'Ivoire ou dans la zone CIMA, âgée de 18 à 64 ans (principal), 0 à 21 ans (enfants) et 0 à 79 ans (ascendants)."],
      ['Article 3 — Prestations', "En cas de décès, SONAM VIE fournit : cercueil, conservation du corps, transport funéraire, cérémonie d'inhumation (70%) et versement de 30% en espèces aux bénéficiaires, en moins de 12 heures après dépôt et analyse des pièces justificatives."],
      ['Article 4 — Exclusions', 'Suicide dans les 2 premières années, faits de guerre, actes terroristes, participation volontaire à des actes criminels, fausses déclarations.'],
      ['Article 5 — Obligations', "Payer la prime annuelle, déclarer tout changement familial, fournir des informations exactes. Toute fausse déclaration entraîne la nullité du contrat."],
      ['Article 6 — Bonus Fidélité-Santé', "Aucun sinistre pendant 3 ans = bonus de 30% des primes nettes cumulées."],
      ['Article 7 — Résiliation', "Résiliation possible à tout moment par lettre. Non-paiement : suspension après 30 jours, résiliation après 90 jours."],
      ['Article 8 — Juridiction', "Tribunaux d'Abidjan, Côte d'Ivoire. Code des Assurances CIMA."],
    ];
    doc.setTextColor(33, 24, 48);
    articles.forEach(([title, body]) => {
      const split = doc.splitTextToSize(body, 175);
      const needed = 6 + split.length * 5 + 6;
      if (y + needed > 270) { doc.addPage(); pdfHeader(doc); y = 52; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(74, 14, 120);
      doc.text(title, 18, y); y += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(33, 24, 48);
      doc.text(split, 18, y); y += split.length * 5 + 6;
    });
    pdfFooter(doc);
    doc.save('Conditions_Generales_AssurDignite.pdf');
  };

  const generateCP = () => {
    if (!contract) return;
    const doc = newPdf();
    pdfHeader(doc, 'Conditions particulières');
    let y = 56;
    y = pdfTitle(doc, 'CONDITIONS PARTICULIÈRES', y, `Police N° ${contract.police_number}`);
    y = pdfSection(doc, 'Souscripteur', y);
    y = pdfKeyValueGrid(doc, [
      ['Nom & prénom', profile?.full_name || contract.principal_name || '—'],
      ['Email', profile?.email || '—'],
      ['Téléphone', profile?.phone || '—'],
      ['Date de naissance', formatDateFR(contract.principal_dob)],
    ], y);
    y = pdfSection(doc, 'Conditions du contrat', y);
    y = pdfKeyValueGrid(doc, [
      ['Formule', `${contract.formule} — ${FORMULE_NAMES[contract.formule] || ''}`],
      ['Capital garanti', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ["Date d'effet", formatDateFR(contract.date_effet)],
      ["Date d'expiration", formatDateFR(contract.date_expiration)],
      ['Couverture', '70% nature + 30% espèces'],
    ], y);
    y += 4;
    doc.setFontSize(9); doc.setTextColor(110);
    doc.text('Ces conditions particulières complètent les conditions générales AssurDignité.', 18, y);
    doc.text('Toute modification nécessite un avenant signé par les deux parties.', 18, y + 5);
    pdfFooter(doc);
    doc.save(`Conditions_Particulieres_${contract.police_number}.pdf`);
  };

  const documents = [
    { name: "Police d'assurance", type: 'PDF', icon: FileText, date: formatDateFR(contract?.date_effet), action: generatePolice, needsContract: true },
    { name: 'Conditions Générales', type: 'PDF', icon: BookOpen, date: '01/01/2026', action: generateCG, needsContract: false },
    { name: 'Conditions Particulières', type: 'PDF', icon: BookOpen, date: formatDateFR(contract?.date_effet), action: generateCP, needsContract: true },
    { name: 'Reçu de paiement', type: 'PDF', icon: Receipt, date: formatDateFR(paiement?.date_paiement), action: generateRecu, needsContract: true, needsPaiement: true },
    { name: "Attestation d'assurance", type: 'PDF', icon: Shield, date: formatDateFR(contract?.date_effet), action: generateAttestation, needsContract: true },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto print:max-w-full">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Documents</h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Imprimer
        </Button>
      </div>

      {!contract && (
        <div className="p-4 rounded-xl bg-accent/50 text-sm text-muted-foreground print:hidden">
          Aucun contrat actif trouvé. Souscrivez à AssurDignité pour accéder à vos documents.
        </div>
      )}

      <div className="grid gap-3 print:hidden">
        {documents.map((doc, i) => {
          const disabled = (doc.needsContract && !contract) || ((doc as any).needsPaiement && !paiement);
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <doc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1 shrink-0" disabled={disabled} onClick={doc.action}>
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">Télécharger</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Print-only summary card so users can also print a quick recap from the browser */}
      {contract && (
        <div className="hidden print:block">
          <h2 className="text-xl font-bold mb-2">Récapitulatif de contrat — {contract.police_number}</h2>
          <p>Souscripteur : {profile?.full_name || '—'}</p>
          <p>Formule : {contract.formule} — {FORMULE_NAMES[contract.formule]}</p>
          <p>Capital : {formatCFA(contract.capital_total)} — Prime : {formatCFA(contract.prime_annuelle)}</p>
          <p>Période : du {formatDateFR(contract.date_effet)} au {formatDateFR(contract.date_expiration)}</p>
        </div>
      )}
    </div>
  );
}
