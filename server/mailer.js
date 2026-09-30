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

const esc = (v = '') =>
  String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* The email is laid out as the form the visitor filled in — same headings,
   labels, hints and order — with their answers in the boxes. Empty optional
   fields keep the form's placeholder, greyed, so it is obvious they were
   left blank rather than lost. Keep this in step with EnquiryForm.jsx. */

const SCOPES = [
  { value: 'domestic', label: 'Within India', detail: 'District to district' },
  { value: 'international', label: 'International', detail: 'Import or export' }
];

const MODE_LABEL = {
  '': 'Not sure — advise me', ROAD: 'Road freight', AIR: 'Air freight', SEA: 'Sea freight', MULTI: 'Multi-modal'
};

/** Describes the form as a list of sections; both the HTML and text bodies render from it. */
function describeForm(e) {
  const isQuote = e.kind === 'quote';
  const f = (label, value, opts = {}) => ({ label, value: value || '', ...opts });

  const details = {
    legend: isQuote ? 'Your details' : 'Contact details',
    rows: [
      [f('Your name', e.name, { required: true }), f('Email', e.email, { required: true })],
      [
        f('Mobile number', e.phone, { required: true, hint: 'So we can call you back about the shipment' }),
        f('Company', e.company)
      ],
      ...(isQuote ? [] : [[f('Subject', e.subject, { placeholder: 'What is this about?' })]]),
      [
        f(isQuote ? 'Anything else we should know' : 'Message', e.message, {
          required: !isQuote,
          multiline: true,
          placeholder: isQuote ? 'Cargo type, handling requirements, target delivery date…' : 'Tell us what you need moved.'
        })
      ]
    ]
  };
  if (!isQuote) return [details];

  const domestic = e.scope !== 'international';
  const end = (title, state, district) => ({
    title,
    rows: [
      [f('State', state, { placeholder: 'Start typing a state', hint: 'Optional — narrows the districts below' })],
      [f('District', district, {
        required: true,
        placeholder: 'Start typing a district',
        hint: state ? `Districts in ${state}` : 'District or city in India'
      })]
    ]
  });

  const shipment = {
    legend: 'Shipment',
    boxed: true,
    scope: e.scope || 'domestic',
    ends: domestic
      ? [end('Collected from', e.originState, e.origin), end('Delivered to', e.destinationState, e.destination)]
      : null,
    rows: [
      ...(domestic ? [] : [[
        f('Collected from', e.origin, { required: true, placeholder: 'Start typing a country', hint: 'Country of origin' }),
        f('Delivered to', e.destination, { required: true, placeholder: 'Start typing a country', hint: 'Destination country' })
      ]]),
      [
        f('Total weight', e.weight, { placeholder: 'e.g. 850 kg' }),
        f('Dimensions', e.dimensions, { placeholder: 'e.g. 120 × 80 × 90 cm' })
      ],
      [f('Preferred mode', MODE_LABEL[e.mode] ?? e.mode, { select: true })]
    ]
  };
  return [shipment, details];
}

const INK = '#11143A';
const ACCENT = '#0090D8';
const MUTED = 'color:#11143A;opacity:.62';

function htmlField(field) {
  const empty = !field.value;
  const shown = empty ? field.placeholder || '' : field.value;
  return `<div style="font-size:12px;font-weight:600;letter-spacing:.02em;margin-bottom:6px;color:${INK}">${esc(field.label)}${
    field.required ? ` <span style="color:${ACCENT}">*</span>` : ''}</div>
    <div style="border:1px solid #CBD3DF;background:#fff;padding:10px 12px;font-size:14px;line-height:1.5;${
      field.multiline ? 'min-height:72px;white-space:pre-wrap;' : ''}${empty ? 'color:#9AA3B2;' : `color:${INK};`}word-break:break-word">${
      esc(shown) || '&nbsp;'}${field.select ? '<span style="float:right;color:#9AA3B2">&#9662;</span>' : ''}</div>
    ${field.hint ? `<div style="font-size:12px;margin-top:5px;${MUTED}">${esc(field.hint)}</div>` : ''}`;
}

