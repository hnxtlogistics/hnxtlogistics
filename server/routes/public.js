import { Router } from 'express';
import { z } from 'zod';
import db, { getContent } from '../db.js';
import { notifyEnquiry } from '../mailer.js';

const router = Router();

/** Everything the public site needs to render, in one round trip. */
router.get('/site', (_req, res) => {
  res.json({
    company: getContent('company', {}),
    home: getContent('home', {}),
    about: getContent('about', {}),
    seo: getContent('seo', {}),
    popup: getContent('popup', {}),
    lanes: getContent('lanes', []),
    services: db
      .prepare(
        `SELECT slug, title, mode, summary, body, lane, transit, featured
         FROM services WHERE published = 1 ORDER BY sort_order, id`
      )
      .all(),
    faqs: db
      .prepare('SELECT question, answer FROM faqs WHERE published = 1 ORDER BY sort_order, id')
      .all()
  });
});

const trimmed = (max) => z.string().trim().max(max);

const enquirySchema = z.object({
  kind: z.enum(['contact', 'quote']).default('contact'),
  scope: z.enum(['domestic', 'international', '']).default(''),
  name: trimmed(120).min(2, 'Enter your name.'),
  email: trimmed(160).email('Please enter a valid email ID.'),
  phone: trimmed(40).default(''),
  company: trimmed(160).default(''),
  subject: trimmed(200).default(''),
  message: trimmed(4000).default(''),
  origin: trimmed(120).default(''),
  destination: trimmed(120).default(''),
  mode: trimmed(40).default(''),
  weight: trimmed(60).default(''),
  dimensions: trimmed(120).default(''),
  /** Honeypot — must stay empty. Bots fill it, humans never see it. */
  website: z.string().max(0).optional().default('')
});

function makeRef() {
  const n = db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n + 1;
  return `HNXT-${String(n).padStart(5, '0')}`;
}

router.post('/enquiries', async (req, res) => {
  const parsed = enquirySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) fields[issue.path.join('.')] = issue.message;
    return res.status(400).json({ error: 'Some details need fixing.', fields });
  }

  const data = parsed.data;
  if (data.website) return res.status(202).json({ ok: true, ref: makeRef() });

  if (data.kind === 'quote' && (!data.origin || !data.destination)) {
    return res.status(400).json({
      error: 'Some details need fixing.',
      fields: {
        origin: data.origin ? undefined : 'Where is the cargo collected from?',
        destination: data.destination ? undefined : 'Where is it going?'
      }
    });
  }
  if (!data.phone || data.phone.replace(/\D/g, '').length < 7) {
    return res.status(400).json({
      error: 'Some details need fixing.',
      fields: { phone: 'Enter a mobile number we can call you back on.' }
    });
  }
  if (data.kind === 'contact' && data.message.length < 10) {
    return res
      .status(400)
      .json({ error: 'Some details need fixing.', fields: { message: 'Tell us a little more — at least 10 characters.' } });
  }

  const ref = makeRef();
  db.prepare(
    `INSERT INTO enquiries (kind, scope, name, email, phone, company, subject, message, origin, destination, mode, weight, dimensions, ref)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.kind, data.scope, data.name, data.email, data.phone, data.company, data.subject,
    data.message, data.origin, data.destination, data.mode, data.weight, data.dimensions, ref
  );

  /* The visitor's response never waits on SMTP. Email is the only place an
     enquiry is read, so when it does not go out the full enquiry is written
     to the server log, which is where it can still be recovered from. */
  const logUnsent = (why) =>
    console.error(`[enquiry] ${ref} NOT emailed (${why}):`, JSON.stringify({ ...data, ref }));
  notifyEnquiry({ ...data, ref })
    .then((result) => {
      if (result?.sent) db.prepare('UPDATE enquiries SET mailed = 1 WHERE ref = ?').run(ref);
      else logUnsent(result?.reason || 'unknown');
    })
    .catch((err) => logUnsent(err.message));

  res.status(201).json({ ok: true, ref });
});

export default router;
