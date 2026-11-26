import { useState } from 'react';
import type { DragEvent, KeyboardEvent, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

type Tone = 'emerald' | 'sky';

// Classes completas (não montadas por string) para o Tailwind enxergá-las no build.
const TONES: Record<Tone, { idle: string; drag: string; icon: string }> = {
  emerald: {
    idle: 'border-[#2E2E38] hover:border-emerald-500/50 hover:bg-emerald-500/5',
    drag: 'border-emerald-400 bg-emerald-500/10',
    icon: 'text-emerald-400'
  },
  sky: {
    idle: 'border-[#2E2E38] hover:border-sky-500/50 hover:bg-sky-500/5',
    drag: 'border-sky-400 bg-sky-500/10',
    icon: 'text-sky-400'
  }
};

interface UploadDropzoneProps {
  icon: ReactNode;
  title: string;
  hint: string;
  tone: Tone;
  /** Decide se o arquivo solto é aceito (o seletor nativo já filtra via `accept`). */
  accept: (file: File) => boolean;
  rejectMessage: string;
  onFile: (file: File) => void;
  /** Abre o seletor de arquivos (reaproveita o input escondido do card). */
  onBrowse: () => void;
  busy?: boolean;
  busyLabel?: string;
}

export default function UploadDropzone({
  icon,
  title,
  hint,
  tone,
  accept,
  rejectMessage,
  onFile,
  onBrowse,
  busy = false,
  busyLabel = 'Lendo arquivo…'
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = TONES[tone];

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!accept(file)) {
      setError(rejectMessage);
      return;
    }
    setError(null);
    onFile(file);
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (busy) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onBrowse();
    }
  };

  return (
    <div
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-disabled={busy}
      aria-label={`${title}. ${hint}`}
      onClick={() => {
        if (!busy) {
          setError(null);
          onBrowse();
        }
      }}
      onKeyDown={handleKey}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={handleDrop}
      className={`rounded-md border border-dashed px-3 py-3.5 flex items-center gap-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
        busy ? 'border-[#2E2E38] bg-[#0E0E11] cursor-wait' : `cursor-pointer ${dragging ? t.drag : `bg-[#0E0E11] ${t.idle}`}`
      }`}
    >
      <div className={`shrink-0 ${busy ? 'text-[#A1A1AA]' : t.icon}`}>
        {busy ? <RefreshCw size={18} className="animate-spin" /> : icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[#E4E4E7]">
          {busy ? busyLabel : dragging ? 'Solte o arquivo aqui' : title}
        </div>
        {!busy && <div className="text-[11px] font-mono text-[#71717A] mt-0.5">{hint}</div>}
        {error && !busy && (
          <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-rose-300">
            <AlertTriangle size={11} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
