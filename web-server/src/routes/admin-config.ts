
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { userStore } from '../store/UserStore';

const router = express.Router();
const CONFIG_FILE = path.join(process.cwd(), 'storage', 'admin_config.json');

interface AdminConfig {
  providers: any[];
  defaultModel: any | null;
  quickModel: any | null;
  translateModel: any | null;
  embeddingModel: any | null;
  rerankModel: any | null;
}

function loadConfig(): AdminConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return fs.readJsonSync(CONFIG_FILE);
    } catch {
      return getDefaultConfig();
    }
  }
  return getDefaultConfig();
}

function getDefaultConfig(): AdminConfig {
  return {
    providers: [],
    defaultModel: null,
    quickModel: null,
    translateModel: null,
    embeddingModel: null,
    rerankModel: null
  };
}

function saveConfig(config: AdminConfig) {
  fs.outputJsonSync(CONFIG_FILE, config, { spaces: 2 });
}

// Get admin config (accessible to all authenticated users)
router.get('/', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const user = userStore.getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  res.json(loadConfig());
});

// Update admin config (admin only)
router.put('/', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const user = userStore.getUserByToken(token);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const config = { ...loadConfig(), ...req.body };
  saveConfig(config);
  res.json(config);
});

export default router;
