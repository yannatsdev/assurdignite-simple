import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export function OcrSkeleton({ label = 'Analyse IA de votre pièce…' }: { label?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-primary font-medium">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export function KycSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function PdfSkeleton({ label = 'Génération du document…' }: { label?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> {label}
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
