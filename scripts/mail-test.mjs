/**
 * Sends a test email using the SMTP settings in .env, so the settings can
 * be checked before deploying. Enquiries only reach anyone by email.
 *
 *   npm run mail:test -- you@example.com
 */
import 'dotenv/config';
import { sendTestEmail } from '../server/mailer.js';

const to = process.argv[2] || process.env.ENQUIRY_INBOX;
if (!to) {
  console.error('Usage: npm run mail:test -- you@example.com');
  process.exit(1);
}

const result = await sendTestEmail(to);
console.log(result.ok ? `Sent a test email to ${to}.` : `Could not send: ${result.error}`);
process.exit(result.ok ? 0 : 1);
