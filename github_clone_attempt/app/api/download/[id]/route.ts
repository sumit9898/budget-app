import { NextRequest } from 'next/server';
import { getStorage } from '@/lib/storage';
import { targetMime } from '@/lib/conversion/mappings';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const storage = getStorage();
  const loaded = await storage.load(params.id);
  if (!loaded) return new Response('Not found', { status: 404 });
  const { meta, data } = loaded;
  const m = /\.([^.]+)$/.exec(meta.name);
  const ext = (m?.[1] || '').toLowerCase();
  const mime = targetMime(ext);
  return new Response(data, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      'Cache-Control': 'no-store',
    },
  });
}

