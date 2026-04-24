import jsPDF from 'jspdf';
import { formatCFA } from '@/lib/actuarial-engine';
import { newPdf, pdfFooter, pdfHeader, pdfKeyValueGrid, pdfSection, pdfTable, pdfTitle } from '@/lib/pdf-shared';

export type AdminReportData = {
  stats: { contracts: number; activeContracts: number; primes: number; paid: number; pending: number; sinistres: number; users?: number };
  monthlyData: Array<{ month: string; contrats: number; primes?: number; sinistres?: number }>;
  formulaData: Array<{ name: string; value: number; amount?: number }>;
  paymentsByStatus?: Array<{ status: string; count: number; amount: number }>;
};

export function generateAdminReportPdf(data: AdminReportData) {
  const doc: jsPDF = newPdf();
  pdfHeader(doc, 'Rapport de pilotage');
  let y = 52;
  y = pdfTitle(doc, 'RAPPORT ADMINISTRATIF ASSURDIGNITÉ', y, `Généré le ${new Date().toLocaleDateString('fr-FR')}`);
  y = pdfSection(doc, 'Indicateurs clés', y);
  y = pdfKeyValueGrid(doc, [
    ['Contrats totaux', String(data.stats.contracts)],
    ['Contrats actifs', String(data.stats.activeContracts)],
    ['Primes encaissées', formatCFA(data.stats.primes)],
    ['Paiements confirmés', String(data.stats.paid)],
    ['Paiements en attente', String(data.stats.pending)],
    ['Sinistres', String(data.stats.sinistres)],
  ], y);
  y = pdfSection(doc, 'Contrats par mois', y);
  y = pdfTable(doc, ['Mois', 'Contrats', 'Primes encaissées'], data.monthlyData.map(m => [m.month, String(m.contrats), formatCFA(m.primes || 0)]), y, [60, 45, 75]);
  y = pdfSection(doc, 'Répartition par formule', y);
  y = pdfTable(doc, ['Formule', 'Nombre', 'Poids'], data.formulaData.map(f => [f.name, String(f.value), `${data.stats.contracts ? Math.round((f.value / data.stats.contracts) * 100) : 0}%`]), y, [80, 45, 55]);
  if (data.paymentsByStatus?.length) {
    y = pdfSection(doc, 'Paiements par statut', y);
    y = pdfTable(doc, ['Statut', 'Transactions', 'Montant'], data.paymentsByStatus.map(p => [p.status, String(p.count), formatCFA(p.amount)]), y, [60, 45, 75]);
  }
  y = pdfSection(doc, 'Synthèse', y);
  doc.setFontSize(9.5); doc.setTextColor(33, 24, 48);
  doc.text(doc.splitTextToSize('Les données ci-dessus sont générées depuis les informations live de la plateforme AssurDignité. Les compteurs se mettent à jour automatiquement quand un contrat, paiement, sinistre ou utilisateur évolue.', 175), 18, y);
  pdfFooter(doc);
  doc.save(`Rapport_Admin_AssurDignite_${new Date().toISOString().slice(0,10)}.pdf`);
}

export function exportAdminReportCsv(data: AdminReportData) {
  const rows = [
    ['Section', 'Libellé', 'Valeur'],
    ['KPI', 'Contrats totaux', data.stats.contracts],
    ['KPI', 'Contrats actifs', data.stats.activeContracts],
    ['KPI', 'Primes encaissées', data.stats.primes],
    ...data.monthlyData.map(m => ['Contrats par mois', m.month, m.contrats]),
    ...data.formulaData.map(f => ['Formule', f.name, f.value]),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Rapport_Admin_AssurDignite_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}
