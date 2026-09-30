import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { useSite } from '../../context/SiteContext';
import { Field } from '../../components/primitives';
import { Card, PanelHeader } from '../ui';

export default function NotificationsSection() {
  const { company } = useSite();
  const [status, setStatus] = useState(null);
  const [to, setTo] = useState('');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/notifications')
      .then((data) => { setStatus(data); setTo(data.inbox || company.email || ''); })
      .catch((err) => setMessage(err.message));
  }, [company.email]);

  async function sendTest(event) {
    event.preventDefault();
    setState('sending');
    setMessage('');
    try {
      await api.post('/admin/notifications/test', { to });
      setState('sent');
      setMessage(`Test email sent to ${to}. Check the inbox, and the spam folder if it has not arrived.`);
    } catch (err) {
      setState('failed');
      setMessage(err instanceof ApiError ? err.message : 'Could not send the test email.');
    }
  }

  if (!status) return <p className="text-sm text-content/66">Checking email settings…</p>;

  const live = status.configured && status.reachable;

  return (
    <div>
      <PanelHeader
        title="Email notifications"
        description="Every enquiry is saved to this console first, so nothing is ever lost. Email is an optional copy on top of that."
      />

      <Card title="Status">
        <div className={`border-l-4 px-5 py-4 ${live ? 'border-sea bg-sea/8' : 'border-beacon bg-beacon/10'}`}>
          <p className="font-display font-semibold">
            {live ? 'Email notifications are working' : 'Email notifications are off'}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-content/78">
            {live
              ? `New enquiries are being emailed to ${status.inbox}.`
              : status.configured
                ? `The mail server is configured but not reachable: ${status.error}`
                : 'Enquiries are being saved to this console only. To also receive them by email, the mail settings below need to be added on the server.'}
          </p>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ['Mail server', status.host || 'Not set'],
            ['Port', status.port || 'Not set'],
            ['Sending account', status.user || 'Not set'],
            ['Delivering to', status.inbox || 'Not set']
          ].map(([term, detail]) => (
            <div key={term}>
              <dt className="font-label text-[10px] uppercase tracking-[0.12em] text-content/65">{term}</dt>
              <dd className="mt-1 break-all text-sm">{detail}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {status.configured && (
        <Card title="Send a test">
          <form onSubmit={sendTest} noValidate className="max-w-md space-y-5">
            <Field
              label="Send to" name="testTo" type="email" required
              value={to} onChange={(e) => { setTo(e.target.value); setState('idle'); setMessage(''); }}
            />
            <button type="submit" className="btn btn-ink !py-2.5 !text-sm" disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send test email'}
            </button>
            {message && (
              <p
                role="status"
                className={`border px-4 py-2.5 text-sm ${
                  state === 'failed' ? 'border-accent-700/40 bg-accent-500/8 text-accent-700' : 'border-sea/40 bg-sea/8 text-sea'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </Card>
      )}

      <Card title="How to turn email on">
        <ol className="space-y-4 text-sm leading-relaxed text-content/80">
          <li>
            <strong className="font-display">1. Create a Gmail App Password.</strong> Turn on 2-Step
            Verification for {company.email || 'your Google account'}, then go to Google Account →
            Security → App passwords and generate one. It is a 16-character code, not your normal
            Gmail password — Google blocks normal passwords for this.
          </li>
          <li>
            <strong className="font-display">2. Add these to the server's environment</strong> (the
            hosting dashboard, or the <code className="font-label text-[13px]">.env</code> file):
            <pre className="mt-2.5 overflow-x-auto border border-line/12 bg-canvas p-4 font-label text-[12px] leading-relaxed">{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${company.email || 'you@gmail.com'}
SMTP_PASS=your-16-character-app-password
ENQUIRY_INBOX=${company.email || 'you@gmail.com'}`}</pre>
          </li>
          <li>
            <strong className="font-display">3. Restart the site</strong>, then come back here and
            send a test email.
          </li>
        </ol>
        <p className="mt-5 border-l-2 border-line/20 pl-4 text-[13px] leading-relaxed text-content/70">
          The app password is kept on the server and never stored in this console or the database,
          so it cannot leak through the admin login.
        </p>
      </Card>
    </div>
  );
}
