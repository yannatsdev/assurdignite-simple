import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  loading?: boolean;
  /** Custom right-side button (replaces next). */
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Sticky action bar — fixed on mobile, in-flow on desktop.
 * Ensures consistent navigation across every macro step.
 */
export function StickyActionBar({
  onPrev, onNext, prevLabel = 'Retour', nextLabel = 'Suivant',
  prevDisabled, nextDisabled, loading, rightSlot, className,
}: Props) {
  return (
    <>
      {/* Spacer to prevent fixed bar from covering content on mobile */}
      <div className="h-20 md:hidden" aria-hidden />
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur',
          'md:static md:bg-transparent md:border-0 md:backdrop-blur-0',
          'p-3 md:p-0 md:pt-4',
          className,
        )}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-2 md:gap-3">
          {onPrev && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              disabled={prevDisabled || loading}
              className="flex-1 md:flex-none h-12 md:h-10 gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="text-sm">{prevLabel}</span>
            </Button>
          )}
          {rightSlot ? (
            <div className="flex-1 md:flex-none md:ml-auto">{rightSlot}</div>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || loading}
              className="flex-1 md:flex-none md:ml-auto h-12 md:h-10 gap-1.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className="text-sm font-medium">{nextLabel}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export default StickyActionBar;
