import type { ConversionService, Job } from '@/lib/conversion/service';
import { EventEmitter } from 'events';

// Placeholder showing intended shape. Implement real CloudConvert integration here.
export class CloudConvertService implements ConversionService {
  async createJob(): Promise<Job> {
    const id = crypto.randomUUID();
    const emitter = new EventEmitter();
    setTimeout(() => emitter.emit('progress', { stage: 'failed', error: 'CloudConvert not configured' }), 10);
    return { id, emitter };
  }
}

