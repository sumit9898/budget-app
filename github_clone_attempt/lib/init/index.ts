import { config } from '@/lib/config';
import { getStorage } from '@/lib/storage';

declare global {
  // eslint-disable-next-line no-var
  var __iwork_init_done: boolean | undefined;
}

if (!global.__iwork_init_done) {
  global.__iwork_init_done = true;
  // Start periodic cleanup for in-memory storage
  const ttl = config.autoDeleteMinutes * 60 * 1000;
  const storage = getStorage();
  if (storage.list) {
    setInterval(async () => {
      try {
        const list = await storage.list!();
        const now = Date.now();
        await Promise.all(
          list
            .filter((f) => now - f.createdAt > ttl)
            .map((f) => storage.delete(f.id).catch(() => {})),
        );
      } catch {}
    }, 60_000).unref?.();
  }
}

