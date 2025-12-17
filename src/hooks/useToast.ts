import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  content: string;
}

export function useToast(autoHideDelay = 4000) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (content: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, content }]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Auto-hide toasts
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        hideToast(toast.id);
      }, autoHideDelay),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, autoHideDelay]);

  return {
    toasts,
    showToast,
    hideToast,
    clearToasts,
  };
}
