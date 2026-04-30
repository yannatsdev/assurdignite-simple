import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const SimulationBadge: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[11px] sm:text-xs font-semibold text-amber-800 ${className || ''}`}
  >
    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
      <Sparkles className="h-3.5 w-3.5" />
    </motion.span>
    Mode simulation — aucun débit réel
  </motion.div>
);
