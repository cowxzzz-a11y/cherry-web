
import 'tsconfig-paths/register';
import './mock-electron'; // Must be first

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

import { chatRoutes } from './routes/chat';
import knowledgeRoutes from './routes/knowledge';
import authRoutes from './routes/auth';
import adminConfigRoutes from './routes/admin-config';

dotenv.config();

// Ensure storage directories exist
const storageDir = path.join(process.cwd(), 'storage');
const uploadsDir = path.join(storageDir, 'uploads');
const filesDir = path.join(storageDir, 'files');
const kbDir = path.join(storageDir, 'KnowledgeBase');

[storageDir, uploadsDir, filesDir, kbDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/admin/config', adminConfigRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/v1/knowledge-bases', knowledgeRoutes);

// Serve static files from the frontend build (we will build this later)
const staticPath = path.join(__dirname, '../../web-client/dist');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
