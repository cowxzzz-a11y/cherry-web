
import fs from 'fs-extra';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'storage', 'config.json');

export class ConfigStore {
  private config: any = {
    llm: {
      providers: [
          // Add a dummy provider for testing if needed, or rely on user to configure via UI (if UI supports it)
          // For now, let's assume empty.
      ]
    }
  };

  constructor() {
    this.load();
  }

  load() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        this.config = fs.readJsonSync(CONFIG_FILE);
      } catch (e) {
          console.error("Failed to load config", e);
      }
    }
  }
  
  getState() {
      return this.config;
  }
  
  setState(newState: any) {
      this.config = newState;
      fs.outputJsonSync(CONFIG_FILE, this.config, { spaces: 2 });
  }
}
export const configStore = new ConfigStore();
