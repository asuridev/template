import * as fs from 'node:fs';
import * as path from 'node:path';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

export class StorageService {
  private readonly basePath: string;
  private readonly publicUrl: string;

  constructor() {
    this.basePath = path.resolve(process.env['STORAGE_LOCAL_PATH'] ?? './uploads');
    this.publicUrl =
      process.env['STORAGE_PUBLIC_URL'] ?? 'http://localhost:4000/uploads';
  }

  save(partnerId: string, type: string, buffer: Buffer, mimeType: string): string {
    const ext = MIME_EXTENSIONS[mimeType] ?? 'bin';
    const dir = path.join(this.basePath, 'partners', partnerId);
    fs.mkdirSync(dir, { recursive: true });

    this.removeExisting(dir, type);

    const filename = `${type}.${ext}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);

    return `${this.publicUrl}/partners/${partnerId}/${filename}`;
  }

  delete(partnerId: string, type: string): void {
    const dir = path.join(this.basePath, 'partners', partnerId);
    this.removeExisting(dir, type);
  }

  isReachable(): boolean {
    try {
      fs.mkdirSync(this.basePath, { recursive: true });
      const testFile = path.join(this.basePath, '.health');
      fs.writeFileSync(testFile, '1');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private removeExisting(dir: string, type: string): void {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(`${type}.`));
    for (const file of files) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

export const storageService = new StorageService();
