import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    custom: (item: Omit<ToastItem, 'id'>) => void;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, message, title, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) => addToast('success', message, title, duration),
    error: (message: string, title?: string, duration?: number) => addToast('error', message, title ?? 'Error', duration ?? 5000),
    warning: (message: string, title?: string, duration?: number) => addToast('warning', message, title, duration),
    info: (message: string, title?: string, duration?: number) => addToast('info', message, title, duration),
    custom: (item: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...item, id }]);
      if ((item.duration ?? 4000) > 0) {
        setTimeout(() => dismiss(id), item.duration ?? 4000);
      }
    },
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
        >
          {toasts.map((t) => {
            const icons: Record<ToastType, React.ReactNode> = {
              success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
              error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
              warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
              info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
            };

            const borderColors: Record<ToastType, string> = {
              success: 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/90 dark:bg-emerald-950/80',
              error: 'border-rose-200 dark:border-rose-800/40 bg-rose-50/90 dark:bg-rose-950/80',
              warning: 'border-amber-200 dark:border-amber-800/40 bg-amber-50/90 dark:bg-amber-950/80',
              info: 'border-sky-200 dark:border-sky-800/40 bg-sky-50/90 dark:bg-sky-950/80',
            };

            return (
              <div
                key={t.id}
                role="alert"
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-page-in ${borderColors[t.type]}`}
              >
                {icons[t.type]}
                <div className="flex-1 min-w-0 pr-1">
                  {t.title && (
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      {t.title}
                    </p>
                  )}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words">
                    {t.message}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                  aria-label="Close notification"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
