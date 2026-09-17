import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Drop-in replacement for a native <select>.
 *
 * A native <select>'s dropdown is positioned entirely by the browser, which
 * tries to align the currently-selected option with the trigger — for a long
 * list with a selection near the bottom, that pushes the whole panel *up*
 * and off the top of the screen. On top of that, our edit forms live inside
 * a scrollable Modal (`overflow-y-auto`), so even a plain CSS-positioned
 * dropdown would get clipped instead of floating above the dialog.
 *
 * This component measures the trigger itself and portals the panel to
 * document.body with `position: fixed`, so it always renders below the
 * field (falling back to "above" only on the rare occasion there truly
 * isn't room below), is never clipped by the modal, and stays put while the
 * modal scrolls underneath it.
 */
export default function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ top: number; left: number; width: number; maxHeight: number; openUp: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const reposition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const desired = 264; // ~ max-h-64 plus a little breathing room
    const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(desired, openUp ? spaceAbove : spaceBelow));
    setPlacement({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleScrollOrResize = () => reposition();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field-input flex items-center justify-between gap-2 text-left"
      >
        <span className={selected ? '' : 'text-muted-foreground'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        placement &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: placement.openUp ? undefined : placement.top,
              bottom: placement.openUp ? window.innerHeight - placement.top : undefined,
              left: placement.left,
              width: placement.width,
              maxHeight: placement.maxHeight,
            }}
            className="z-[2100] overflow-y-auto rounded-2xl border border-border bg-card p-1 shadow-2xl animate-page-in"
          >
            {options.map((o) => {
              const isSelected = String(o.value) === String(value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(String(o.value));
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    isSelected ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
