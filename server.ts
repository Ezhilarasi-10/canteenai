import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api';
import { db } from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Background 10-Minute Unpaid Order Check Worker
  // Runs every 10 seconds to detect orders whose payment hold time expired
  setInterval(async () => {
    try {
      const expiredCount = await db.checkAndExpireUnpaidOrders();
      if (expiredCount > 0) {
        console.log(`[CanteenIQ Background Worker] Expired and restored stock for ${expiredCount} unpaid orders.`);
      }
    } catch (err) {
      console.error('[CanteenIQ Background Worker] Error in unpaid order cleanup:', err);
    }
  }, 10000);

  if (!isProd) {
    // Development mode with Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CanteenIQ Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.APP_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[CanteenIQ Server] Failed to start:', err);
  process.exit(1);
});
