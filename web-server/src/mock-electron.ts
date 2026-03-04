
import path from 'path';
import os from 'os';

console.log('Initializing Mock Electron for Web Server...');

const userDataPath = path.join(process.cwd(), 'storage', 'userData');
const tempPath = os.tmpdir();

export const app = {
  getPath: (name: string) => {
    switch (name) {
      case 'userData': return userDataPath;
      case 'temp': return tempPath;
      case 'home': return os.homedir();
      default: return tempPath;
    }
  },
  getVersion: () => '1.0.0-web',
  getName: () => 'CherryStudioWeb',
  getLocale: () => 'en-US',
  getAppPath: () => process.cwd()
};

export const ipcMain = {
  handle: (channel: string, listener: any) => {
    // console.log(`Mock ipcMain.handle: ${channel}`);
  },
  on: (channel: string, listener: any) => {
    // console.log(`Mock ipcMain.on: ${channel}`);
  },
  emit: () => {},
  removeHandler: () => {}
};

export const shell = {
  openExternal: async (url: string) => { console.log(`Open external: ${url}`); }
};

export const dialog = {
  showOpenDialog: async () => ({ filePaths: [], canceled: true }),
  showSaveDialog: async () => ({ filePath: '', canceled: true })
};

export const BrowserWindow = {
  getAllWindows: () => []
};

export const net = {
  fetch: global.fetch
};

export default { app, ipcMain, shell, dialog, BrowserWindow, net };
