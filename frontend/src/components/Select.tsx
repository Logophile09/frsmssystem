import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Custom dropdown that replaces native <select>/<option>.
 *
 * Native selects hand their open dropdown list off to the OS/browser to
 * render, and on some platforms (seen on Windows + Brave) that popup shows
 * up as an oversized, mostly-blank white box that swallows the option text
 * — completely unstylable from our CSS since it's outside the page's paint
 * layer. Rendering our own listbox keeps it inside the page (same dark
 * glass styling as the rest of the auth forms) so it always looks the same
 * regardless of OS/browser.
 */
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
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Hidden native input so HTML5 `required` validation still applies
          on form submit, without using a real <select>. */}
      {required && <input tabIndex={-1} aria-hidden className="sr-only" required value={value} onChange={() => {}} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-leaf-400/20 disabled:opacity-60 ${
          open ? 'border-leaf-400 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'
        }`}
      >
        <span className={value ? 'text-white' : 'text-navy-400'}>{value || placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-navy-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-navy-900 py-1 shadow-xl shadow-black/40">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-white/10 ${
                opt === value ? 'text-leaf-300' : 'text-white/90'
              }`}
            >
              {opt}
              {opt === value && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
