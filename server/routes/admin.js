import { Router } from 'express';
import { z } from 'zod';
import db, { getContent, setContent, audit } from '../db.js';
import { requireAuth, changePassword } from '../auth.js';
import { mailerStatus, verifyTransport, sendTestEmail } from '../mailer.js';

const router = Router();
router.use(requireAuth);

const bad = (res, error) => res.status(400).json({ error });

/* ── Editable content blocks ─────────────────────────────────────────── */

const SCHEMAS = {
  company: z.object({
    name: z.string().trim().min(1, 'Company name is required.').max(120),
    legalName: z.string().trim().max(160).default(''),
    tagline: z.string().trim().max(200).default(''),
    email: z.union([z.string().trim().email('Enter a valid email address.'), z.literal('')]).default(''),
    phone: z.string().trim().max(40).default(''),
    whatsapp: z.string().trim().max(40).default(''),
    addressLine1: z.string().trim().max(200).default(''),
    addressLine2: z.string().trim().max(200).default(''),
    city: z.string().trim().max(80).default(''),
    state: z.string().trim().max(80).default(''),
    pincode: z.string().trim().max(20).default(''),
    country: z.string().trim().max(80).default(''),
    hours: z.string().trim().max(160).default(''),
    gstin: z.string().trim().max(40).default(''),
    /* The empty-string branch must come first: z.coerce.number() turns ''
       into 0, so a union that tries it first silently pins the business at
       latitude 0, longitude 0 — a point in the Atlantic. */
    latitude: z.union([z.literal(''), z.coerce.number().min(-90).max(90)]).default(''),
    longitude: z.union([z.literal(''), z.coerce.number().min(-180).max(180)]).default(''),
    mapsUrl: z.union([z.string().trim().url('Enter a full URL, including https://'), z.literal('')]).default(''),
    instagram: z.union([z.string().trim().url('Enter a full URL, including https://'), z.literal('')]).default(''),
    linkedin: z.union([z.string().trim().url('Enter a full URL, including https://'), z.literal('')]).default(''),
    facebook: z.union([z.string().trim().url('Enter a full URL, including https://'), z.literal('')]).default('')
  }),
  seo: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(400).default(''),
    keywords: z.string().trim().max(400).default('')
  }),
  home: z.object({
    eyebrow: z.string().trim().max(160).default(''),
    heading: z.string().trim().min(1, 'A headline is required.').max(200),
    lede: z.string().trim().max(800).default(''),
    primaryCta: z.object({ label: z.string().trim().max(60), to: z.string().trim().max(120) }),
    secondaryCta: z.object({ label: z.string().trim().max(60), to: z.string().trim().max(120) }),
    stats: z.array(z.object({
      value: z.string().trim().max(20),
      unit: z.string().trim().max(40),
      label: z.string().trim().max(200)
    })).max(4).default([]),
    processHeading: z.string().trim().max(160).default(''),
    processLede: z.string().trim().max(400).default(''),
    process: z.array(z.object({
      code: z.string().trim().max(8),
      title: z.string().trim().max(80),
      text: z.string().trim().max(500)
    })).max(6).default([])
  }),
  about: z.object({
    heading: z.string().trim().min(1).max(200),
    lede: z.string().trim().max(1000).default(''),
    body: z.array(z.string().trim().max(2000)).max(8).default([]),
    values: z.array(z.object({
      title: z.string().trim().max(100),
      text: z.string().trim().max(500)
    })).max(8).default([])
  }),
  popup: z.object({
    enabled: z.coerce.number().int().min(0).max(1).default(1),
    /* Ten seconds by default. Anything under three reads as an ambush and
       risks Google's intrusive-interstitial penalty on mobile. */
    delaySeconds: z.coerce.number().int().min(3).max(120).default(10),
    heading: z.string().trim().min(1, 'A heading is required.').max(120),
    body: z.string().trim().max(600).default(''),
    ctaLabel: z.string().trim().max(60).default(''),
    ctaTo: z.string().trim().max(120).default(''),
    dismissDays: z.coerce.number().int().min(0).max(365).default(1)
  }),
  lanes: z.array(z.object({
    origin: z.string().trim().max(20),
    destination: z.string().trim().max(20),
    mode: z.string().trim().max(20),
    service: z.string().trim().max(30)
  })).max(20)
};

