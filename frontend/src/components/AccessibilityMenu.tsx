import { useEffect, useRef, useState } from 'react';
import { Accessibility, X } from 'lucide-react';
import { useAccessibility, type FontSize } from '../context/AccessibilityContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'large', label: 'A+' },
  { value: 'x-large', label: 'A++' },
];

export function AccessibilityMenu() {
  const { fontSize, setFontSize, reducedMotion, setReducedMotion, highContrast, setHighContrast } = useAccessibility();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card shadow="lg" className="absolute bottom-14 right-0 w-72 p-5" role="dialog" aria-label="Accessibility settings">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight">Accessibility</h2>
            <button onClick={() => setOpen(false)} aria-label="Close accessibility settings" className="p-1">
              <X className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-black/70">Text size</span>
              <div className="mt-2 flex gap-2">
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={fontSize === opt.value ? 'primary' : 'outline'}
                    size="icon"
                    onClick={() => setFontSize(opt.value)}
                    aria-pressed={fontSize === opt.value}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-black/70">Reduce motion</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="h-5 w-5 accent-primary-blue"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-black/70">High contrast</span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="h-5 w-5 accent-primary-blue"
              />
            </label>
          </div>
        </Card>
      )}

      <Button
        variant="primary"
        shape="pill"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Accessibility settings"
      >
        <Accessibility className="h-5 w-5" strokeWidth={2.5} />
      </Button>
    </div>
  );
}
