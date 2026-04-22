import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster: string;
  title?: string;
  badge?: string;
  className?: string;
}

/** Stylized video player with custom poster overlay and a fullscreen modal. */
export function VideoPlayer({ src, poster, title, badge, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const toggle = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { await v.play().catch(() => {}); setPlaying(true); setStarted(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  // Lock body scroll when fullscreen modal open
  useEffect(() => {
    if (fullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [fullscreen]);

  // ESC closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  return (
    <>
      <div className={cn('group relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-black aspect-video', className)}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Poster overlay before first play */}
        <AnimatePresence>
          {!started && (
            <motion.button
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              type="button"
              onClick={toggle}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-black/30 cursor-pointer"
            >
              <img
                src={poster}
                alt={title || 'Vidéo'}
                className="absolute inset-0 w-full h-full object-cover -z-10"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20 -z-10" />
              {badge && (
                <span className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg">
                  {badge}
                </span>
              )}
              {title && (
                <h3 className="text-white text-xl sm:text-3xl md:text-4xl font-display font-bold text-center px-4 max-w-2xl mb-6 drop-shadow-2xl">
                  {title}
                </h3>
              )}
              <motion.span
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/95 hover:bg-white text-primary flex items-center justify-center shadow-2xl"
              >
                <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1" />
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom control bar (after first play) */}
        {started && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={toggle} className="text-white hover:text-secondary transition-colors" aria-label={playing ? 'Pause' : 'Lecture'}>
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-secondary transition-colors" aria-label={muted ? 'Activer le son' : 'Couper le son'}>
              {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <div className="flex-1" />
            <button onClick={() => setFullscreen(true)} className="text-white hover:text-secondary transition-colors" aria-label="Plein écran">
              <Maximize2 className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Top-left badge */}
        {badge && started && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-xs sm:text-sm font-bold shadow-lg">
            {badge}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-6"
            onClick={() => setFullscreen(false)}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.video
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={src}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
