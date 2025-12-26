import express from 'express';
import cors from 'cors';
import { config } from './config';
import syncRoutes from './api/sync.routes';
import pluginsRoutes from './api/plugins.routes';
import authRoutes from './api/auth.routes';
import { authMiddleware } from './middleware/auth';
import * as fs from 'fs';
import * as path from 'path';

// Fix BigInt serialization in JSON
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);
app.use('/api/plugins', pluginsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const jarStoragePath = path.resolve(config.jarStoragePath);
if (!fs.existsSync(jarStoragePath)) {
  fs.mkdirSync(jarStoragePath, { recursive: true });
  console.log(`Created JAR storage directory: ${jarStoragePath}`);
}

app.listen(config.port, () => {
  console.log(`Backend server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`JAR storage: ${jarStoragePath}`);
});
