import archiver from 'archiver';
import { NextRequest } from 'next/server';
import { getStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const idsParam = new URL(req.url).searchParams.get('ids') || '';
  const ids = idsParam.split(',').filter(Boolean);
  if (!ids.length) return new Response('Missing ids', { status: 400 });

  const storage = getStorage();

  const stream = new ReadableStream({
    start(controller) {
      const pass = new (require('stream').PassThrough)();
      const encoder = new TextEncoder();
      pass.on('data', (chunk: Buffer) => controller.enqueue(chunk));
      pass.on('end', () => controller.close());
      pass.on('error', (err: any) => controller.error(err));
      const arc = archiver('zip', { zlib: { level: 9 } });
      arc.pipe(pass);
      (async () => {
        for (const id of ids) {
          const loaded = await storage.load(id);
          if (!loaded) continue;
          arc.append(loaded.data, { name: loaded.meta.name });
        }
        await arc.finalize();
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="converted.zip"',
    },
  });
}

