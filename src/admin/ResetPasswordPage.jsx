import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { Field } from '../components/primitives';
import AuthShell from './AuthShell';

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [status, setStatus] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    api
      .get(`/auth/reset/check?token=${encodeURIComponent(token)}`)
      .then(({ valid }) => setStatus(valid ? 'ready' : 'invalid'))
      .catch(() => setStatus('invalid'));
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.post('/auth/reset', { token, password });
      setStatus('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset the password.');
      setBusy(false);
    }
  }

  if (status === 'checking') {
    return (
      <AuthShell title="Checking your link…">
        <p className="text-center text-sm text-content/68">One moment.</p>
      </AuthShell>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthShell title="This link cannot be used" lede="Reset links work once and expire after an hour.">
        <a href="/admin" className="btn btn-accent w-full">Request a new link</a>
      </AuthShell>
    );
  }

  if (status === 'done') {
    return (
      <AuthShell title="Password changed" lede="You can sign in with your new password now.">
        <a href="/admin" className="btn btn-accent w-full">Go to sign-in</a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" lede="This link works once and expires an hour after it was sent.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="border border-[#B42318]/40 bg-[#B42318]/8 px-4 py-3 text-sm text-[#B42318]">
            {error}
          </p>
        )}
        <Field
          label="New password" name="newPassword" type="password" autoComplete="new-password" required
          hint="At least 10 characters" value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit" className="btn btn-accent w-full" disabled={busy}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  );
}
