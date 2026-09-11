import { MemoryStorageProvider } from '../src/services/storage.service';

describe('Object Storage Abstraction', () => {
  let storage: MemoryStorageProvider;

  beforeEach(() => {
    storage = new MemoryStorageProvider();
  });

  it('should upload a file and verify its existence', async () => {
    const key = 'evidence/test-image.jpg';
    const buffer = Buffer.from('fake-image-bytes');
    const contentType = 'image/jpeg';

    const url = await storage.uploadFile(key, buffer, contentType);
    expect(url).toBeDefined();

    const exists = await storage.fileExists(key);
    expect(exists).toBe(true);
  });

  it('should return false for non-existent file', async () => {
    const exists = await storage.fileExists('non-existent.jpg');
    expect(exists).toBe(false);
  });

  it('should delete a file', async () => {
    const key = 'evidence/delete-test.jpg';
    await storage.uploadFile(key, Buffer.from('test'), 'image/jpeg');

    expect(await storage.fileExists(key)).toBe(true);

    await storage.deleteFile(key);
    expect(await storage.fileExists(key)).toBe(false);
  });

  it('should throw error when getting URL for non-existent file', async () => {
    await expect(storage.getFileUrl('missing.jpg')).rejects.toThrow('File not found');
  });
});
