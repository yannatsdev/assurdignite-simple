import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  /** Class added to the wrapper for the skeleton background. */
  wrapperClassName?: string;
}

/**
 * Image with skeleton loader + automatic fallback if loading fails.
 * Use anywhere a remote/large image is shown so the layout never collapses.
 */
export function SmartImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
  wrapperClassName,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const finalSrc = errored ? fallback : src;

  return (
    <div className={cn('relative w-full h-full overflow-hidden', wrapperClassName)}>
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-accent/30 to-muted"
        />
      )}
      <img
        {...rest}
        src={finalSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true); }}
        className={cn(
          'transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
}
