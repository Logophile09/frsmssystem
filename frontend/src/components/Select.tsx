import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// Accepts either a plain string or an explicit {value, label} pair, so
// callers with human-readable option lists (Register's POSITION_OPTIONS)
// and callers with id-backed lookups (CrudPage's establishment/personnel
// dropdowns) can both use this component without extra mapping.
export type SelectOption = string | { value: string | number; label: string };

/**
 * Custom dropdown that replaces native <select>/<option>.
 *
 * Native selects hand their open dropdown list off to the OS/browser to
 * render, and on some platforms (seen on Windows + Brave) that popup shows
 * up as an oversized, mostly-blank white box that swallows the option text
 * — completely unstylable from our CSS since it's outside the page's paint
 * layer, and positioned/flipped however the OS decides (often upward, if
 * the field sits low on screen). Rendering our own listbox keeps it inside
 * the page (same dark glass styling as the rest of the app) and always
 * opens directly below the field, so it always looks and behaves the same
 * regardless of OS/browser.
 */
type SelectOption = string | { value: string | number; label: string };

function optionValue(opt: SelectOption): string {
  return typeof opt === 'string' ? opt : String(opt.value);
}

function optionLabel(opt: SelectOption): string {
  return typeof opt === 'string' ? opt : opt.label;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  required,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Whether the panel has room to open downward. Recomputed each time the
  // dropdown opens, so a select near the bottom of the viewport (e.g. inside
  // a modal) flips its list above the trigger instead of overflowing off
  // screen or under other content.
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const PANEL_MAX_HEIGHT = 256; // matches max-h-64 below

  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : { value: String(o.value), label: o.label },
  );
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleToggle() {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Only flip up when below is genuinely too tight AND above has more
      // room — otherwise default stays down, which is the expected reading
      // direction for a dropdown.
      setOpenUp(spaceBelow < PANEL_MAX_HEIGHT && spaceAbove > spaceBelow);
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Hidden native input so HTML5 `required` validation still applies
          on form submit, without using a real <select>. */}
      {required && <input tabIndex={-1} aria-hidden className="sr-only" required value={value} onChange={() => {}} />}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 ${
          open
            ? 'border-primary bg-primary/10 text-foreground'
            : 'border-border bg-muted/60 text-foreground hover:border-primary/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20'
        }`}
      >
<span className={value ? 'text-foreground dark:text-white font-medium' : 'text-muted-foreground dark:text-navy-400'}>
          {value ? optionLabel(options.find((o) => optionValue(o) === value) ?? value) : placeholder}

        </span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {open && (
<div
          className={`absolute left-0 right-0 z-30 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-navy-900 ${
            openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {options.map((opt) => {
            const optVal = optionValue(opt);
            return (
              <button
                key={optVal}
                type="button"
                onClick={() => {
                  onChange(optVal);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-accent hover:text-foreground ${
                  optVal === value ? 'font-bold text-primary dark:text-leaf-300 bg-primary/5' : 'text-foreground dark:text-white/90'
                }`}
              >
                {optionLabel(opt)}
                {optVal === value && <Check size={14} className="shrink-0 text-primary dark:text-leaf-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
