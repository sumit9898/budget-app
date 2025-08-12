import { EventEmitter } from 'events';
import { isValidMapping, IWorkKind, targetMime } from './mappings';

export type ProgressEvent = {
  stage: 'queued' | 'uploading' | 'converting' | 'preparing' | 'done' | 'failed';
  progress?: number;
  downloadUrl?: string;
  error?: string;
};

export type Job = {
  id: string;
  emitter: EventEmitter;
};

export interface ConversionService {
  createJob(input: {
    fileBuffer: Buffer;
    fileName: string;
    sourceExt: string;
    sourceKind: IWorkKind;
    targetExt: string;
  }): Promise<Job>;
}

// Default mock cloud converter to simulate real cloud provider
export class MockCloudConversion implements ConversionService {
  async createJob({ fileBuffer, fileName, sourceExt, sourceKind, targetExt }: any): Promise<Job> {
    const id = crypto.randomUUID();
    const emitter = new EventEmitter();

    if (!isValidMapping(sourceKind, targetExt)) {
      queueMicrotask(() => emitter.emit('progress', { stage: 'failed', error: 'Unsupported mapping' }));
      return { id, emitter };
    }

    // Simulate async conversion
    setTimeout(() => emitter.emit('progress', { stage: 'converting', progress: 35 }), 150);
    setTimeout(() => emitter.emit('progress', { stage: 'converting', progress: 70 }), 550);
    setTimeout(() => emitter.emit('progress', { stage: 'preparing', progress: 90 }), 900);
    setTimeout(() => emitter.emit('progress', { stage: 'done', progress: 100 }), 1200);

    return { id, emitter };
  }
}

export function deriveOutputName(inputName: string, targetExt: string) {
  return inputName.replace(/\.[^.]+$/, '') + '.' + targetExt;
}

export function fakeConvertBuffer(buf: Buffer, targetExt: string, fileName: string): Buffer {
  if (targetExt.toLowerCase() === 'pdf') {
    return generateSimplePdf(fileName);
  }
  // Create a trivial output for non-PDF targets (placeholder)
  const header = Buffer.from(
    `Converted by iWork ➜ Office Converter\nTarget: ${targetExt}\nFile: ${fileName}\n\n`,
    'utf8',
  );
  return Buffer.concat([header, buf.subarray(0, Math.min(buf.length, 1024))]);
}

export function mimeFor(targetExt: string) {
  return targetMime(targetExt);
}

// Generate a valid, minimal single-page PDF with some placeholder text.
function generateSimplePdf(fileName: string): Buffer {
  const escapePdfText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const text = `Converted placeholder for ${fileName}`;
  const contentStream = `BT /F1 24 Tf 72 720 Td (${escapePdfText(text)}) Tj ET`;

  const header = '%PDF-1.4\n';
  const objects: string[] = [];
  // 1: Catalog
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  // 2: Pages
  objects[2] = '<< /Type /Pages /Count 1 /Kids [3 0 R] >>';
  // 3: Page
  objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>';
  // 4: Contents (with stream)
  const contentLen = Buffer.byteLength(contentStream, 'utf8');
  objects[4] = `<< /Length ${contentLen} >>\nstream\n${contentStream}\nendstream`;
  // 5: Font
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  // Build file and compute xref offsets
  let offset = Buffer.byteLength(header, 'utf8');
  const parts: string[] = [header];
  const xrefOffsets: number[] = [0]; // index 0 is the free object

  for (let i = 1; i <= 5; i++) {
    const objHeader = `${i} 0 obj\n`;
    const objBody = `${objects[i]}\n`;
    const objEnd = 'endobj\n';
    xrefOffsets[i] = offset;
    parts.push(objHeader, objBody, objEnd);
    offset += Buffer.byteLength(objHeader + objBody + objEnd, 'utf8');
  }

  const xrefStart = offset;
  const pad = (n: number) => n.toString().padStart(10, '0');
  let xref = 'xref\n0 6\n';
  xref += '0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    xref += `${pad(xrefOffsets[i])} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  parts.push(xref, trailer);

  return Buffer.from(parts.join(''), 'utf8');
}
