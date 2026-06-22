// Unified, professional PDF generation helpers for AssurDignité documents.
// All generators (police, attestation, conditions, reçu, sinistre…) share the
// same violet header bar, footer, typography and color tokens.
import jsPDF from 'jspdf';
import { SONAM_LOGO_B64, ASSURDIGNITE_LOGO_B64 } from '@/lib/pdf-logos';

export const SONAM_BRAND = {
  name: 'SONAM VIE S.A.',
  product: 'AssurDignité',
  address: 'Plateau, Immeuble Trade Center, 3ème étage, Avenue NOGUES, Abidjan',
  tel: '+225 27 20 31 71 82 / 05 95 45 21 65',
  email: 'servicecommercialsonamvie@sonam.ci',
  rccm: 'RCCM CI-ABJ-2003-B-149672',
  cima: 'Code des Assurances CIMA',
};

// Brand colors (RGB)
const VIOLET: [number, number, number] = [74, 14, 120];
const VIOLET_SOFT: [number, number, number] = [243, 232, 255];
const GREEN: [number, number, number] = [106, 176, 76];
const TEXT: [number, number, number] = [33, 24, 48];
const MUTED: [number, number, number] = [110, 110, 130];

const PAGE_W = 210;
const PAGE_H = 297;

export function pdfHeader(doc: jsPDF, subtitle?: string) {
  // Violet bar — taller for a more premium feel
  doc.setFillColor(...VIOLET);
  doc.rect(0, 0, PAGE_W, 40, 'F');

  // White rounded panel with both logos, larger and better balanced
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 6, 82, 28, 3.5, 3.5, 'F');
  try { doc.addImage(SONAM_LOGO_B64, 'PNG', 13, 9, 36, 22, undefined, 'FAST'); } catch {}
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.4);
  doc.line(52, 10, 52, 30);
  try { doc.addImage(ASSURDIGNITE_LOGO_B64, 'PNG', 55, 10, 34, 20, undefined, 'FAST'); } catch {}

  // Right-side coordinates — larger and clearer
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SONAM VIE — AssurDignité', PAGE_W - 10, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(SONAM_BRAND.tel, PAGE_W - 10, 21, { align: 'right' });
  doc.text(SONAM_BRAND.email, PAGE_W - 10, 26, { align: 'right' });
  doc.setFontSize(7.5);
  doc.text(SONAM_BRAND.address, PAGE_W - 10, 31, { align: 'right' });

  // Optional sub-bar
  if (subtitle) {
    doc.setFillColor(...GREEN);
    doc.rect(0, 40, PAGE_W, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(subtitle.toUpperCase(), PAGE_W / 2, 46.5, { align: 'center' });
  }
  doc.setTextColor(...TEXT);
}

export function pdfTitle(doc: jsPDF, title: string, y: number, ref?: string) {
  doc.setFillColor(...VIOLET_SOFT);
  doc.roundedRect(15, y, PAGE_W - 30, ref ? 22 : 16, 3, 3, 'F');
  doc.setTextColor(...VIOLET);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, PAGE_W / 2, y + (ref ? 9 : 10), { align: 'center' });
  if (ref) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    doc.text(ref, PAGE_W / 2, y + 17, { align: 'center' });
  }
  doc.setTextColor(...TEXT);
  return y + (ref ? 28 : 22);
}

export function pdfSection(doc: jsPDF, label: string, y: number) {
  doc.setFillColor(...VIOLET);
  doc.rect(15, y, 4, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...VIOLET);
  doc.text(label.toUpperCase(), 22, y + 4.5);
  doc.setDrawColor(...VIOLET);
  doc.setLineWidth(0.3);
  doc.line(15, y + 8, PAGE_W - 15, y + 8);
  doc.setTextColor(...TEXT);
  return y + 13;
}

export function pdfKeyValueGrid(
  doc: jsPDF,
  rows: Array<[string, string]>,
  y: number,
  options: { columns?: 1 | 2; rowHeight?: number } = {}
) {
  const cols = options.columns ?? 2;
  const rowHeight = options.rowHeight ?? 13;
  const colWidth = (PAGE_W - 30) / cols;
  rows.forEach((row, i) => {
    const colIndex = i % cols;
    const rowIndex = Math.floor(i / cols);
    const x = 15 + colIndex * colWidth;
    const yy = y + rowIndex * rowHeight + 4.5;
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 245, 252);
      doc.rect(x, yy - 4.5, colWidth - 2, rowHeight - 1, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(String(row[0] ?? '').toUpperCase(), x + 3, yy);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    const value = doc.splitTextToSize(row[1] ?? '—', colWidth - 6);
    doc.text(value[0] ?? '—', x + 3, yy + 5.5);
  });
  const totalRows = Math.ceil(rows.length / cols);
  return y + totalRows * rowHeight + 6;
}

