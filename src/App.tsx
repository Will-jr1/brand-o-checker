import { useState } from 'react';
import type { DragEvent, KeyboardEvent, ReactNode } from 'react';
import { RefreshCw, AlertCircle, UploadCloud } from 'lucide-react';

type Tone = 'emerald' | 'sky';

const TONES: Record<Tone, { idle: string; drag: string; badge: string }> = {
  emerald: {
    idle: 'border-slate-200/90 bg-slate-50/70 hover:bg-emerald-50/40 hover:border-emerald-300',
    drag: 'border-emerald-400 bg-emerald-50/80 ring-4 ring-emerald-500/10',
    badge: 'bg-emerald-500/10 text-emerald-700'
  },
  sky: {
    idle: 'border-slate-200/90 bg-slate-50/70 hover:bg-blue-50/40 hover:border-blue-300',
    drag: 'border-blue-400 bg-blue-50/80 ring-4 ring-blue-500/10',
    badge: 'bg-blue-500/10 text-blue-700'
  }
};

interface UploadDropzoneProps {
  icon: ReactNode;
  title: string;
  hint: string;
  tone: Tone;
  accept: (file: File) => boolean;
  rejectMessage: string;
  onFile: (file: File) => void;
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
  busyLabel = 'Lendo arquivo...'
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
      className={`rounded-xl border border-dashed px-4 py-3.5 flex items-center gap-3.5 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
        busy
          ? 'border-slate-200 bg-slate-50 cursor-wait'
          : `cursor-pointer ${dragging ? t.drag : t.idle}`
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.badge}`}>
        {busy ? <RefreshCw size={17} className="animate-spin" /> : icon || <UploadCloud size={17} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-800">
          {busy ? busyLabel : dragging ? 'Solte o arquivo para enviar' : title}
        </div>
        {!busy && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{hint}</div>}
        {error && !busy && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
            <AlertCircle size={12} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!busy && (
        <span className="text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-[var(--shadow-pill)] shrink-0">
          Selecionar
        </span>
      )}
    </div>
  );
}