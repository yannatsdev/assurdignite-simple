import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { formatCFA } from '@/lib/actuarial-engine';
import { Play, RotateCcw, X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  paiement: any | null;
  onResume: () => void;
  onCancelAndRestart: () => void;
}

const METHODE_LABELS: Record<string, string> = {
  orange_money: 'Orange Money',
  wave: 'Wave',
  mtn_momo: 'MTN MoMo',
  moov_money: 'Moov Money',
  virement: 'Virement bancaire',
  especes: 'Espèces',
};

export const TransactionSummaryDialog: React.FC<Props> = ({ open, onOpenChange, paiement, onResume, onCancelAndRestart }) => {
  if (!paiement) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Résumé de la transaction</DialogTitle>
          <DialogDescription>Cette transaction est en attente de validation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Row label="Référence" value={paiement.reference || paiement.id.slice(0, 8)} mono />
          <Row label="Montant" value={formatCFA(paiement.montant)} bold />
          <Row label="Méthode" value={METHODE_LABELS[paiement.methode] || paiement.methode || '—'} />
          <Row label="Date" value={new Date(paiement.date_paiement).toLocaleString('fr-FR')} />
          <div className="flex justify-between items-center py-2 border-t">
            <span className="text-sm text-muted-foreground">Statut</span>
            <StatusPill status={paiement.status} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <Button onClick={onResume} className="gap-2">
            <Play className="w-4 h-4" /> Reprendre le paiement
          </Button>
          <Button variant="outline" onClick={onCancelAndRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Annuler & recommencer
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="mt-1 gap-1">
          <X className="w-3 h-3" /> Fermer
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode; bold?: boolean; mono?: boolean }> = ({ label, value, bold, mono }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`${bold ? 'font-bold text-lg text-primary' : 'font-medium'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
);
