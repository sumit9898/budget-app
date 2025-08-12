import { NextRequest } from 'next/server';
import { z } from 'zod';
import '@/lib/init';
import { getStorage } from '@/lib/storage';
import { deriveOutputName, fakeConvertBuffer, mimeFor } from '@/lib/conversion/service';
import { getChannel } from '@/lib/events/sse';
import { conversionQueue } from '@/lib/queue';
import { isValidMapping, inferTypeFromName } from '@/lib/conversion/mappings';
import { analytics } from '@/lib/analytics';
import { rateLimit } from '@/lib/security/rateLimit';
import { config } from '@/lib/config';
import { convertLocalMacOS } from '@/lib/conversion/providers/local-macos';
import { extractEmbeddedPdf } from '@/lib/conversion/providers/embedded-preview';

export const runtime = 'nodejs';

const schema = z.object({
  fileId: z.string(),
  sourceExt: z.string(),
  targetExt: z.string(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'anon';
  if (!rateLimit(ip as string, Number(process.env.RATE_LIMIT_PER_HOUR || 60)))
    return new Response('Rate limit exceeded', { status: 429 });
  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) return new Response('Invalid body', { status: 400 });
  const { fileId, sourceExt, targetExt } = parse.data;

  const storage = getStorage();
  const loaded = await storage.load(fileId);
  if (!loaded) return new Response('File not found', { status: 404 });
  const { meta, data } = loaded;
  const kind = inferTypeFromName(meta.name);
  if (!isValidMapping(kind, targetExt))
    return new Response('Unsupported target format', { status: 400 });

  const jobId = crypto.randomUUID();
  const ch = getChannel(jobId);
  analytics.track('conversion_started', { jobId, source: sourceExt, target: targetExt });

  // Conversion via queue (local macOS or mock)
  conversionQueue.push(async () => {
    try {
      ch.emit('progress', { stage: 'converting', progress: 25 });
      await new Promise((r) => setTimeout(r, 400));
      ch.emit('progress', { stage: 'converting', progress: 65 });
      await new Promise((r) => setTimeout(r, 400));
      const outName = deriveOutputName(meta.name, targetExt);
      let outBuf: Buffer | null = null;
      if (targetExt.toLowerCase() === 'pdf') {
        // Try to extract embedded QuickLook PDF (no external tools)
        outBuf = await extractEmbeddedPdf(data);
      }
      if (!outBuf) {
        outBuf =
          config.backend === 'local' && process.platform === 'darwin'
            ? await convertLocalMacOS(data, meta.name, targetExt)
            : fakeConvertBuffer(data, targetExt, meta.name);
      }
      const outMeta = await storage.save(outName, outBuf);
      const url = `/api/download/${outMeta.id}`;
      ch.emit('progress', { stage: 'done', progress: 100, downloadUrl: url });
      analytics.track('conversion_succeeded', { jobId });
    } catch (e: any) {
      ch.emit('progress', { stage: 'failed', error: e.message || 'Conversion failed' });
      analytics.track('conversion_failed', { jobId });
    }
  });

  return Response.json({ jobId });
}
