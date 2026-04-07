import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BookOpen, Receipt, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCFA } from '@/lib/actuarial-engine';
import jsPDF from 'jspdf';

const SONAM_INFO = {
  name: 'SONAM VIE S.A.',
  address: 'Immeuble SONAM, Plateau, Abidjan, Côte d\'Ivoire',
  tel: '27 20 31 71 82 / 05 95 45 21 65',
  email: 'servicecommercialsonamvie@sonam.ci',
  rccm: 'CI-ABJ-2003-B-149672',
};

const FORMULE_NAMES: Record<string, string> = { A: 'Dignité Simple', B: 'Serein', C: 'Prestige', D: 'Excellence' };

function addPDFHeader(doc: jsPDF) {
  // Purple header bar
  doc.setFillColor(74, 14, 120);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SONAM VIE', 15, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AssurDignité', 15, 22);
  // Right side
  doc.setFontSize(8);
  doc.text(SONAM_INFO.tel, 195, 10, { align: 'right' });
  doc.text(SONAM_INFO.email, 195, 16, { align: 'right' });
  doc.text(SONAM_INFO.address, 195, 22, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function addPDFFooter(doc: jsPDF, pageNum: number) {
  const y = 280;
  doc.setDrawColor(74, 14, 120);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`${SONAM_INFO.name} – ${SONAM_INFO.rccm} – Code des Assurances CIMA`, 105, y + 5, { align: 'center' });
  doc.text(`Page ${pageNum}`, 195, y + 5, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [paiement, setPaiement] = useState<any>(null);
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: contracts } = await supabase.from('contracts').select('*').eq('user_id', user.id).eq('status', 'active').limit(1);
      const c = contracts?.[0];
      setContract(c);
      if (c) {
        const [{ data: pays }, { data: bens }] = await Promise.all([
          supabase.from('paiements').select('*').eq('contract_id', c.id).order('date_paiement', { ascending: false }).limit(1),
          supabase.from('beneficiaires').select('*').eq('contract_id', c.id),
        ]);
        setPaiement(pays?.[0]);
        setBeneficiaires(bens || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const generatePolice = () => {
    if (!contract) return;
    const doc = new jsPDF();
    addPDFHeader(doc);
    let y = 38;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 14, 120);
    doc.text('POLICE D\'ASSURANCE', 105, y, { align: 'center' });
    y += 12;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    const lines = [
      ['N° Police', contract.police_number],
      ['Formule', `${contract.formule} – ${FORMULE_NAMES[contract.formule] || contract.formule}`],
      ['Assuré principal', contract.principal_name || '—'],
      ['Date de naissance', contract.principal_dob || '—'],
      ['Conjoint(e)', contract.conjoint_name || 'Non inclus'],
      ['Enfants assurés', String(contract.nb_enfants || 0)],
      ['Ascendants assurés', String(contract.nb_ascendants || 0)],
      ['Capital garanti', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ['Date d\'effet', contract.date_effet],
      ['Date d\'expiration', contract.date_expiration],
      ['Statut', contract.status === 'active' ? 'Actif' : contract.status],
    ];
    lines.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} :`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(val, 80, y);
      y += 8;
    });
    if (beneficiaires.length > 0) {
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Bénéficiaires :', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      beneficiaires.forEach(b => {
        doc.text(`• ${b.nom} (${b.lien_parente || '—'}) – Tél: ${b.telephone || '—'}`, 25, y);
        y += 6;
      });
    }
    addPDFFooter(doc, 1);
    doc.save(`Police_AssurDignite_${contract.police_number}.pdf`);
  };

  const generateCG = () => {
    const doc = new jsPDF();
    addPDFHeader(doc);
    let y = 38;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 14, 120);
    doc.text('CONDITIONS GÉNÉRALES — ASSURDIGNITÉ', 105, y, { align: 'center' });
    y += 12;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const articles = [
      'Article 1 – Objet : Le présent contrat a pour objet la garantie par SONAM VIE du versement d\'un capital décès en cas de décès de l\'assuré principal ou de l\'un des assurés complémentaires. La garantie se décompose en 70% de prestations en nature et 30% en capital espèces.',
      'Article 2 – Conditions d\'adhésion : L\'adhésion est ouverte à toute personne physique résidant en Côte d\'Ivoire ou dans la zone CIMA, âgée de 18 à 64 ans (principal), 0 à 21 ans (enfants) et 0 à 79 ans (ascendants).',
      'Article 3 – Prestations : En cas de décès, SONAM VIE fournit : cercueil extérieur, conservation du corps, transport funéraire, cérémonie d\'inhumation (70%) et versement de 30% en espèces au(x) bénéficiaire(s), en moins de 12 heures.',
      'Article 4 – Exclusions : Suicide dans les 2 premières années, faits de guerre, actes terroristes, participation volontaire à des actes criminels, fausses déclarations.',
      'Article 5 – Obligations : Payer la prime annuelle, déclarer tout changement familial, fournir des informations exactes. Toute fausse déclaration entraîne la nullité du contrat.',
      'Article 6 – Bonus Fidélité-Santé : Aucun sinistre pendant 3 ans = bonus de 30% des primes nettes cumulées.',
      'Article 7 – Résiliation : Résiliation possible à tout moment par lettre. Non-paiement : suspension après 30 jours, résiliation après 90 jours.',
      'Article 8 – Juridiction : Tribunaux d\'Abidjan, Côte d\'Ivoire. Code des Assurances CIMA.',
    ];
    articles.forEach(art => {
      const split = doc.splitTextToSize(art, 170);
      if (y + split.length * 5 > 270) {
        addPDFFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        addPDFHeader(doc);
        y = 38;
      }
      doc.text(split, 20, y);
      y += split.length * 5 + 4;
    });
    addPDFFooter(doc, doc.getNumberOfPages());
    doc.save('Conditions_Generales_AssurDignite.pdf');
  };

  const generateCP = () => {
    if (!contract) return;
    const doc = new jsPDF();
    addPDFHeader(doc);
    let y = 38;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 14, 120);
    doc.text('CONDITIONS PARTICULIÈRES', 105, y, { align: 'center' });
    y += 12;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const items = [
      ['N° Police', contract.police_number],
      ['Formule choisie', `${contract.formule} – ${FORMULE_NAMES[contract.formule] || contract.formule}`],
      ['Capital garanti (principal)', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ['Date d\'effet', contract.date_effet],
      ['Date d\'expiration', contract.date_expiration],
      ['Assuré principal', contract.principal_name || '—'],
      ['Conjoint(e)', contract.conjoint_name || 'Non inclus'],
      ['Nombre d\'enfants', String(contract.nb_enfants || 0)],
      ['Nombre d\'ascendants', String(contract.nb_ascendants || 0)],
    ];
    items.forEach(([l, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${l} :`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, 90, y);
      y += 8;
    });
    y += 10;
    doc.setFontSize(9);
    doc.text('Ces conditions particulières complètent les conditions générales AssurDignité.', 20, y);
    y += 6;
    doc.text('Toute modification nécessite un avenant signé par les deux parties.', 20, y);
    addPDFFooter(doc, 1);
    doc.save(`Conditions_Particulieres_${contract.police_number}.pdf`);
  };

  const generateRecu = () => {
    if (!contract || !paiement) return;
    const doc = new jsPDF();
    addPDFHeader(doc);
    let y = 38;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 14, 120);
    doc.text('REÇU DE PAIEMENT', 105, y, { align: 'center' });
    y += 12;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const items = [
      ['Référence', paiement.reference || '—'],
      ['N° Police', contract.police_number],
      ['Assuré', contract.principal_name || '—'],
      ['Montant', formatCFA(paiement.montant)],
      ['Mode de paiement', paiement.methode || '—'],
      ['Date de paiement', paiement.date_paiement ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR') : '—'],
      ['Statut', paiement.status === 'paid' ? 'Payé' : paiement.status],
    ];
    items.forEach(([l, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${l} :`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, 80, y);
      y += 8;
    });
    y += 10;
    doc.setFontSize(8);
    doc.text('Ce reçu est généré automatiquement et fait foi de paiement.', 20, y);
    addPDFFooter(doc, 1);
    doc.save(`Recu_Paiement_${paiement.reference || 'AssurDignite'}.pdf`);
  };

  const generateAttestation = () => {
    if (!contract) return;
    const doc = new jsPDF();
    addPDFHeader(doc);
    let y = 45;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 14, 120);
    doc.text('ATTESTATION D\'ASSURANCE', 105, y, { align: 'center' });
    y += 15;
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const text = `SONAM VIE S.A. atteste que ${contract.principal_name || 'l\'assuré'} est titulaire du contrat d'assurance obsèques AssurDignité, Formule ${contract.formule} – ${FORMULE_NAMES[contract.formule] || ''}, sous le numéro de police ${contract.police_number}.`;
    const split = doc.splitTextToSize(text, 170);
    doc.text(split, 20, y);
    y += split.length * 6 + 10;
    const details = [
      ['Période de validité', `${contract.date_effet} au ${contract.date_expiration}`],
      ['Capital garanti', formatCFA(contract.capital_total)],
      ['Prime annuelle', formatCFA(contract.prime_annuelle)],
      ['Statut', 'Actif'],
    ];
    details.forEach(([l, v]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${l} :`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, 80, y);
      y += 8;
    });
    y += 15;
    doc.setFontSize(10);
    doc.text('Fait à Abidjan, le ' + new Date().toLocaleDateString('fr-FR'), 20, y);
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('La Direction Générale', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.text('SONAM VIE S.A.', 140, y + 6);
    addPDFFooter(doc, 1);
    doc.save(`Attestation_AssurDignite_${contract.police_number}.pdf`);
  };

  const documents = [
    { name: 'Police d\'assurance', type: 'PDF', icon: FileText, date: contract?.date_effet || '—', action: generatePolice, needsContract: true },
    { name: 'Conditions Générales', type: 'PDF', icon: BookOpen, date: '01/01/2026', action: generateCG, needsContract: false },
    { name: 'Conditions Particulières', type: 'PDF', icon: BookOpen, date: contract?.date_effet || '—', action: generateCP, needsContract: true },
    { name: 'Reçu de paiement', type: 'PDF', icon: Receipt, date: paiement?.date_paiement ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR') : '—', action: generateRecu, needsContract: true, needsPaiement: true },
    { name: 'Attestation d\'assurance', type: 'PDF', icon: Shield, date: contract?.date_effet || '—', action: generateAttestation, needsContract: true },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">Documents</h1>
      {!contract && (
        <div className="p-4 rounded-xl bg-accent/50 text-sm text-muted-foreground">
          Aucun contrat actif trouvé. Souscrivez à AssurDignité pour accéder à vos documents.
        </div>
      )}
      <div className="grid gap-3">
        {documents.map((doc, i) => {
          const disabled = (doc.needsContract && !contract) || ((doc as any).needsPaiement && !paiement);
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <doc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" disabled={disabled} onClick={doc.action}>
                  <Download className="w-4 h-4" /> Télécharger
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
