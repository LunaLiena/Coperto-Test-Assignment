'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useUIStore } from '@/features/stop-list/model/ui-store';

const AUTO_DISMISS_MS = 4000;

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} message={toast.message} tone={toast.tone} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  id: string;
  message: string;
  tone: 'error' | 'success';
  onDismiss: (id: string) => void;
}

function ToastItem({ id, message, tone, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      role="status"
      className={`pointer-events-auto flex items-start justify-between gap-3 rounded-md border px-3.5 py-3 text-sm shadow-panel ${
        tone === 'error'
          ? 'border-accent/30 bg-white text-accent-hover'
          : 'border-success/30 bg-white text-success'
      }`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="text-xs text-muted hover:text-ink"
        aria-label="Скрыть уведомление"
      >
        ✕
      </button>
    </motion.div>
  );
}
