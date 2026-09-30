import { useState } from 'react';
import { useAuth } from './AuthContext';
import { api, ApiError } from '../lib/api';
import { Field } from '../components/primitives';
import AuthShell from './AuthShell';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [view, setView] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSignIn(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server.');
      setBusy(false);
    }
  }

  async function onForgot(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot', { email: resetEmail });
      setView('sent');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach the server.');
    } finally {
      setBusy(false);
    }
  }

  if (view === 'sent') {
    return (
      <AuthShell
        title="Check your email"
        /* Worded so it says the same thing whether or not the address is on
           file — otherwise this screen becomes a way to discover accounts. */
        lede={`If ${resetEmail} belongs to an account, a reset link is on its way. It works once and expires in an hour.`}
      >
        <button type="button" onClick={() => { setView('signin'); setError(''); }} className="btn btn-accent w-full">
          Back to sign-in
        </button>
        <p className="mt-5 text-center text-[13px] leading-relaxed text-content/62">
          Nothing arrived? Check the spam folder. If email is not set up on the
          server yet, the link is written to the server log instead.
        </p>
      </AuthShell>
    );
  }

  if (view === 'forgot') {
    return (
      <AuthShell title="Reset your password" lede="Enter the email address on the account and we will send a reset link.">
        <form onSubmit={onForgot} noValidate className="space-y-5">
          {error && (
            <p role="alert" className="border border-[#B42318]/40 bg-[#B42318]/8 px-4 py-3 text-sm text-[#B42318]">
              {error}
            </p>
          )}
          <Field
            label="Email" name="resetEmail" type="email" autoComplete="username" required
            value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-accent w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          <button
            type="button"
            onClick={() => { setView('signin'); setError(''); }}
            className="w-full text-center font-label text-[12px] font-semibold text-content/70 transition-colors hover:text-accent-600"
          >
            Back to sign-in
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Staff sign-in" lede="Manage site content and enquiries.">
      <form onSubmit={onSignIn} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="border border-[#B42318]/40 bg-[#B42318]/8 px-4 py-3 text-sm text-[#B42318]">
            {error}
          </p>
        )}
        <Field
          label="Email" name="email" type="email" autoComplete="username" required
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password" name="password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-accent w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={() => { setView('forgot'); setError(''); setResetEmail(email); }}
          className="w-full text-center font-label text-[12px] font-semibold text-content/70 transition-colors hover:text-accent-600"
        >
          Forgot your password?
        </button>
      </form>
    </AuthShell>
  );
}
