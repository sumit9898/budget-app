import { NextRequest } from 'next/server';
import { EventEmitter } from 'events';

// Persist channels map across HMR to avoid losing listeners/jobs in dev
const g: any = global as any;
const channels: Map<string, EventEmitter> = g.__iwork_sse_channels || (g.__iwork_sse_channels = new Map());

export function getChannel(id: string) {
  let ch = channels.get(id);
  if (!ch) {
    ch = new EventEmitter();
    channels.set(id, ch);
  }
  return ch;
}

export function closeChannel(id: string) {
  channels.delete(id);
}

export function sseResponse(req: NextRequest, id: string) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      // Send an initial comment to flush headers and establish the stream promptly
      controller.enqueue(encoder.encode(`: connected\n\n`));
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const ch = getChannel(id);
      const handler = (payload: any) => send(payload);
      ch.on('progress', handler);
      req.signal.addEventListener('abort', () => {
        ch.off('progress', handler);
      });
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
