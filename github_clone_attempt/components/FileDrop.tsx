"use client";

import { useCallback, useRef, useState } from 'react';

export function FileDrop({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDrag(false);
      const files = Array.from(e.dataTransfer.files || []).filter((f) =>
        /\.(pages|numbers|key)$/i.test(f.name),
      );
      if (files.length) onFiles(files);
    },
    [onFiles],
  );

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${drag ? 'border-brand bg-border/30' : 'border-border hover:border-brand/60'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') inputRef.current?.click();
      }}
      aria-label="Drop files here or browse"
    >
      <div className="text-lg font-medium mb-3">Drop your iWork files here</div>
      <div className="text-sm text-muted mb-6">or</div>
      <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>Browse</button>
      <input
        type="file"
        accept=".pages,.numbers,.key"
        multiple
        hidden
        ref={inputRef}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
}

