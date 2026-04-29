import { ChevronLeft, X } from 'lucide-react';

interface Props {
  progress: number; // 0..1
  onBack?: () => void;
  onClose?: () => void;
}

export function KycProgressBar({ progress, onBack, onClose }: Props) {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <button
        onClick={onBack}
        disabled={!onBack}
        className="p-2 rounded-full hover:bg-muted disabled:opacity-30 transition"
        aria-label="Retour"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(4, Math.min(100, progress * 100))}%` }}
        />
      </div>
      {onClose && (
        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition" aria-label="Fermer">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
