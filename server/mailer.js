import nodemailer from 'nodemailer';
import { getContent } from './db.js';

let transport = null;
let announced = false;

function mailerStatus() {
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
      console.warn('[mailer] SMTP not configured — enquiries will NOT reach anyone. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
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

/* Without SMTP_FROM, send as the company's own address, never the SMTP
   login: relay logins such as Brevo's xxx@smtp-brevo.com are not mailboxes
   and are not covered by the domain's DKIM, so Gmail files them as spam. */
function senderFor(company) {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const address = company.email || process.env.SMTP_USER;
  return `"${company.name || 'Website'}" <${address}>`;
}

const addressOf = (header = '') => (header.match(/<([^>]+)>/)?.[1] || header).trim();
const quoteName = (name) => `"${String(name).replace(/["\\\r\n]/g, '')}"`;

/* Enquiries go to the company inbox, so sending them from that same address
   makes every one arrive "from me to me" — which also reads as spoofing and
   lands in junk. They come from a separate address on the same (Brevo
   authenticated) domain instead, named after the customer, so the inbox
   shows who wrote. */
function enquirySender(enquiry, company) {
  const domain = addressOf(senderFor(company)).split('@')[1];
  const address = process.env.ENQUIRY_FROM || (domain ? `website@${domain}` : addressOf(senderFor(company)));
  return `${quoteName(`${enquiry.name} via ${company.name || 'website'}`)} <${address}>`;
}

const SCOPE_LABEL = { domestic: 'Within India', international: 'International' };
const MODE_LABEL = { ROAD: 'Road freight', AIR: 'Air freight', SEA: 'Sea freight', MULTI: 'Multi-modal' };

const esc = (v = '') =>
  String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Quotes and contact messages land in the same inbox, so each kind has its
   own colour, heading and layout: a quote leads with the lane and the
   shipment, a contact message leads with what the person wrote. */
const KINDS = {
  quote: { label: 'Quote request', band: '#0090D8', tint: '#E6F4FB' },
  contact: { label: 'Contact message', band: '#11143A', tint: '#EEF0F7' }
};

const laneOf = (e) => (e.origin && e.destination ? `${e.origin} → ${e.destination}` : '');

function sectionsFor(e) {
  const customer = {
    title: 'Customer',
    rows: [['Name', e.name], ['Email', e.email], ['Phone', e.phone], ['Company', e.company]]
  };
  if (e.kind !== 'quote') {
    return {
      headline: e.subject || 'General enquiry',
      byline: `From ${e.name}${e.company ? ` · ${e.company}` : ''}`,
      message: { title: 'Message', body: e.message },
      tables: [customer]
    };
  }
  return {
    headline: laneOf(e) || 'Shipment quote',
    byline: `Requested by ${e.name}${e.company ? ` · ${e.company}` : ''}`,
    tables: [
      {
        title: 'Shipment',
        rows: [
          ['Shipment type', SCOPE_LABEL[e.scope]],
          ['Collected from', e.origin],
          ['Delivered to', e.destination],
          ['Total weight', e.weight],
          ['Dimensions', e.dimensions],
          ['Preferred mode', MODE_LABEL[e.mode] || e.mode || 'Not sure — advise me']
        ]
      },
      customer
    ],
    message: e.message ? { title: 'Anything else we should know', body: e.message } : null
  };
}

function buildBody(enquiry, company) {
  const kind = KINDS[enquiry.kind] || KINDS.contact;
  const isQuote = enquiry.kind === 'quote';
  const { headline, byline, tables, message } = sectionsFor(enquiry);
  const filled = (rows) => rows.filter(([, value]) => value);

  /* There is deliberately no Reply-To header (see notifyEnquiry), so the way
     back to the customer is this button, which opens a new email to them. */
  const replySubject = `Re: ${enquiry.subject || (isQuote ? 'Your quote request' : 'Your enquiry')} [${enquiry.ref}]`;
  const replyHref = `mailto:${enquiry.email}?subject=${encodeURIComponent(replySubject)}`;

  const textTable = (t) => [t.title.toUpperCase(), ...filled(t.rows).map(([l, v]) => `${l.padEnd(16)} ${v}`)].join('\n');
  const textMessage = message && `${message.title.toUpperCase()}\n${message.body}`;
  const text = [
    `${kind.label.toUpperCase()} — ${enquiry.ref}`,
    headline,
    byline,
    '',
    ...(isQuote ? [...tables.map(textTable), textMessage] : [textMessage, ...tables.map(textTable)])
      .filter(Boolean)
      .flatMap((block) => [block, '']),
    `To reply, write to ${enquiry.name} at ${enquiry.email}. The normal Reply button does not reach them.`
  ].join('\n');

  const heading = (title) =>
    `<div style="padding:18px 26px 8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#11143A;opacity:.55">${esc(title)}</div>`;
  const htmlTable = (t) => `${heading(t.title)}
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${filled(t.rows).map(([label, value]) => `<tr>
        <td style="padding:10px 26px;border-top:1px solid #EEF1F6;color:#11143A;opacity:.6;white-space:nowrap;width:150px">${label}</td>
        <td style="padding:10px 26px;border-top:1px solid #EEF1F6">${esc(value)}</td></tr>`).join('')}
    </table>`;
  const htmlMessage = message && `${heading(message.title)}
    <div style="margin:0 26px 8px;padding:14px 16px;background:${kind.tint};border-left:3px solid ${kind.band};white-space:pre-wrap;line-height:1.6;font-size:15px">${esc(message.body)}</div>`;
  const blocks = isQuote ? [...tables.map(htmlTable), htmlMessage] : [htmlMessage, ...tables.map(htmlTable)];

  const html = `<!doctype html><html><body style="margin:0;background:#F2F4F8;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#11143A">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E2E7EF">
    <table role="presentation" style="width:100%;border-collapse:collapse;background:${kind.band}"><tr>
      <td style="padding:12px 26px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff">${kind.label}</td>
      <td style="padding:12px 26px;text-align:right;font-family:ui-monospace,monospace;font-size:12px;color:#fff;opacity:.85">${esc(enquiry.ref)}</td>
    </tr></table>
    <div style="padding:22px 26px 10px">
      <div style="font-size:21px;font-weight:700;line-height:1.35">${esc(headline)}</div>
      <div style="font-size:14px;color:#11143A;opacity:.65;margin-top:6px">${esc(byline)}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px"><tr>
        <td style="background:${kind.band}"><a href="${esc(replyHref)}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:700;color:#fff;text-decoration:none">Reply to ${esc(enquiry.name)}</a></td>
      </tr></table>
    </div>
    ${blocks.filter(Boolean).join('')}
    <div style="margin-top:14px;padding:16px 26px;background:#F7F9FC;border-top:1px solid #EEF1F6;font-size:13px;color:#11143A;opacity:.7">
      Use the <strong>Reply to ${esc(enquiry.name)}</strong> button above — the normal Reply button does not reach them.
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

  /* No Reply-To: a customer's Gmail/Yahoo address in Reply-To under a From
     on our domain is a classic phishing pattern (SpamAssassin
     FREEMAIL_FORGED_REPLYTO, +2.5) and was the largest reason enquiries were
     junked. The email carries a reply button to the customer instead. */
  await mail.sendMail({
    from: enquirySender(enquiry, company),
    to,
    subject: enquiry.kind === 'quote'
      ? `Quote request: ${laneOf(enquiry) || 'shipment'} — ${enquiry.name} [${enquiry.ref}]`
      : `Contact message: ${enquiry.subject || 'general enquiry'} — ${enquiry.name} [${enquiry.ref}]`,
    text,
    html
  });
  return { sent: true };
}

export async function sendTestEmail(to) {
  const mail = getTransport();
  if (!mail) return { ok: false, error: 'SMTP is not configured on the server.' };
  const company = getContent('company', {});
  try {
    await mail.sendMail({
      from: senderFor(company),
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
