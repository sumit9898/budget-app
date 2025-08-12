import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config as appConfig } from '@/lib/config';

export type StoredFile = { id: string; name: string; size: number; createdAt: number };

export interface StorageAdapter {
  save(name: string, data: Buffer): Promise<StoredFile>;
  load(id: string): Promise<{ meta: StoredFile; data: Buffer } | null>;
  delete(id: string): Promise<void>;
  url?(id: string): Promise<string | null>;
  list?(): Promise<StoredFile[]>;
}

// Persist in-memory storage across dev hot reloads by attaching to global
const g: any = global as any;
const memoryStore: Map<string, { meta: StoredFile; data: Buffer }> =
  g.__iwork_memory_store || (g.__iwork_memory_store = new Map());

export class MemoryStorage implements StorageAdapter {
  async save(name: string, data: Buffer): Promise<StoredFile> {
    const id = crypto.randomUUID();
    const meta = { id, name, size: data.length, createdAt: Date.now() };
    memoryStore.set(id, { meta, data });
    return meta;
  }
  async load(id: string) {
    return memoryStore.get(id) || null;
  }
  async delete(id: string) {
    memoryStore.delete(id);
  }
  async list() {
    return Array.from(memoryStore.values()).map((v) => v.meta);
  }
}

export class DiskStorage implements StorageAdapter {
  base = path.resolve(process.cwd(), appConfig.diskPath);
  async ensureDir() {
    await fs.mkdir(this.base, { recursive: true });
  }
  async save(name: string, data: Buffer): Promise<StoredFile> {
    await this.ensureDir();
    const id = crypto.randomUUID();
    const filePath = path.join(this.base, id);
    await fs.writeFile(filePath, data);
    return { id, name, size: data.length, createdAt: Date.now() };
  }
  async load(id: string) {
    try {
      const filePath = path.join(this.base, id);
      const data = await fs.readFile(filePath);
      // We don't persist meta; build minimal
      return { meta: { id, name: 'file', size: data.length, createdAt: Date.now() }, data };
    } catch {
      return null;
    }
  }
  async delete(id: string) {
    try {
      await fs.unlink(path.join(this.base, id));
    } catch {}
  }
}

export class S3Storage implements StorageAdapter {
  client = new S3Client({ region: process.env.AWS_REGION });
  bucket = process.env.AWS_S3_BUCKET as string;
  async save(name: string, data: Buffer): Promise<StoredFile> {
    const id = crypto.randomUUID();
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: id, Body: data, Metadata: { name } }),
    );
    return { id, name, size: data.length, createdAt: Date.now() };
  }
  async load(id: string) {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: id }),
    );
    // @ts-ignore
    const chunks: Buffer[] = [];
    // @ts-ignore
    const stream = res.Body as any;
    if (!stream) return null;
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const data = Buffer.concat(chunks);
    const name = res.Metadata?.name || 'file';
    return { meta: { id, name, size: data.length, createdAt: Date.now() }, data };
  }
  async delete(id: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: id }));
  }
}

export function getStorage(): StorageAdapter {
  switch (appConfig.storageDriver) {
    case 'disk':
      return new DiskStorage();
    case 's3':
      return new S3Storage();
    default:
      return new MemoryStorage();
  }
}
