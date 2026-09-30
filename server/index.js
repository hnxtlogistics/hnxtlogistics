import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { issueSession, clearSession, verifyCredentials, requireAuth } from './auth.js';
import { audit } from './db.js';
import publicRoutes from './routes/public.js';
import seoRoutes from './routes/seo.js';
import { renderShell } from './render.js';
import { LEGACY_REDIRECTS } from './seo-meta.js';
import {
  createResetToken, consumeResetToken, isResetTokenValid, sendResetEmail
} from './password-reset.js';
import adminRoutes from './routes/admin.js';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');
const isProd = process.env.NODE_ENV === 'production';

/* Fail at boot, not on the first request: a production deploy missing its
   secret must never start and quietly 500 on every sign-in. */
function assertConfig() {
  if (!isProd) return;
  const problems = [];
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    problems.push('JWT_SECRET must be set to at least 24 characters.');
  }
  if (problems.length) {
    console.error('\nRefusing to start — configuration is incomplete:');
    for (const problem of problems) console.error('  · ' + problem);
    console.error('\nGenerate a secret with:  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
  }
}

assertConfig();

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
app.use(cookieParser());

const limit = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message } });

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, uptime: Math.round(process.uptime()), time: new Date().toISOString() })
);

/* Auth — rate limited hard, since these are the credential endpoints. */
app.post(
  '/api/auth/login',
  limit(15 * 60 * 1000, 10, 'Too many sign-in attempts. Try again in 15 minutes.'),
  (req, res) => {
    const { email, password } = req.body ?? {};
    const user = verifyCredentials(email, password);
    if (!user) return res.status(401).json({ error: 'Email or password is incorrect.' });
    issueSession(res, user);
    audit(user.email, 'auth.login');
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }
);

app.post('/api/auth/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

/* ── Password reset ───────────────────────────────────────────────────
   Every response is identical whether or not the address exists: a
   different reply would turn this endpoint into a way to discover which
   accounts are real. */
app.post(
  '/api/auth/forgot',
  limit(15 * 60 * 1000, 5, 'Too many reset requests. Try again in 15 minutes.'),
  async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const origin = process.env.PUBLIC_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;

    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const issued = createResetToken(email);
      if (issued) {
        audit(email, 'password.reset.request');
        sendResetEmail(issued, origin).catch((err) =>
          console.error('[password reset] could not send:', err.message)
        );
      }
    }

    res.json({ ok: true });
  }
);

app.get('/api/auth/reset/check', (req, res) =>
  res.json({ valid: isResetTokenValid(req.query.token) })
);

app.post(
  '/api/auth/reset',
  limit(15 * 60 * 1000, 10, 'Too many attempts. Try again in 15 minutes.'),
  (req, res) => {
    const { token, password } = req.body ?? {};
    if (typeof password !== 'string' || password.length < 10) {
      return res.status(400).json({ error: 'Use at least 10 characters.' });
    }
    const result = consumeResetToken(token, password);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  }
);

/* Crawler files are generated from the database, not served as static assets. */
app.use('/', seoRoutes);

/* Admin routes mount first and carry their own, roomier budget. Mounting
   them under the public limiter would count every keystroke-driven save
   against a 30/min visitor allowance and lock staff out mid-edit. */
app.use('/api/admin', limit(60 * 1000, 300, 'Too many requests. Wait a moment and retry.'), adminRoutes);

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
