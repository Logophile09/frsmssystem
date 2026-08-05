import React from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return createPortal(
    // Outer layer scrolls (rather than clipping) so that on mobile browsers
    // whose address/nav bars shrink the *visible* viewport below 100vh, the
    // top of the dialog is never stranded off-screen with no way to reach it.
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 backdrop-blur-sm animate-page-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center py-8">
        <div
          className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-xl border border-transparent bg-white shadow-xl animate-modal-in dark:border-leaf-400/10 dark:bg-navy-800`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-leaf-400/10">
            <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-leaf-300"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
