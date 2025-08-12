import { NextRequest } from 'next/server';
import '@/lib/init';
import { config } from '@/lib/config';
import { getStorage } from '@/lib/storage';
import { rateLimit } from '@/lib/security/rateLimit';
import { virusScan } from '@/lib/security/virusScan';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'anon';
  if (!rateLimit(ip, config.rateLimitPerHour))
    return new Response('Rate limit exceeded', { status: 429 });

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data'))
    return new Response('Expected multipart/form-data', { status: 400 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) return new Response('Missing file', { status: 400 });
  if (file.size > config.uploadMaxBytes)
    return new Response('File too large', { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (config.enableVirusScan) {
    const scan = await virusScan(buffer);
    if (!scan.clean) return new Response('File failed virus scan', { status: 400 });
  }

  const storage = getStorage();
  const meta = await storage.save(file.name, buffer);
  return Response.json({ fileId: meta.id, name: file.name, size: file.size });
}
