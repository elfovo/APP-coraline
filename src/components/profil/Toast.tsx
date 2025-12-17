'use client';

import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  message: string | null;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[60] flex flex-col gap-3">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur-md min-w-[240px] border ${
              type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-50'
                : 'bg-red-500/15 border-red-500/40 text-red-50'
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