function htmlRows(rows) {
  return rows.map((row) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px"><tr>${
    row.map((field, i) => `<td valign="top" style="${row.length > 1 ? 'width:50%;' : ''}${i > 0 ? 'padding-left:16px;' : ''}">${htmlField(field)}</td>`).join('')
  }</tr></table>`).join('');
}

function htmlScope(selected) {
  return `<div style="font-size:12px;font-weight:600;margin-bottom:8px;color:${INK}">Type of shipment</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px"><tr>${
    SCOPES.map((o, i) => {
      const on = o.value === selected;
      return `<td valign="top" style="width:50%;${i > 0 ? 'padding-left:12px;' : ''}">
        <div style="border:1px solid ${on ? ACCENT : '#CBD3DF'};background:${on ? '#E6F4FB' : '#fff'};padding:12px 14px">
          <span style="font-size:15px;color:${on ? ACCENT : '#9AA3B2'}">${on ? '&#9673;' : '&#9675;'}</span>
          <span style="font-size:14px;font-weight:600;color:${INK};padding-left:6px">${o.label}</span>
          <div style="font-size:12px;padding-left:22px;margin-top:2px;${MUTED}">${o.detail}</div>
        </div></td>`;
    }).join('')
  }</tr></table>`;
}

function htmlSection(section) {
  const legend = `<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:16px;${MUTED}">${esc(section.legend)}</div>`;
  const ends = section.ends
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px"><tr>${
      section.ends.map((end, i) => `<td valign="top" style="width:50%;${i > 0 ? 'padding-left:16px;' : ''}">
        <div style="border:1px solid #E2E7EF;background:#FAFBFD;padding:14px 14px 0">
          <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px;${MUTED}">${end.title}</div>
          ${htmlRows(end.rows)}
        </div></td>`).join('')
    }</tr></table>`
    : '';
  const body = `${legend}${section.scope ? htmlScope(section.scope) : ''}${ends}${htmlRows(section.rows)}`;
  return section.boxed
    ? `<div style="border:1px solid #E2E7EF;background:#F7F9FC;padding:20px 20px 4px;margin-bottom:24px">${body}</div>`
    : `<div style="margin-bottom:6px">${body}</div>`;
}

function textSection(section) {
  const line = (field) => {
    const label = `${field.label}${field.required ? ' *' : ''}`;
    const value = field.value || '—';
    return field.multiline ? `${label}\n${value}` : `${label.padEnd(30)} ${value}`;
  };
  const out = [section.legend.toUpperCase()];
  if (section.scope) {
    out.push(`Type of shipment               ${SCOPES.map((o) => `${o.value === section.scope ? '(•)' : '( )'} ${o.label}`).join('   ')}`);
  }
  for (const end of section.ends || []) {
    out.push('', `  ${end.title}`, ...end.rows.flat().map((field) => `  ${line(field)}`));
  }
  if (section.ends) out.push('');
  out.push(...section.rows.flat().map(line));
  return out.join('\n');
}

export function buildBody(enquiry, company) {
  const isQuote = enquiry.kind === 'quote';
  const title = isQuote ? 'Price a shipment' : 'Send us a message';
  const sections = describeForm(enquiry);

  const text = [
    `${isQuote ? 'New quote request' : 'New message'} — ${enquiry.ref}`,
    title,
    '',
    sections.map(textSection).join('\n\n'),
    '',
    `Reply directly to this email to reach ${enquiry.name}.`
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#F2F4F8;padding:24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:${INK}">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E2E7EF">
    <div style="border-top:4px solid ${ACCENT};padding:22px 28px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#0075B0">${isQuote ? 'New quote request' : 'New message'}</td>
        <td align="right" style="font-family:ui-monospace,monospace;font-size:12px;${MUTED}">${esc(enquiry.ref)}</td>
      </tr></table>
      <div style="font-size:22px;font-weight:700;margin-top:10px">${title}</div>
    </div>
    <div style="padding:22px 28px 8px">${sections.map(htmlSection).join('')}</div>
    <div style="padding:16px 28px;background:#F7F9FC;border-top:1px solid #EEF1F6;font-size:13px;${MUTED}">
      Reply to this email to answer ${esc(enquiry.name)} directly.
    </div>
  </div>
  <div style="max-width:640px;margin:12px auto 0;font-size:11px;color:${INK};opacity:.45;text-align:center">
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