export function pdfTable(
  doc: jsPDF,
  headers: string[],
  data: string[][],
  y: number,
  colWidths?: number[]
) {
  const totalWidth = PAGE_W - 30;
  const widths = colWidths ?? headers.map(() => totalWidth / headers.length);
  // Header
  doc.setFillColor(...VIOLET);
  doc.rect(15, y, totalWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let x = 15;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 5.5);
    x += widths[i];
  });
  y += 8;
  // Rows
  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  data.forEach((row, ri) => {
    if (ri % 2 === 0) {
      doc.setFillColor(248, 245, 252);
      doc.rect(15, y, totalWidth, 7, 'F');
    }
    x = 15;
    row.forEach((cell, i) => {
      const txt = doc.splitTextToSize(String(cell ?? '—'), widths[i] - 3);
      doc.text(txt[0] ?? '—', x + 2, y + 5);
      x += widths[i];
    });
    y += 7;
  });
  return y + 4;
}

export function pdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const y = PAGE_H - 18;
    doc.setDrawColor(...VIOLET);
    doc.setLineWidth(0.4);
    doc.line(15, y, PAGE_W - 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`${SONAM_BRAND.name} — ${SONAM_BRAND.rccm} — ${SONAM_BRAND.cima}`, PAGE_W / 2, y + 4, { align: 'center' });
    doc.text(SONAM_BRAND.address, PAGE_W / 2, y + 8, { align: 'center' });
    doc.setTextColor(...VIOLET);
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} / ${pageCount}`, PAGE_W - 15, y + 12, { align: 'right' });
    doc.text(SONAM_BRAND.product, 15, y + 12);
  }
}

export function newPdf(): jsPDF {
  return new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
}

/**
 * Draws a circular SONAM VIE official stamp at (cx, cy) with given radius (mm).
 * Vectorized — no image asset required. Slightly tilted for an authentic look.
 */
export function pdfSonamStamp(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius = 18,
  label = 'PAYÉ',
  dateText?: string,
) {
  // Outer ring
  doc.setDrawColor(...VIOLET);
  doc.setLineWidth(1.1);
  doc.circle(cx, cy, radius, 'S');
  // Inner ring
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, radius - 2.2, 'S');

  // Top arc text: SONAM VIE S.A.
  doc.setTextColor(...VIOLET);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const topText = 'SONAM  VIE  S.A.';
  const topChars = topText.split('');
  const topArc = Math.PI * 0.55; // arc span
  topChars.forEach((ch, i) => {
    const t = -topArc / 2 + (topArc * i) / Math.max(1, topChars.length - 1);
    const angle = -Math.PI / 2 + t; // start at top
    const r = radius - 4.5;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle) + 1.2;
    const rot = (angle + Math.PI / 2) * (180 / Math.PI);
    doc.text(ch, x, y, { angle: -rot });
  });

  // Bottom arc text: ASSURDIGNITÉ
  const bottomText = 'A S S U R D I G N I T É';
  const bChars = bottomText.split('');
  const bArc = Math.PI * 0.6;
  doc.setFontSize(6);
  bChars.forEach((ch, i) => {
    const t = -bArc / 2 + (bArc * i) / Math.max(1, bChars.length - 1);
    const angle = Math.PI / 2 + t;
    const r = radius - 4.5;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle) + 1.2;
    const rot = (angle - Math.PI / 2) * (180 / Math.PI);
    doc.text(ch, x, y, { angle: -rot });
  });

  // Center: label + date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(label.length > 6 ? 9 : 12);
  doc.setTextColor(...VIOLET);
  doc.text(label, cx, cy + (dateText ? -1 : 2), { align: 'center' });
  if (dateText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(dateText, cx, cy + 4, { align: 'center' });
  }
  doc.setTextColor(...TEXT);
}

/**
 * Inserts a signature image (dataURL PNG/JPEG) into the document, or a fallback
 * placeholder line if no signature data was captured.
 */
export function pdfSignatureBlock(
  doc: jsPDF,
  x: number,
  y: number,
  signatureDataUrl?: string | null,
  printedName?: string,
  width = 50,
  height = 18,
) {
  if (signatureDataUrl && signatureDataUrl.startsWith('data:image')) {
    try {
      const fmt = signatureDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(signatureDataUrl, fmt, x, y, width, height, undefined, 'FAST');
    } catch {
      // fallback to line
      doc.setDrawColor(...MUTED);
      doc.setLineWidth(0.3);
      doc.line(x, y + height - 2, x + width, y + height - 2);
    }
  } else {
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.3);
    doc.line(x, y + height - 2, x + width, y + height - 2);
  }
  if (printedName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(printedName, x, y + height + 4);
    doc.setTextColor(...TEXT);
  }
}

export const FORMULE_NAMES: Record<string, string> = {
  A: 'Dignité Simple',
  B: 'Serein',
  C: 'Prestige',
  D: 'Excellence',
};

export const formatDateFR = (d: string | undefined | null): string => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
};
