import { NextRequest } from 'next/server';
import { sseResponse } from '@/lib/events/sse';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  return sseResponse(req, params.jobId);
}

