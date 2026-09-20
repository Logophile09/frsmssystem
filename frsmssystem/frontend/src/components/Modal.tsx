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
      className="fixed inset-0 z-[2000] overflow-y-auto bg-foreground/30 p-4 backdrop-blur-sm animate-page-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center py-8">
        <div
          className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl animate-modal-in`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
            <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
