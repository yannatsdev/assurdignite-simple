import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, X, AlertTriangle, Loader2, FileCheck, CreditCard } from 'lucide-react';

export type StatusKind =
  | 'active' | 'paid' | 'approved' | 'completed'
  | 'pending' | 'processing' | 'in_review'
  | 'failed' | 'cancelled' | 'rejected'
  | 'declared' | 'draft' | 'expired';

interface StatusPillProps {
  status: StatusKind | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  active:     { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Check className="w-3 h-3" />, label: 'Actif' },
  paid:       { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Check className="w-3 h-3" />, label: 'Payé' },
  approved:   { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Check className="w-3 h-3" />, label: 'Approuvé' },
  completed:  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <FileCheck className="w-3 h-3" />, label: 'Clôturé' },
  pending:    { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" />, label: 'En attente' },
  processing: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'En traitement' },
  in_review:  { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Loader2 className="w-3 h-3" />, label: 'En revue' },
  declared:   { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <AlertTriangle className="w-3 h-3" />, label: 'Déclaré' },
  draft:      { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Clock className="w-3 h-3" />, label: 'Brouillon' },
  failed:     { color: 'bg-red-100 text-red-700 border-red-200', icon: <X className="w-3 h-3" />, label: 'Échoué' },
  cancelled:  { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <X className="w-3 h-3" />, label: 'Annulé' },
  rejected:   { color: 'bg-red-100 text-red-700 border-red-200', icon: <X className="w-3 h-3" />, label: 'Rejeté' },
  expired:    { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <Clock className="w-3 h-3" />, label: 'Expiré' },
};

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className, size = 'sm' }) => {
  const cfg = map[status] || { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <CreditCard className="w-3 h-3" />, label: status };
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
      size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      cfg.color,
      className
    )}>
      {cfg.icon}
      {label || cfg.label}
    </span>
  );
};
