import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { seed } from './seed.js';
import publicRoutes from './routes/public.js';
import seoRoutes from './routes/seo.js';
import { renderShell } from './render.js';
import { LEGACY_REDIRECTS } from './seo-meta.js';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');
const isProd = process.env.NODE_ENV === 'production';

/* seed.js is the single source of site content. Reloading it on every boot
   means an edit there goes live on the next deploy, and a host that wipes
   its filesystem on restart (Render's free tier) comes back with the full
   site. */
seed({ force: true });

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: isProd && {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ['https://www.google.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use(compression());
app.use(express.json({ limit: '256kb' }));

const limit = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message } });

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, uptime: Math.round(process.uptime()), time: new Date().toISOString() })
);

/* Crawler files are generated from the database, not served as static assets. */
app.use('/', seoRoutes);

/* Reads are generous — office and mobile-carrier NAT put many genuine
   visitors behind one IP. Writes stay tight, because that is the endpoint
   worth abusing. */
app.use('/api/site', limit(60 * 1000, 120, 'Too many requests. Slow down a moment.'));
/* Submissions are the endpoint worth abusing, so the budget stays small.
   Configurable because a shared office IP can legitimately send several. */
const enquiryMax = Number(process.env.ENQUIRY_RATE_MAX) || 10;
app.use('/api/enquiries', limit(10 * 60 * 1000, enquiryMax, 'Too many submissions. Try again shortly, or email us directly.'));

app.use('/api', limit(60 * 1000, 120, 'Too many requests. Slow down a moment.'), publicRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

/* Static SPA — every non-API path falls through to index.html so deep links work. */
if (existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: isProd ? '1y' : 0, index: false }));
  app.get('/{*splat}', (req, res) => {
    const origin = process.env.PUBLIC_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;

    /* Old URLs move with a 301 so their existing search ranking follows
       them, rather than being spent on a client-side redirect. */
    const moved = LEGACY_REDIRECTS[req.path];
    if (moved) return res.redirect(301, moved);

    const { html, status } = renderShell(join(distDir, 'index.html'), origin, req.path);
    res.status(status).type('html').set('Cache-Control', 'no-cache').send(html);
  });
} else {
  app.get('/{*splat}', (_req, res) =>
    res.status(503).send('Frontend not built yet. Run `npm run build`, then start the server.')
  );
}

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, () => {
  console.log(`HNXT server listening on http://localhost:${port}`);
  if (!existsSync(distDir)) console.log('Frontend build not found — run `npm run build` for production.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}

export default app;
