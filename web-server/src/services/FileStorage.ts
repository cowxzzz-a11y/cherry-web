
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Simple FileStorage for Web Server
class FileStorage {
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage', 'files');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  getStorageDir() {
    return this.storageDir;
  }

  getFilePathById(file: any): string {
    return file.path;
  }
}

export const fileStorage = new FileStorage();