router.get('/content/:key', (req, res) => {
  if (!SCHEMAS[req.params.key]) return res.status(404).json({ error: 'Unknown content block.' });
  res.json(getContent(req.params.key, null));
});

router.put('/content/:key', (req, res) => {
  const schema = SCHEMAS[req.params.key];
  if (!schema) return res.status(404).json({ error: 'Unknown content block.' });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) fields[issue.path.join('.')] = issue.message;
    return res.status(400).json({ error: 'Some details need fixing.', fields });
  }

  setContent(req.params.key, parsed.data);
  audit(req.user.email, 'content.update', req.params.key);
  res.json(parsed.data);
});

/* ── Services ────────────────────────────────────────────────────────── */

const serviceSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.').max(80),
  title: z.string().trim().min(1, 'A title is required.').max(120),
  mode: z.enum(['ROAD', 'AIR', 'SEA', 'MULTI']),
  summary: z.string().trim().max(400).default(''),
  body: z.string().trim().max(4000).default(''),
  lane: z.string().trim().max(120).default(''),
  transit: z.string().trim().max(80).default(''),
  featured: z.coerce.number().int().min(0).max(1).default(0),
  published: z.coerce.number().int().min(0).max(1).default(1),
  sort_order: z.coerce.number().int().default(0)
});

router.get('/services', (_req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY sort_order, id').all());
});

router.post('/services', (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, parsed.error.issues[0].message);
  const s = parsed.data;
  try {
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO services (slug, title, mode, summary, body, lane, transit, featured, published, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(s.slug, s.title, s.mode, s.summary, s.body, s.lane, s.transit, s.featured, s.published, s.sort_order);
    audit(req.user.email, 'service.create', s.slug);
    res.status(201).json(db.prepare('SELECT * FROM services WHERE id = ?').get(lastInsertRowid));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return bad(res, 'That URL slug is already in use.');
    throw err;
  }
});

router.put('/services/:id', (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, parsed.error.issues[0].message);
  const s = parsed.data;
  try {
    const { changes } = db
      .prepare(`UPDATE services SET slug=?, title=?, mode=?, summary=?, body=?, lane=?, transit=?,
                featured=?, published=?, sort_order=?, updated_at=datetime('now') WHERE id=?`)
      .run(s.slug, s.title, s.mode, s.summary, s.body, s.lane, s.transit, s.featured, s.published, s.sort_order, req.params.id);
    if (!changes) return res.status(404).json({ error: 'Service not found.' });
    audit(req.user.email, 'service.update', s.slug);
    res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return bad(res, 'That URL slug is already in use.');
    throw err;
  }
});

router.delete('/services/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Service not found.' });
  audit(req.user.email, 'service.delete', `id:${req.params.id}`);
  res.json({ ok: true });
});

/* ── FAQs ────────────────────────────────────────────────────────────── */

const faqSchema = z.object({
  question: z.string().trim().min(1, 'A question is required.').max(300),
  answer: z.string().trim().min(1, 'An answer is required.').max(3000),
  published: z.coerce.number().int().min(0).max(1).default(1),
  sort_order: z.coerce.number().int().default(0)
});

router.get('/faqs', (_req, res) => {
  res.json(db.prepare('SELECT * FROM faqs ORDER BY sort_order, id').all());
});

router.post('/faqs', (req, res) => {
  const parsed = faqSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, parsed.error.issues[0].message);
  const f = parsed.data;
  const { lastInsertRowid } = db
    .prepare('INSERT INTO faqs (question, answer, published, sort_order) VALUES (?, ?, ?, ?)')
    .run(f.question, f.answer, f.published, f.sort_order);
  audit(req.user.email, 'faq.create', `id:${lastInsertRowid}`);
  res.status(201).json(db.prepare('SELECT * FROM faqs WHERE id = ?').get(lastInsertRowid));
});

