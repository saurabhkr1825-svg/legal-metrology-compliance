import { config } from '../config';

/**
 * Storage provider interface for object storage (S3 / MinIO / Local Disk).
 */
export interface StorageProvider {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
}

/**
 * Memory/Mock storage provider for testing and offline development.
 */
export class MemoryStorageProvider implements StorageProvider {
  private store: Map<string, { buffer: Buffer; contentType: string }> = new Map();

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    this.store.set(key, { buffer, contentType });
    return `memory://${config.storage.bucket}/${key}`;
  }

  async getFileUrl(key: string): Promise<string> {
    if (!this.store.has(key)) {
      throw new Error(`File not found: ${key}`);
    }
    return `${config.storage.endpoint}/${config.storage.bucket}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    this.store.delete(key);
  }

  async fileExists(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}

// Default storage provider instance (uses MemoryStorageProvider for dev/testing, easily swapped to S3)
export const storageService: StorageProvider = new MemoryStorageProvider();
