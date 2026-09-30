import nodemailer from 'nodemailer';
import { getContent } from './db.js';

let transport = null;
let announced = false;

export function mailerStatus() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const configured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
  return {
    configured,
    host: SMTP_HOST || null,
    port: Number(SMTP_PORT) || (configured ? 587 : null),
    user: SMTP_USER || null,
    inbox: process.env.ENQUIRY_INBOX || getContent('company', {}).email || null
  };
}

function getTransport() {
  if (transport) return transport;
  const status = mailerStatus();
  if (!status.configured) {
    if (!announced) {
      console.log('[mailer] SMTP not configured — enquiries are stored in the database only.');
      announced = true;
    }
    return null;
  }
  transport = nodemailer.createTransport({
    host: status.host,
    port: status.port,
    secure: status.port === 465,
    auth: { user: status.user, pass: process.env.SMTP_PASS }
  });
  return transport;
}

export async function verifyTransport() {
  const mail = getTransport();
  if (!mail) return { ok: false, error: 'SMTP is not configured on the server.' };
  try {
    await mail.verify();
    return { ok: true };
  } catch (err) {
    transport = null; // force a rebuild next attempt
    return { ok: false, error: err.message };
  }
}

const SCOPE_LABEL = { domestic: 'Within India', international: 'International' };

const FIELDS = [
  ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['company', 'Company'],
  ['scopeLabel', 'Shipment type'],
  ['subject', 'Subject'], ['origin', 'Collected from'], ['destination', 'Delivered to'],
  ['mode', 'Mode'], ['weight', 'Weight'], ['dimensions', 'Dimensions']
];

const esc = (v = '') =>
  String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function buildBody(enquiry, company) {
  const enriched = { ...enquiry, scopeLabel: SCOPE_LABEL[enquiry.scope] || '' };
  const rows = FIELDS.filter(([key]) => enriched[key]);
  const lane = enquiry.origin && enquiry.destination ? `${enquiry.origin} → ${enquiry.destination}` : '';

  const text = [
    `New ${enquiry.kind} enquiry — ${enquiry.ref}`,
    lane && `Lane: ${lane}`,
    '',
    ...rows.map(([key, label]) => `${label.padEnd(16)} ${enriched[key]}`),
    enquiry.message ? `\nMessage:\n${enquiry.message}` : '',
    `\nReply directly to this email to reach ${enquiry.name}.`
  ].filter(Boolean).join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#F2F4F8;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#11143A">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E2E7EF">
    <div style="border-top:4px solid #0090D8;padding:22px 26px 18px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0075B0">New ${esc(enquiry.kind)} enquiry</div>
      <div style="font-size:21px;font-weight:700;margin-top:8px">${esc(enquiry.name)}</div>
      ${lane ? `<div style="font-size:15px;color:#11143A;opacity:.75;margin-top:5px">${esc(lane)}</div>` : ''}
      <div style="font-family:ui-monospace,monospace;font-size:12px;color:#11143A;opacity:.55;margin-top:10px">${esc(enquiry.ref)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows.map(([key, label]) => `<tr>
        <td style="padding:10px 26px;border-top:1px solid #EEF1F6;color:#11143A;opacity:.6;white-space:nowrap;width:150px">${label}</td>
        <td style="padding:10px 26px;border-top:1px solid #EEF1F6">${esc(enriched[key])}</td></tr>`).join('')}
      ${enquiry.message ? `<tr><td colspan="2" style="padding:16px 26px;border-top:1px solid #EEF1F6">
        <div style="color:#11143A;opacity:.6;font-size:12px;margin-bottom:6px">Message</div>
        <div style="white-space:pre-wrap;line-height:1.6">${esc(enquiry.message)}</div></td></tr>` : ''}
    </table>
    <div style="padding:16px 26px;background:#F7F9FC;border-top:1px solid #EEF1F6;font-size:13px;color:#11143A;opacity:.7">
      Reply to this email to answer ${esc(enquiry.name)} directly. This enquiry is also saved in your admin console.
    </div>
  </div>
  <div style="max-width:600px;margin:12px auto 0;font-size:11px;color:#11143A;opacity:.45;text-align:center">
    Sent automatically by the ${esc(company.name || 'HNXT Logistics')} website
  </div>
</body></html>`;

  return { text, html };
}

/** Fire-and-forget: a mail failure must never fail the visitor's submission. */
export async function notifyEnquiry(enquiry) {
  const mail = getTransport();
  if (!mail) return { sent: false, reason: 'not-configured' };

  const company = getContent('company', {});
  const to = process.env.ENQUIRY_INBOX || company.email;
  if (!to) return { sent: false, reason: 'no-recipient' };

  const { text, html } = buildBody(enquiry, company);
  const lane = enquiry.origin && enquiry.destination ? ` (${enquiry.origin} → ${enquiry.destination})` : '';

  await mail.sendMail({
    from: process.env.SMTP_FROM || `"${company.name || 'Website'}" <${process.env.SMTP_USER}>`,
    to,
    replyTo: `"${enquiry.name}" <${enquiry.email}>`,
    subject: `[${enquiry.ref}] ${enquiry.kind === 'quote' ? 'Quote request' : 'Enquiry'} — ${enquiry.name}${lane}`,
    text,
    html
  });
  return { sent: true };
}

/** Generic send. Returns false when SMTP is not configured. */
export async function sendMail({ to, subject, text, html, replyTo }) {
  const mail = getTransport();
  if (!mail || !to) return false;
  const company = getContent('company', {});
  await mail.sendMail({
    from: process.env.SMTP_FROM || `"${company.name || 'Website'}" <${process.env.SMTP_USER}>`,
    to, subject, text, html,
    ...(replyTo && { replyTo })
  });
  return true;
}

export async function sendTestEmail(to) {
  const mail = getTransport();
  if (!mail) return { ok: false, error: 'SMTP is not configured on the server.' };
  const company = getContent('company', {});
  try {
    await mail.sendMail({
      from: process.env.SMTP_FROM || `"${company.name || 'Website'}" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Test email from your website',
      text: 'Email notifications are working. New enquiries from the website will arrive at this address.',
      html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;color:#11143A">
        <p style="font-size:16px"><strong>Email notifications are working.</strong></p>
        <p>New enquiries submitted on the website will arrive at this address.</p></div>`
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
