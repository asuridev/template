import 'dotenv/config';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import bootstrap from './main.server';
import { initDb } from './server/db';
import partnersRouter from './server/routes/partners.routes';
import healthRouter   from './server/routes/health.routes';

// Required for better-sqlite3 native module resolution at runtime
const _require = createRequire(import.meta.url);

const serverDistFolder  = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml         = join(serverDistFolder, 'index.server.html');
const uploadsPath       = resolve(process.cwd(), process.env['STORAGE_LOCAL_PATH'] ?? 'uploads');

// ─── Initialize database ──────────────────────────────────────────────────────
initDb();

const app          = express();
const allowedHosts = (process.env['ALLOWED_HOSTS'] ?? 'localhost').split(',').map(h => h.trim());
const commonEngine = new CommonEngine({ allowedHosts });

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = (process.env['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin) || process.env['NODE_ENV'] === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// ─── Static: uploaded assets ──────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsPath));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/partners', partnersRouter);
app.use('/api/health',   healthRouter);

// ─── Static: Angular browser bundle ──────────────────────────────────────────
app.get(
  '**',
  express.static(browserDistFolder, { maxAge: '1y', index: 'index.html' }),
);

// ─── Angular SSR catch-all — MUST be last ─────────────────────────────────────
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

// ─── Start server ─────────────────────────────────────────────────────────────
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] ?? 4000;
  app.listen(port, () => {
    console.log(`[Server] Listening on http://localhost:${port}`);
  });
}

export default app;
