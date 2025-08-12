"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FileDrop } from '@/components/FileDrop';
import { OutputSelect } from '@/components/OutputSelect';
import { ReorderableList } from '@/components/ReorderableList';
import { formatBytes, getExt, inferTypeFromName, SUPPORTED } from '@/lib/conversion/mappings';

type QueueItem = {
  id: string;
  file: File;
  sourceExt: string;
  type: keyof typeof SUPPORTED;
  targetExt: string | null;
  progress: number;
  stage: 'queued' | 'uploading' | 'converting' | 'done' | 'failed';
  jobId?: string;
  outputId?: string;
  error?: string;
  downloadUrl?: string;
};

export default function HomePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [applyAll, setApplyAll] = useState<string | null>(null);

  const onFiles = useCallback((files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => {
        const name = file.name;
        const ext = getExt(name);
        const type = inferTypeFromName(name);
        return {
          id: crypto.randomUUID(),
          file,
          sourceExt: ext,
          type,
          targetExt: null,
          progress: 0,
          stage: 'queued' as const,
        } as QueueItem;
      }),
    ]);
  }, []);

  const validTargetsFor = useCallback((type: keyof typeof SUPPORTED) => SUPPORTED[type], []);

  const startUpload = useCallback(async (qi: QueueItem) => {
    const form = new FormData();
    form.append('file', qi.file);
    form.append('name', qi.file.name);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.fileId as string;
  }, []);

  const startConvert = useCallback(async (fileId: string, qi: QueueItem) => {
    const res = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, sourceExt: qi.sourceExt, targetExt: qi.targetExt }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.jobId as string;
  }, []);

  const attachSSE = useCallback((jobId: string, id: string) => {
    const ev = new EventSource(`/api/events/${jobId}`);
    ev.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      const match = payload.downloadUrl && /\/api\/download\/([^/?#]+)/.exec(payload.downloadUrl);
      const outputId = match?.[1] || undefined;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                stage: payload.stage,
                progress: payload.progress ?? it.progress,
                downloadUrl: payload.downloadUrl ?? it.downloadUrl,
                outputId: outputId ?? it.outputId,
                error: payload.error ?? it.error,
              }
            : it,
        ),
      );
      if (payload.stage === 'done' || payload.stage === 'failed') ev.close();
    };
    ev.onerror = () => ev.close();
  }, []);

  const kickOff = useCallback(
    async (id: string) => {
      const qi = items.find((x) => x.id === id);
      if (!qi) return;
      if (!qi.targetExt) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, error: 'Select a target format' } : it)));
        return;
      }
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, stage: 'uploading', progress: 5 } : it)));
      try {
        const fileId = await startUpload(qi);
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, stage: 'converting', progress: 10 } : it)));
        const jobId = await startConvert(fileId, qi);
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, jobId } : it)));
        attachSSE(jobId, id);
      } catch (e: any) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, stage: 'failed', error: e.message } : it)));
      }
    },
    [items, startUpload, startConvert, attachSSE],
  );

  const allDone = items.length > 0 && items.every((i) => i.stage === 'done');
  const downloadAll = async () => {
    const ids = items
      .filter((i) => i.outputId && i.stage === 'done')
      .map((i) => i.outputId as string);
    const url = `/api/download-zip?ids=${encodeURIComponent(ids.join(','))}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur border-b border-border/60 bg-bg/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">iWork ➜ Office Converter</div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-3 gap-8">
        <section className="md:col-span-2">
          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">Drop your iWork files here</h1>
              <p className="text-muted">Pages (.pages), Numbers (.numbers), Keynote (.key)</p>
            </div>
            <FileDrop onFiles={onFiles} />
            <div className="mt-6 flex items-center gap-4">
              <label className="text-sm text-muted">Output format:</label>
              <OutputSelect
                type={items[0]?.type ?? 'pages'}
                value={applyAll}
                onChange={(v) => {
                  setApplyAll(v);
                  if (v) setItems((prev) => prev.map((it) => ({ ...it, targetExt: v })));
                }}
                allowEmpty
              />
              <span className="text-sm text-muted">Apply to all</span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-8 card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Queue</h2>
                <div className="flex items-center gap-2">
                  {allDone && (
                    <button className="btn btn-primary" onClick={downloadAll}>
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download all
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => setItems([])}>
                    <TrashIcon className="w-5 h-5 mr-2" /> Clear
                  </button>
                </div>
              </div>
              <ReorderableList
                items={items}
                onReorder={(ordered) => setItems(ordered as QueueItem[])}
                renderItem={(it) => (
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{it.file.name}</div>
                        <div className="text-xs text-muted">
                          {it.type.toUpperCase()} · {formatBytes(it.file.size)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <OutputSelect
                          type={it.type}
                          value={it.targetExt}
                          onChange={(v) =>
                            setItems((prev) => prev.map((q) => (q.id === it.id ? { ...q, targetExt: v } : q)))
                          }
                        />
                        {it.stage === 'queued' && (
                          <button
                            className="btn btn-primary"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            onMouseDownCapture={(e) => e.stopPropagation()}
                            onTouchStartCapture={(e) => e.stopPropagation()}
                            onClick={() => kickOff(it.id)}
                          >
                            Convert
                          </button>
                        )}
                        {it.stage === 'failed' && (
                          <button
                            className="btn btn-primary"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            onMouseDownCapture={(e) => e.stopPropagation()}
                            onTouchStartCapture={(e) => e.stopPropagation()}
                            onClick={() => kickOff(it.id)}
                          >
                            Retry
                          </button>
                        )}
                        {it.stage === 'done' && it.downloadUrl && (
                          <a
                            className="btn btn-primary"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                            onMouseDownCapture={(e) => e.stopPropagation()}
                            onTouchStartCapture={(e) => e.stopPropagation()}
                            href={it.downloadUrl}
                          >
                            Download
                          </a>
                        )}
                        <button
                          className="btn btn-ghost"
                          onPointerDownCapture={(e) => e.stopPropagation()}
                          onMouseDownCapture={(e) => e.stopPropagation()}
                          onTouchStartCapture={(e) => e.stopPropagation()}
                          onClick={() => setItems((prev) => prev.filter((q) => q.id !== it.id))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="uppercase tracking-wide text-muted">{it.stage}</span>
                    </div>
                    <div className="mt-2 progress">
                      <span style={{ width: `${it.progress}%` }} />
                    </div>
                    {it.error && <div className="mt-2 text-danger text-sm">{it.error}</div>}
                  </div>
                )}
              />
            </div>
          )}
        </section>
        <aside>
          <div className="card p-6 sticky top-24">
            <h3 className="font-semibold mb-2">Privacy & Security</h3>
            <p className="text-sm text-muted">
              Files are processed transiently and auto-deleted after the configured time. We never log
              file contents. Optional virus scan can be enabled server-side.
            </p>
            <h3 className="font-semibold mt-6 mb-2">Supported conversions</h3>
            <ul className="text-sm text-muted list-disc pl-5 space-y-1">
              <li>Pages → .docx, .rtf, .pdf</li>
              <li>Numbers → .xlsx, .csv, .pdf</li>
              <li>Keynote → .pptx, .pdf</li>
            </ul>
            <h3 className="font-semibold mt-6 mb-2">Limitations</h3>
            <ul className="text-sm text-muted list-disc pl-5 space-y-1">
              <li>Password-protected or corrupted files may fail.</li>
              <li>Large files may take longer to upload and convert.</li>
            </ul>
          </div>
        </aside>
      </main>
      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted">
        Built with ❤️ using Next.js. No analytics by default.
      </footer>
    </div>
  );
}