router.put('/faqs/:id', (req, res) => {
  const parsed = faqSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, parsed.error.issues[0].message);
  const f = parsed.data;
  const { changes } = db
    .prepare(`UPDATE faqs SET question=?, answer=?, published=?, sort_order=?, updated_at=datetime('now') WHERE id=?`)
    .run(f.question, f.answer, f.published, f.sort_order, req.params.id);
  if (!changes) return res.status(404).json({ error: 'FAQ not found.' });
  audit(req.user.email, 'faq.update', `id:${req.params.id}`);
  res.json(db.prepare('SELECT * FROM faqs WHERE id = ?').get(req.params.id));
});

router.delete('/faqs/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM faqs WHERE id = ?').run(req.params.id);
  if (!changes) return res.status(404).json({ error: 'FAQ not found.' });
  audit(req.user.email, 'faq.delete', `id:${req.params.id}`);
  res.json({ ok: true });
});

/* ── Enquiry inbox ───────────────────────────────────────────────────── */

router.get('/enquiries', (req, res) => {
  const status = req.query.status;
  const valid = ['new', 'in-progress', 'closed'];
  const rows = valid.includes(status)
    ? db.prepare('SELECT * FROM enquiries WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 500').all(status)
    : db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC LIMIT 500').all();

  const counts = db.prepare('SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status').all();
  res.json({
    enquiries: rows,
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])),
    total: db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n
  });
});

router.patch('/enquiries/:id', (req, res) => {
  const parsed = z.object({ status: z.enum(['new', 'in-progress', 'closed']) }).safeParse(req.body);
  if (!parsed.success) return bad(res, 'Choose a valid status.');
  const { changes } = db
    .prepare('UPDATE enquiries SET status = ? WHERE id = ?')
    .run(parsed.data.status, req.params.id);
  if (!changes) return res.status(404).json({ error: 'Enquiry not found.' });
  audit(req.user.email, 'enquiry.status', `id:${req.params.id}→${parsed.data.status}`);
  res.json(db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id));
});

router.delete('/enquiries/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM enquiries WHERE id = ?').run(req.params.id);
  if (!changes) return res.status(404).json({ error: 'Enquiry not found.' });
  audit(req.user.email, 'enquiry.delete', `id:${req.params.id}`);
  res.json({ ok: true });
});

/* ── Account ─────────────────────────────────────────────────────────── */

router.post('/account/password', (req, res) => {
  const parsed = z
    .object({
      currentPassword: z.string().min(1, 'Enter your current password.'),
      newPassword: z.string().min(10, 'Use at least 10 characters.').max(200)
    })
    .safeParse(req.body);
  if (!parsed.success) return bad(res, parsed.error.issues[0].message);

  const result = changePassword(req.user, parsed.data.currentPassword, parsed.data.newPassword);
  if (!result.ok) return bad(res, result.error);
  res.json({ ok: true });
});

/* ── Email notifications ─────────────────────────────────────────────── */

router.get('/notifications', async (_req, res) => {
  const status = mailerStatus();
  const check = status.configured ? await verifyTransport() : { ok: false, error: null };
  res.json({ ...status, reachable: check.ok, error: check.error });
});

router.post('/notifications/test', async (req, res) => {
  const parsed = z.object({ to: z.string().trim().email('Enter a valid email address.') }).safeParse(req.body);
  if (!parsed.success) return bad(res, parsed.error.issues[0].message);
  const result = await sendTestEmail(parsed.data.to);
  audit(req.user.email, 'notifications.test', result.ok ? 'sent' : 'failed');
  if (!result.ok) return res.status(502).json({ error: result.error });
  res.json({ ok: true });
});

router.get('/activity', (_req, res) => {
  res.json(db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 40').all());
});

export default router;
