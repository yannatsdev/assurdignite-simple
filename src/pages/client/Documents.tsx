import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, Receipt, Shield, Loader2, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';
import {
  newPdf, pdfHeader, pdfTitle, pdfSection, pdfKeyValueGrid, pdfTable, pdfFooter,
  pdfDocumentSignatures,
  formatDateFR, FORMULE_NAMES, SONAM_BRAND,
} from '@/lib/pdf-shared';
import { trackSync } from '@/lib/telemetry';

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
        supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
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
      ['Couverture', 'Capital versé à 100% en espèces aux bénéficiaires désignés'],
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

    if (y > 215) { doc.addPage(); pdfHeader(doc); y = 52; }
    y = pdfSection(doc, '5. Signatures', y);
    pdfDocumentSignatures(doc, y, {
      subscriberSig: contract.signature_data_url,
      subscriberName: profile?.full_name || contract.principal_name,
      stampLabel: 'SONAM VIE',
    });

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

    // Signature & cachet section
    y = pdfSection(doc, 'Signature & cachet', y + 4);
    pdfDocumentSignatures(doc, y, {
      subscriberSig: contract.signature_data_url,
      subscriberName: profile?.full_name || contract.principal_name,
      stampLabel: 'PAYÉ',
      dateText: formatDateFR(paiement.date_paiement),
    });

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
    pdfDocumentSignatures(doc, y, {
      subscriberSig: contract.signature_data_url,
      subscriberName: profile?.full_name || contract.principal_name,
      stampLabel: 'CERTIFIÉ',
    });

    pdfFooter(doc);
    doc.save(`Attestation_AssurDignite_${contract.police_number}.pdf`);
  };

  const generateCG = () => {
    const doc = newPdf();
    pdfHeader(doc, 'Conditions générales');
    let y = 56;
    y = pdfTitle(doc, 'CONDITIONS GÉNÉRALES', y);
    const articles: [string, string][] = [
      ['Article 1 — Objet', "SONAM VIE s'engage, moyennant paiement des primes, à verser en cas de décès d'un membre de la famille déclarée une indemnité, préalablement définie, pour l'organisation des obsèques aux bénéficiaires désignés. En cas de vie de l'assuré au terme du contrat, l'assureur ne verse rien. Le capital est versé à l'assuré lui-même en cas d'invalidité totale et permanente."],
      ["Article 2 — Conditions d'adhésion", "Assuré principal et conjoint(e) : 18 à 64 ans inclus à la souscription (âge + durée du contrat ≤ 65 ans). Enfants : 0 à 21 ans. Ascendants : jusqu'à 89 ans à la souscription (âge + durée du contrat ≤ 90 ans)."],
      ['Article 3 — Exclusions', "Suicide au cours des deux premières années, faits de guerre étrangère, certains risques de navigation aérienne hors cadre réglementaire, activités périlleuses (paris, défis, acrobaties, parachutisme de démonstration), épidémies/pandémies/catastrophes naturelles reconnues comme telles, et meurtre de l'assuré par le bénéficiaire."],
      ['Article 4 — Paiement des prestations', "Dès transmission des pièces justificatives (acte de décès, certificat du genre de mort, pièces d'identité, formulaire de déclaration de sinistre, etc.), l'indemnité est versée sous 15 jours ouvrés. Ce contrat ne comporte pas de participation aux bénéfices."],
      ['Article 5 — Rachat, réduction et avance', "Conformément à l'article 77 du code CIMA, ce contrat ne comporte ni valeur de rachat, ni réduction, et ne peut donner lieu à l'octroi d'une avance."],
      ['Article 6 — Ristourne fidélité', "30% de la prime payée par l'assuré principal est restitué si aucun sinistre n'est survenu pendant les 3 premières années de souscription."],
      ['Article 7 — Frais', "Frais de gestion : 0,15% du capital assuré. Frais d'acquisition : 18% de la prime commerciale. Frais d'encaissement : 2 500 FCFA (annuelle), 1 500 FCFA (semestrielle), 1 000 FCFA (trimestrielle), 500 FCFA (mensuelle)."],
      ['Article 8 — Non-paiement des primes', "À défaut de paiement d'une prime dans les 10 jours de son échéance, un préavis de 40 jours est adressé à l'adhérent, au terme duquel le contrat peut être résilié ou réduit."],
      ['Article 9 — Prescription', "Toute action dérivant du présent contrat se prescrit par dix ans à compter de l'événement qui y donne naissance (article 28 du code des assurances CIMA)."],
      ['Article 10 — Juridiction', "Le contrat est régi par le Code des Assurances CIMA. Tout litige est soumis, à défaut d'accord amiable ou d'arbitrage, aux tribunaux compétents de Côte d'Ivoire."],
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
      ['Couverture', 'Capital versé à 100% en espèces'],
    ], y);
    y += 4;
    doc.setFontSize(9); doc.setTextColor(110);
    doc.text('Ces conditions particulières complètent les conditions générales AssurDignité.', 18, y);
    doc.text('Toute modification nécessite un avenant signé par les deux parties.', 18, y + 5);
    pdfFooter(doc);
    doc.save(`Conditions_Particulieres_${contract.police_number}.pdf`);
  };

  const documents = [
    { name: "Police d'assurance", type: 'PDF', icon: FileText, date: formatDateFR(contract?.date_effet), action: () => trackSync({ kind: 'pdf', name: 'pdf.police' }, generatePolice), needsContract: true },
    { name: 'Conditions Générales', type: 'PDF', icon: BookOpen, date: '01/01/2026', action: () => trackSync({ kind: 'pdf', name: 'pdf.cg' }, generateCG), needsContract: false },
    { name: 'Conditions Particulières', type: 'PDF', icon: BookOpen, date: formatDateFR(contract?.date_effet), action: () => trackSync({ kind: 'pdf', name: 'pdf.cp' }, generateCP), needsContract: true },
    { name: 'Reçu de paiement', type: 'PDF', icon: Receipt, date: formatDateFR(paiement?.date_paiement), action: () => trackSync({ kind: 'pdf', name: 'pdf.recu' }, generateRecu), needsContract: true, needsPaiement: true },
    { name: "Attestation d'assurance", type: 'PDF', icon: Shield, date: formatDateFR(contract?.date_effet), action: () => trackSync({ kind: 'pdf', name: 'pdf.attestation' }, generateAttestation), needsContract: true },
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
