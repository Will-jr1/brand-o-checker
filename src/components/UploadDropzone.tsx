import { useState } from 'react';
import type { DragEvent, KeyboardEvent, ReactNode } from 'react';

type Tone = 'emerald' | 'sky';

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
  title,
  hint,
  accept,
  rejectMessage,
  onFile,
  onBrowse,
  busy = false,
  busyLabel = 'LENDO ARQUIVO...'
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      className={`border border-dashed px-3.5 py-3 flex items-center justify-between gap-3 text-left transition-colors outline-none focus-visible:bg-[#0A0A0A] focus-visible:text-white ${
        busy
          ? 'border-[#0A0A0A]/40 bg-[#F5F5F5] text-[#525252] cursor-wait'
          : dragging
          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white cursor-pointer'
          : 'border-[#0A0A0A]/60 bg-white text-[#0A0A0A] hover:border-[#0A0A0A] hover:bg-[#FAFAFA] cursor-pointer'
      }`}
    >
      <div className="min-w-0">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] font-medium">
          {busy ? busyLabel : dragging ? 'SOLTE O ARQUIVO' : title}
        </div>
        {!busy && (
          <div
            className={`font-mono text-[10px] uppercase tracking-[0.04em] mt-0.5 ${
              dragging ? 'text-white/70' : 'text-[#737373]'
            }`}
          >
            {hint}
          </div>
        )}
        {error && !busy && (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[#DC2626]">
            ERR // {error}
          </div>
        )}
      </div>

      <span
        className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 border shrink-0 ${
          dragging
            ? 'border-white text-white'
            : 'border-[#0A0A0A] text-[#0A0A0A]'
        }`}
      >
        {busy ? 'WAIT' : '+ FILE'}
      </span>
    </div>
  );
}